import clip from 'polygon-clipping'
import { fromLonLat } from 'ol/proj.js'
import {partitionGround} from './partition.js'

export const close = points => [ ...points, points[0] ]
export const shape = points => [[close(points)]]
export const intersect = (a, b) => a.length && b.length ? overlay(clip.intersection, [a, b]) : []

function overlay(operation, geometries) {
  try {
    return operation(...geometries)
  } catch (error) {
    if (!/^Unable to (complete output ring|find segment)/.test(error.message)) throw error
    // Retry nearly coincident edges on a subpixel grid.
    const grid = 1e-7
    const snapped = geometries.map(geometry => geometry.map(polygon => polygon.map(ring =>
      ring.map(point => point.map(value => Math.round(value / grid) * grid)))))
    return operation(...snapped)
  }
}
export const pixelPoint = (image, coord) => {
  const [x, y] = fromLonLat(coord)
  const [west, south, east, north] = image.projectedExtent
  return [(x - west) * image.size[0] / (east - west), (north - y) * image.size[1] / (north - south)]
}

export function metresPerPixel(image) {
  const [west, south, east, north] = image.projectedExtent
  const latitude = (image.extent[1] + image.extent[3]) * Math.PI / 360
  // Local ground scale of EPSG:3857 on the WGS84 ellipsoid.
  const eccentricitySquared = 0.00669437999014
  const denominator = 1 - eccentricitySquared * Math.sin(latitude) ** 2
  const parallel = Math.cos(latitude) / Math.sqrt(denominator)
  const meridian = parallel * (1 - eccentricitySquared) / denominator
  return [(east - west) / image.size[0] * parallel, (north - south) / image.size[1] * meridian]
}

function ringArea(ring) {
  return Math.abs(ring.slice(1).reduce((sum, [x, y], i) =>
    sum + ring[i][0] * y - ring[i][1] * x, 0)) / 2
}

export const area = polygons => polygons.reduce((sum, [outer, ...holes]) =>
  sum + ringArea(outer) - holes.reduce((total, hole) => total + ringArea(hole), 0), 0)

export function iou(a, b) {
  const shared = area(intersect(a, b))
  return shared / (area(a) + area(b) - shared) || 0
}

function distance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1])
}

function median(values) {
  return values.toSorted((a, b) => a - b)[Math.floor(values.length / 2)]
}

function rgb(image, x, y) {
  const index = (Math.round(y) * image.width + Math.round(x)) * 4
  if (x < 0 || y < 0 || x >= image.width - 0.5 || y >= image.height - 0.5) return null
  return image.data.subarray(index, index + 3)
}

function offset(point, normal, width) {
  return [point[0] + normal[0] * width, point[1] + normal[1] * width]
}

function edge(image, point, normal, direction) {
  let strongest = { width: 4, strength: 0 }
  for (let width = 2; width <= 15; width++) {
    const inside = rgb(image, ...offset(point, normal, direction * (width - 1.5)))
    const outside = rgb(image, ...offset(point, normal, direction * (width + 1.5)))
    if (!inside || !outside) continue
    const strength = Math.hypot(...inside.map((value, i) => Math.abs(value - outside[i]))) / Math.sqrt(width)
    if (strength > strongest.strength) strongest = { width, strength }
  }
  return strongest
}

function disk([x, y], radius) {
  return shape(Array.from({length: 12}, (_, i) => {
    const angle = i * Math.PI / 6
    return [x + radius * Math.cos(angle), y + radius * Math.sin(angle)]
  }))
}

function section(a, b, image, override) {
  const length = distance(a, b)
  const normal = [(a[1] - b[1]) / length, (b[0] - a[0]) / length]
  const steps = Math.max(2, Math.ceil(length / 4))
  const stations = Array.from({length: steps + 1}, (_, i) => {
    const fraction = i / steps
    const point = a.map((value, j) => value + (b[j] - value) * fraction)
    return {point, edges: [-1, 1].map(sign => edge(image, point, normal, sign))}
  })
  const interior = stations.slice(1, -1)
  const typical = [0, 1].map(side => median(interior.map(station => station.edges[side].width)))
  const widths = stations.map((_, i) => [0, 1].map(side => {
    if (override != null) return override / 2
    const center = Math.max(1, Math.min(i, stations.length - 2))
    const window = interior.slice(Math.max(0, center - 3), center + 2)
      .map(station => station.edges[side]).filter(item => item.strength >= 10)
    return window.length >= 2 ? median(window.map(item => item.width)) : typical[side]
  }))
  const limits = widths.map(([left, right], i) => [
    offset(stations[i].point, normal, -left), offset(stations[i].point, normal, right),
  ])
  const strips = limits.slice(1).map(([left, right], i) =>
    shape([limits[i][0], left, right, limits[i][1]]))
  const totals = widths.map(([left, right]) => left + right)
  const weak = interior.filter(station => station.edges.some(item => item.strength < 10)).length
  return {
    geometry: clip.union(...strips, disk(a, Math.min(...widths[0])), disk(b, Math.min(...widths.at(-1)))),
    widths: totals, typicalWidth: median(totals), weakProfiles: weak, profiles: interior.length,
  }
}

export const widthMetres = (axis, index, standard) => axis.widths?.[index] ?? axis.width ?? standard

function metricSection(a, b, width, scale) {
  const start = a.map((value, i) => value * scale[i])
  const end = b.map((value, i) => value * scale[i])
  const length = distance(start, end)
  const tangent = end.map((value, i) => (value - start[i]) / length)
  const normal = [-tangent[1], tangent[0]]
  const radius = width / 2
  const cap = (centre, sign) => Array.from({length: 17}, (_, i) => {
    const angle = i * Math.PI / 16
    const forward = i === 0 || i === 16 ? 0 : Math.sin(angle)
    return centre.map((value, axis) =>
      (value + sign * radius * (normal[axis] * Math.cos(angle) + tangent[axis] * forward)) / scale[axis])
  })
  // Build the capsule directly so a tangent disk and strip need no numerical union.
  const geometry = shape([...cap(end, 1), ...cap(start, -1)])
  return {geometry, widthMetres: width}
}

function contains(ring, x, y) {
  let inside = false
  for (let i = 1; i < ring.length; i++) {
    const [ax, ay] = ring[i - 1]
    const [bx, by] = ring[i]
    if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) inside = !inside
  }
  return inside
}

function describe([outer, ...holes], image) {
  if (!image) return {greenFraction: null, hint: 'Nutzung offen'}
  const xs = outer.map(([x]) => x)
  const ys = outer.map(([, y]) => y)
  let count = 0
  let green = 0
  for (let y = Math.ceil(Math.min(...ys)); y < Math.max(...ys); y += 4) {
    for (let x = Math.ceil(Math.min(...xs)); x < Math.max(...xs); x += 4) {
      if (!contains(outer, x, y) || holes.some(ring => contains(ring, x, y))) continue
      const color = rgb(image, x, y)
      if (!color) continue
      const [r, g, b] = color
      green += Number(g - r >= 8 && g - b >= 12)
      count++
    }
  }
  const fraction = count ? green / count : null
  return {greenFraction: fraction, hint: fraction >= 0.55 ? 'Vegetation sichtbar' : 'Nutzung offen'}
}

function onSegment(point, a, b) {
  const [x, y] = [point[0] - a[0], point[1] - a[1]]
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]]
  const length = Math.hypot(dx, dy)
  if (!length) return distance(point, a) <= 1e-7
  const projection = (x * dx + y * dy) / length
  return Math.abs(x * dy - y * dx) / length <= 1e-7 && projection >= -1e-7 && projection <= length + 1e-7
}

function onPathInterior(point, {axis, index, a, b}, {scale, defaultWidth}) {
  const [dx, dy] = b.map((value, i) => (value - a[i]) * scale[i])
  const [x, y] = point.map((value, i) => (value - a[i]) * scale[i])
  const length = Math.hypot(dx, dy)
  if (!length) return false
  const along = (dx * x + dy * y) / length
  const across = Math.abs(dx * y - dy * x) / length
  return along >= 0 && along <= length && across <= widthMetres(axis, index, defaultWidth) / 2
}

function capReachesBoundary(point, ring, radius, scale) {
  return ring.slice(1).some((end, index) => {
    const start = ring[index]
    const delta = end.map((value, i) => (value - start[i]) * scale[i])
    const offset = point.map((value, i) => (value - start[i]) * scale[i])
    const fraction = Math.min(1, Math.max(0, (offset[0] * delta[0] + offset[1] * delta[1]) /
      (delta[0] ** 2 + delta[1] ** 2)))
    return Math.hypot(...offset.map((value, i) => value - delta[i] * fraction)) < radius
  })
}

function rayHit(start, direction, a, b) {
  const [dx, dy] = direction
  const [ex, ey] = [b[0] - a[0], b[1] - a[1]]
  const [x, y] = [a[0] - start[0], a[1] - start[1]]
  const determinant = dx * ey - dy * ex
  if (Math.abs(determinant) < 1e-9) return Infinity
  const along = (x * dy - y * dx) / determinant
  const t = (x * ey - y * ex) / determinant
  return along >= -1e-9 && along <= 1 + 1e-9 && t > 1e-8 ? t : Infinity
}

const alongRay = (start, unit, distance) => start.map((value, i) => value + distance * unit[i])
const rayHits = (start, unit, rings) => rings.flatMap(ring =>
  ring.slice(1).map((b, i) => rayHit(start, unit, ring[i], b)))
const inPaths = (point, paths) => paths.some(([outer, ...holes]) =>
  contains(outer, ...point) && !holes.some(hole => contains(hole, ...point)))

function firstGroundInterval(start, unit, limit, paths) {
  const hits = rayHits(start, unit, paths.flat()).filter(hit => hit < limit)
  const times = [0, ...hits.sort((a, b) => a - b), limit]
  for (let i = 1; i < times.length; i++) {
    if (times[i] - times[i - 1] <= 1e-7) continue
    const point = alongRay(start, unit, (times[i] + times[i - 1]) / 2)
    if (!inPaths(point, paths)) {
      return {entry: times[i - 1], t: times[i]}
    }
  }
  return null
}

function extendAxis(axis, ring, segments, metric, paths, otherPaths) {
  const {points} = axis
  return ['start', 'end'].flatMap(end => {
    const terminal = end === 'start' ? 0 : points.length - 1
    const neighbour = end === 'start' ? 1 : terminal - 1
    const start = points[terminal]
    if (!contains(ring, ...start) || ring.slice(1).some((b, i) => onSegment(start, ring[i], b))) return []
    const index = Math.min(terminal, neighbour)
    // A cap already connected to the parcel must not cut the corner a second time.
    const inscribedRadius = widthMetres(axis, index, metric.defaultWidth) * Math.cos(Math.PI / 32) / 2
    if (capReachesBoundary(start, ring, inscribedRadius, metric.scale)) return []
    if (segments.some(segment => (segment.axis !== axis || segment.index !== index) &&
        (onSegment(start, segment.a, segment.b) ||
          (segment.axis !== axis && onPathInterior(start, segment, metric))))) return []
    if (inPaths(start, otherPaths)) return []
    const automatic = start.map((value, i) => value - points[neighbour][i])
    const direction = metric.directions?.[axis.id]?.[end] ?? automatic
    const length = Math.hypot(...direction)
    const unit = direction.map(value => value / length)
    const limit = Math.min(...rayHits(start, unit, [ring, ...otherPaths.flat()]))
    const candidate = {end, index, start, unit, corrected: direction !== automatic}
    if (!Number.isFinite(limit) || onSegment(alongRay(start, unit, 1e-5), start, points[neighbour])) {
      return [{...candidate, blocked: true}]
    }
    const interval = firstGroundInterval(start, unit, limit, paths)
    return interval ? [{...candidate, ...interval}] : []
  })
}

function stopAtVirtualLines(rays) {
  const meetings = []
  for (const [i, a] of rays.entries()) {
    for (const b of rays.slice(i + 1)) {
      const aTarget = alongRay(a.start, a.unit, a.t)
      const bTarget = alongRay(b.start, b.unit, b.t)
      let ta = rayHit(a.start, a.unit, b.start, bTarget)
      let tb = rayHit(b.start, b.unit, a.start, aTarget)
      if (!Number.isFinite(ta) && !Number.isFinite(tb) &&
          onSegment(b.start, a.start, alongRay(a.start, a.unit, distance(a.start, b.start))) &&
          a.unit[0] * b.unit[0] + a.unit[1] * b.unit[1] < -0.9999999) {
        // Opposing collinear rays make one continuous connector.
        ta = tb = distance(a.start, b.start) / 2
      }
      if (ta > a.entry + 1e-7 && tb > b.entry + 1e-7 && ta <= a.t + 1e-7 && tb <= b.t + 1e-7) {
        meetings.push({a, b, ta, tb, time: Math.max(ta, tb)})
      }
    }
  }
  // The later arrival stops on the line already reached by the earlier one.
  for (const {a, b, ta, tb} of meetings.sort((x, y) => x.time - y.time)) {
    if (ta > a.t + 1e-7 || tb > b.t + 1e-7) continue
    if (ta >= tb - 1e-7) a.t = Math.min(a.t, ta)
    if (tb >= ta - 1e-7) b.t = Math.min(b.t, tb)
  }
}

export function derive(image, boundary, axes, metric) {
  const segments = metric ? axes.flatMap(axis => axis.points.slice(1).map((b, index) =>
    ({axis, index, a: axis.points[index], b}))) : []
  const lines = axes.map(axis => {
    const {id, points, widths = []} = axis
    const sections = points.slice(1).flatMap((point, i) => distance(points[i], point) < 1 ? [] : [
      {...(metric
        ? metricSection(points[i], point, widthMetres(axis, i, metric.defaultWidth), metric.scale)
        : section(points[i], point, image, widths[i])), index: i},
    ])
    const geometry = sections.length ? intersect(overlay(clip.union, sections.map(section => section.geometry)), boundary) : []
    return {id, sections, extensions: [], openEnds: [], geometry}
  })
  const paths = lines.length ? clip.union(...lines.map(line => line.geometry)) : []
  const ground = paths.length ? clip.difference(boundary, paths) : boundary
  const candidates = metric ? axes.map((axis, index) => lines[index].geometry.length
    ? extendAxis(axis, boundary[0][0], segments, metric, paths,
      lines.flatMap((line, i) => i === index ? [] : line.geometry)) : []) : []
  stopAtVirtualLines(candidates.flat().filter(item => !item.blocked))
  for (const [i, items] of candidates.entries()) {
    lines[i].openEnds = items.filter(item => item.blocked).map(item => item.end)
    lines[i].extensions = items.filter(item => !item.blocked).map(({end, index, start, t, unit, corrected}) => ({
      end, index, corrected, points: [start, alongRay(start, unit, t)],
    }))
  }
  const remainder = partitionGround(ground, lines.flatMap(line => line.extensions.map(item => item.points)))
  return {lines, paths, remainder, regions: remainder.map(polygon => ({
    geometry: [polygon], ...describe(polygon, image),
  }))}
}

export function reconcile(previous, regions, nextId) {
  const oldAreas = previous.map(old => area(old.geometry))
  const matches = regions.map(region => {
    const regionArea = area(region.geometry)
    return previous.flatMap((old, index) => {
      const smaller = Math.min(oldAreas[index], regionArea)
      const shared = area(intersect(old.geometry, region.geometry))
      return shared > 0.15 * smaller ? [{old, coverage: shared / smaller}] : []
    })
  })
  const useCount = new Map()
  for (const list of matches) {
    for (const {old} of list) useCount.set(old, (useCount.get(old) ?? 0) + 1)
  }
  const carried = new Set()
  const matched = regions.map((region, i) => {
    const [match] = matches[i]
    if (matches[i].length === 1 && useCount.get(match.old) === 1 && match.coverage >= 0.55) {
      const {old} = match
      carried.add(old)
      return {...region, id: old.id, kind: old.kind, culture: old.culture}
    }
    return {...region, id: nextId(), kind: 'unknown', culture: ''}
  })
  return {regions: matched, retired: previous.filter(old => !carried.has(old) && (old.culture || old.kind !== 'unknown'))}
}
