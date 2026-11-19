import { contours } from 'd3-contour'
import polygon from 'polygon-clipping'
import { fromLonLat, toLonLat } from 'ol/proj.js'

export function withinImage([west, south, east, north], ring) {
  return ring.every(([lon, lat]) => lon >= west && lon <= east && lat >= south && lat <= north)
}

function imageCoordinates(image, width, height) {
  const [west, south, east, north] = image.projectedExtent
  return {
    toPixel(point) {
      const [x, y] = fromLonLat(point)
      return [(x - west) * width / (east - west), (north - y) * height / (north - south)]
    },
    toGeo([x, y]) {
      return toLonLat([west + x * (east - west) / width, north - y * (north - south) / height])
    },
    pixelArea: (east - west) * (north - south) / (width * height) *
      Math.cos((image.extent[1] + image.extent[3]) * Math.PI / 360) ** 2,
  }
}

function ringArea(ring) {
  let sum = 0
  for (let i = 1; i < ring.length; i++) {
    sum += ring[i - 1][0] * ring[i][1] - ring[i][0] * ring[i - 1][1]
  }
  return Math.abs(sum) / 2
}

function area(shape) {
  return shape.reduce((sum, [exterior, ...holes]) =>
    sum + ringArea(exterior) - holes.reduce((removed, hole) => removed + ringArea(hole), 0), 0)
}

function maskOf(width, height, [left, top, right, bottom], test) {
  const mask = new Uint8Array(width * height)
  for (let y = Math.max(0, top); y < Math.min(height, bottom); y++) {
    for (let x = Math.max(0, left); x < Math.min(width, right); x++) {
      mask[y * width + x] = Number(test(x, y))
    }
  }
  return mask
}

function smoothMask(mask, width, height, radius, ratio) {
  const stride = width + 1
  const integral = new Uint32Array(stride * (height + 1))
  for (let y = 1; y <= height; y++) {
    let running = 0
    for (let x = 1; x <= width; x++) {
      running += mask[(y - 1) * width + x - 1]
      integral[y * stride + x] = integral[(y - 1) * stride + x] + running
    }
  }

  return maskOf(width, height, [0, 0, width, height], (x, y) => {
    const left = Math.max(0, x - radius)
    const right = Math.min(width, x + radius + 1)
    const top = Math.max(0, y - radius)
    const bottom = Math.min(height, y + radius + 1)
    const count = integral[bottom * stride + right] - integral[top * stride + right] -
      integral[bottom * stride + left] + integral[top * stride + left]
    return count >= (right - left) * (bottom - top) * ratio
  })
}

function simplifyRing(ring, tolerance) {
  const points = ring.slice(0, -1)
  const kept = [points[0]]
  for (const point of points.slice(1)) {
    if (Math.hypot(point[0] - kept.at(-1)[0], point[1] - kept.at(-1)[1]) >= tolerance) {
      kept.push(point)
    }
  }
  return kept.length >= 3 ? [...kept, kept[0]] : ring
}

function pixelColours(data, width, x, y) {
  const i = 4 * (y * width + x)
  return [data[i], data[i + 1], data[i + 2]]
}

function bedMask({ data, width, height }, { window }, path) {
  const [left, top, right, bottom] = window
  const [start, end] = path.axis
  const mask = maskOf(width, height, window, (x, y) => {
    const pathX = start[0] + (y - start[1]) * (end[0] - start[0]) / (end[1] - start[1])
    if (x >= pathX - 5) return false
    const [r, g, b] = pixelColours(data, width, x, y)
    return r >= 93 && r <= 151 && r - g >= 4 && g - b <= 23
  })
  // Bridge gaps between cultivation rows, then recede to the edges of the dark block.
  const broad = smoothMask(mask, width, height, 6, 0.23)
  const coherent = smoothMask(broad, width, height, 5, 0.68)
  return maskOf(width, height, [left, top, right, bottom], (x, y) => coherent[y * width + x])
}

function pathMask({ data, width, height }, { axis: [start, end], halfWidth }) {
  return maskOf(width, height, [
    Math.min(start[0], end[0]) - halfWidth, start[1],
    Math.max(start[0], end[0]) + halfWidth + 1, end[1] + 1,
  ], (x, y) => {
    const center = start[0] + (y - start[1]) * (end[0] - start[0]) / (end[1] - start[1])
    if (Math.abs(x - center) > halfWidth) return false
    const [r, g, b] = pixelColours(data, width, x, y)
    return r >= 147 && r - g >= 7 && r - b >= 16
  })
}

function largestComponent(mask, width, height, boundary) {
  const shape = contours().size([width, height]).contour(mask, 0.5)
  // Compare and render the same exterior polygon. Small gaps in the mask
  // inside a connected planting block are irrelevant to its outer boundary.
  const clipped = shape.coordinates.flatMap(([exterior]) => polygon.intersection(
    [[simplifyRing(exterior, 2)]], [[boundary]],
  ))
  const [largest] = clipped.sort((a, b) => area([b]) - area([a]))
  return largest && area([largest]) >= 20 ? largest[0] : null
}

export function evaluateImage(fixture, boundary, pixels) {
  if (!withinImage(fixture.image.extent, boundary)) {
    throw new Error('Die Gartengrenze muss vollständig im lokalen Luftbild liegen.')
  }
  const { width, height } = pixels
  const coords = imageCoordinates(fixture.image, width, height)
  const allowed = boundary.map(coords.toPixel)
  const { bed, path } = fixture.analysisPrompts
  const found = [
    { id: 'bed-1', label: 'Beet 1', kind: 'bed', mask: bedMask(pixels, bed, path) },
    { id: 'path-1', label: 'Weg 1', kind: 'path', mask: smoothMask(pathMask(pixels, path), width, height, 2, 0.42) },
  ].flatMap(({ mask, ...object }) => {
    const ring = largestComponent(mask, width, height, allowed)
    return ring ? [{ ...object, source: 'detected', ring }] : []
  })

  const comparisons = fixture.references.map(reference => {
    const detected = found.find(object => object.id === reference.id && object.kind === reference.kind)
    const expected = [[reference.ring.map(coords.toPixel)]]
    const referenceArea = area(expected)
    const actual = detected ? [[detected.ring]] : []
    const detectedArea = area(actual)
    const intersection = detected ? area(polygon.intersection(actual, expected)) : 0
    return {
      label: reference.label,
      iou: detected ? intersection / (referenceArea + detectedArea - intersection) : null,
      detectedArea: detectedArea * coords.pixelArea,
      referenceArea: referenceArea * coords.pixelArea,
    }
  })

  return {
    objects: found.map(object => ({ ...object, ring: object.ring.map(coords.toGeo) })),
    comparisons,
    note: 'Durchgezogene Linien zeigen berechnete Konturen. Gestrichelte Linien zeigen die Handumrisse.',
  }
}

export async function analyseGarden(fixture, boundary) {
  const image = new Image()
  image.src = fixture.image.url
  try {
    await image.decode()
  } catch {
    throw new Error('Das lokale Luftbild konnte nicht ausgewertet werden.')
  }
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  const context = canvas.getContext('2d', { willReadFrequently: true })
  context.drawImage(image, 0, 0)
  return evaluateImage(fixture, boundary, context.getImageData(0, 0, canvas.width, canvas.height))
}
