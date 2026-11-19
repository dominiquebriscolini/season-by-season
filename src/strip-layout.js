import {area, intersect, shape} from '../experiments/way-guided/model.js'

const minimumOverlap = 0.85
const stripId = (id, index) => `${id}:strip:${index + 1}`
const dot = ([x, y], [u, v]) => x * u + y * v

function extent(points, axis) {
  let lower = Infinity
  let upper = -Infinity
  for (const point of points) {
    const projection = dot(point, axis)
    lower = Math.min(lower, projection)
    upper = Math.max(upper, projection)
  }
  return [lower, upper]
}

// Existing layouts use the longest edge of the smallest enclosing rectangle.
function fieldDirection(ring) {
  const sorted = ring.slice(0, -1).sort(([x, y], [u, v]) => x - u || y - v)
  const half = points => {
    const chain = []
    for (const point of points) {
      while (chain.length >= 2) {
        const [a, b] = chain.slice(-2)
        const cross = (b[0] - a[0]) * (point[1] - a[1]) - (b[1] - a[1]) * (point[0] - a[0])
        if (cross > 0) break
        chain.pop()
      }
      chain.push(point)
    }
    return chain.slice(0, -1)
  }
  const hull = [...half(sorted), ...half(sorted.reverse())]
  let bestArea = Infinity
  let bestDirection = [1, 0]
  for (const [index, a] of hull.entries()) {
    const b = hull[(index + 1) % hull.length]
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const length = Math.hypot(dx, dy)
    if (!length) continue
    const axis = [dx / length, dy / length]
    const normal = [-axis[1], axis[0]]
    const [start, stop] = extent(hull, axis)
    const [left, right] = extent(hull, normal)
    const width = stop - start
    const height = right - left
    const area = width * height
    if (area >= bestArea - 1e-8) continue
    bestArea = area
    bestDirection = width >= height ? axis : normal
  }
  const [x, y] = bestDirection
  return x < -1e-10 || (Math.abs(x) <= 1e-10 && y < 0) ? [-x, -y] : bestDirection
}

function legacyDirection(ring, layout) {
  const axis = layout.axis ?? fieldDirection(ring)
  return layout.direction === 'length' ? axis : [-axis[1], axis[0]]
}

export function normalizeAngle(degrees) {
  const angle = degrees % 360
  const normalized = angle < 0 ? angle + 360 : angle
  return normalized === 360 || normalized === 0 ? 0 : normalized
}

function compassAxis(angle) {
  // A canonical undirected axis leaves strip order unchanged after a half-turn.
  // Rounding removes floating-point noise from equivalent decimal bearings.
  const bearing = (Math.round((normalizeAngle(angle) % 180) * 1e12) / 1e12) % 180 * Math.PI / 180
  return [Math.sin(bearing), -Math.cos(bearing)]
}

export function angleForLayout(field, layout, metric = [1, 1]) {
  if (!layout) return 0
  if (typeof layout.angle === 'number') return normalizeAngle(layout.angle)
  const [x, y] = legacyDirection(field.geometry[0][0], layout)
  return normalizeAngle(Math.atan2(x * metric[0], -y * metric[1]) * 180 / Math.PI)
}

export function validStripLayout(layout) {
  if (!Number.isInteger(layout?.count) || layout.count < 1 || layout.count > 100) return false
  if (layout.angle !== undefined) return Number.isFinite(layout.angle) && layout.angle >= 0 && layout.angle < 360
  return layout.count >= 2 && ['length', 'cross'].includes(layout.direction) &&
    (layout.axis == null || (Array.isArray(layout.axis) && layout.axis.length === 2 &&
      layout.axis.every(Number.isFinite) && Math.abs(Math.hypot(...layout.axis) - 1) < 1e-5))
}

function layoutFrame(field, layout, metric) {
  const ring = field.geometry[0][0]
  const angular = typeof layout.angle === 'number'
  const along = angular ? compassAxis(layout.angle) : legacyDirection(ring, layout)
  const across = [-along[1], along[0]]
  const [metresX, metresY] = angular ? metric : [1, 1]
  const metricRing = angular ? ring.map(([x, y]) => [x * metresX, y * metresY]) : ring
  const [begin, end] = extent(metricRing, along)
  const [left, right] = extent(metricRing, across)
  const width = (right - left) / layout.count
  const point = (u, v) => [(along[0] * u + across[0] * v) / metresX, (along[1] * u + across[1] * v) / metresY]
  return {begin, end, left, right, width, point,
    widthMetres: angular ? width : width / Math.hypot(across[0] / metric[0], across[1] / metric[1])}
}

export function subdivisionWidthMetres(field, layout, metric) {
  return layoutFrame(field, layout, metric).widthMetres
}

export function closestSubdivisionCount(span, desiredWidth, maxCount) {
  const estimate = Math.max(1, Math.min(maxCount, span / desiredWidth))
  const lower = Math.floor(estimate)
  const upper = Math.ceil(estimate)
  return Math.abs(span / upper - desiredWidth) < Math.abs(span / lower - desiredWidth) ? upper : lower
}

export function splitField(field, usable, layout, metric = [1, 1]) {
  if (!layout || layout.count < 2) return []
  const {begin, end, left, right, width, point} = layoutFrame(field, layout, metric)
  return Array.from({length: layout.count}, (_, index) => {
    const min = left + index * width
    const max = index === layout.count - 1 ? right + 1 : left + (index + 1) * width
    const start = index === 0 ? min - 1 : min
    const band = shape([point(begin - 1, start), point(end + 1, start), point(end + 1, max), point(begin - 1, max)])
    return {id: stripId(field.id, index), label: `Streifen ${index + 1}`, geometry: intersect(usable, band)}
  })
}

function usableTargets(field, layout, metric) {
  const targets = layout?.count > 1 ? splitField(field, field.usable, layout, metric) : [{id: field.id, geometry: field.usable}]
  return targets.flatMap(target => {
    const size = area(target.geometry)
    if (!size) return []
    const points = target.geometry.flatMap(([outer]) => outer)
    return [{...target, size, x: extent(points, [1, 0]), y: extent(points, [0, 1])}]
  })
}

function matches(old, target) {
  const minimumSize = minimumOverlap * Math.max(old.size, target.size)
  if (Math.min(old.size, target.size) < minimumSize ||
      old.x[1] <= target.x[0] || target.x[1] <= old.x[0] ||
      old.y[1] <= target.y[0] || target.y[1] <= old.y[0]) return false
  return area(intersect(old.geometry, target.geometry)) >= minimumSize
}

export function planStripChange(planning, field, proposedLayout, metric) {
  const previous = planning.splits[field.id]
  const oldCrops = Object.entries(planning.cultures).filter(([id]) => id === field.id || id.startsWith(`${field.id}:strip:`))
  const next = structuredClone(planning)
  next.splits[field.id] = {...proposedLayout, angle: normalizeAngle(proposedLayout.angle)}
  if (!oldCrops.length) return {next, archivesCultures: false, preservedCount: 0, archivedCount: 0}

  const originalTargets = new Map(usableTargets(field, previous, metric).map(target => [target.id, target]))
  const newTargets = usableTargets(field, next.splits[field.id], metric)
  const matchesByCulture = oldCrops.map(([id, culture]) => {
    const original = originalTargets.get(id)
    const candidates = original ? newTargets.filter(target => matches(original, target)) : []
    delete next.cultures[id]
    if (next.plantings) delete next.plantings[id]
    return {id, culture, target: candidates.length === 1 ? candidates[0].id : null}
  })
  const targetUses = new Map()
  for (const {target} of matchesByCulture) {
    if (target) targetUses.set(target, (targetUses.get(target) ?? 0) + 1)
  }

  const archive = []
  const archivedDetails = {}
  for (const {id, culture, target} of matchesByCulture) {
    const details = planning.plantings?.[id]
    if (targetUses.get(target) === 1) {
      next.cultures[target] = culture
      if (details) next.plantings[target] = structuredClone(details)
    } else {
      archive.push([id, culture])
      if (details) archivedDetails[id] = structuredClone(details)
    }
  }
  if (archive.length) {
    next.archived.push({fieldId: field.id, split: previous ?? null, cultures: Object.fromEntries(archive),
      ...(Object.keys(archivedDetails).length && {plantings: archivedDetails})})
  }
  return {next, archivesCultures: archive.length > 0, preservedCount: oldCrops.length - archive.length, archivedCount: archive.length}
}
