import clip from 'polygon-clipping'
import {contours} from 'd3-contour'
import {area, intersect, shape} from './model.js'

export const isBuilding = kind => kind === 'building' || kind === 'shed'
export const isShell = kind => kind === 'greenhouse' || kind === 'tunnel'

export function netInventory(paths, regions, outlines, boundary) {
  const buildings = outlines.filter(item => isBuilding(item.kind)).map(item => shape(item.points))
  // The union counts any shared footprint only once, even across a path junction.
  const occupied = buildings.length ? intersect(clip.union(...buildings), boundary) : []
  const net = geometry => occupied.length && geometry.length ? clip.difference(geometry, occupied) : geometry
  return {
    occupied,
    paths: net(paths),
    regions: regions.map(({id, geometry}) => ({id, geometry: net(geometry)})),
  }
}

function inRing([x, y], ring) {
  let inside = false
  for (let i = 1; i < ring.length; i++) {
    const [ax, ay] = ring[i - 1]
    const [bx, by] = ring[i]
    if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) inside = !inside
  }
  return inside
}

export const containsPoint = (geometry, point) => geometry.some(([outer, ...holes]) =>
  inRing(point, outer) && !holes.some(ring => inRing(point, ring)))

export function vegetationMask(image) {
  const {width, height, data} = image
  const scores = new Float32Array(width * height)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sum = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const i = ((y + dy) * width + x + dx) * 4
          sum += 2 * data[i + 1] - data[i] - data[i + 2]
        }
      }
      scores[y * width + x] = sum / 9
    }
  }
  return contours().size([width, height]).contour(scores, 18).coordinates
}

export function inspectRegion(region, mask) {
  const green = intersect(region.geometry, mask)
  const fraction = area(green) / area(region.geometry)
  const largest = green.reduce((best, polygon) => area([polygon]) > area(best) ? [polygon] : best, [])
  const ratio = area(largest) / area(region.geometry)
  return {fraction, candidate: ratio >= 0.08 && ratio <= 0.85 && area(largest) >= 25 ? largest : []}
}
