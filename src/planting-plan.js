import Coordinate from 'jsts/org/locationtech/jts/geom/Coordinate.js'
import Location from 'jsts/org/locationtech/jts/geom/Location.js'
import IndexedPointInAreaLocator from 'jsts/org/locationtech/jts/algorithm/locate/IndexedPointInAreaLocator.js'
import GeoJSONReader from 'jsts/org/locationtech/jts/io/GeoJSONReader.js'
import OverlayOp from 'jsts/org/locationtech/jts/operation/overlay/OverlayOp.js'

const dayMs = 86_400_000
export const maxCultivationDays = 3650
const distanceIsValid = value => Number.isFinite(value) && value >= 1
const durationIsValid = value => Number.isSafeInteger(value) && value >= 0
const germinationIsValid = value => Number.isFinite(value) && value >= 0.01 && value <= 100
const yieldIsValid = value => Number.isFinite(value) && value >= 0
const optional = (value, check) => value == null || check(value)
const reusableFields = new Set(['method', 'rowSpacingCm', 'plantSpacingCm', 'daysMin', 'daysMax',
  'germinationPct', 'yieldEach', 'yieldUnit'])

function validSourceSnapshot(profile) {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) return false
  const {name, source, values} = profile
  return typeof name === 'string' && name.length > 0 && name.length <= 100 &&
    typeof source?.label === 'string' && source.label.length <= 160 &&
    optional(source.url, value => typeof value === 'string' && /^https?:\/\//i.test(value) && value.length <= 1000) &&
    optional(source.note, value => typeof value === 'string' && value.length <= 600) &&
    values && !Array.isArray(values) && typeof values === 'object' &&
    Object.keys(values).every(key => reusableFields.has(key)) && validPlantingDetails(values)
}

export function validProfileSource(profile) {
  if (!validSourceSnapshot(profile)) return false
  if (profile.earlier == null) return true
  if (!Array.isArray(profile.earlier) || profile.earlier.length > reusableFields.size ||
      !profile.earlier.every(entry => validSourceSnapshot(entry) && entry.earlier == null)) return false
  const keys = [profile, ...profile.earlier].flatMap(entry => Object.keys(entry.values))
  return keys.length === new Set(keys).size
}

function parseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) return null
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null
}

export function validPlantingDetails(details) {
  if (!details || typeof details !== 'object' || Array.isArray(details)) return false
  const {variety, method, start, rowSpacingCm, plantSpacingCm, daysMin, daysMax, germinationPct, yieldEach, yieldUnit} = details
  return optional(details.profileSource, validProfileSource) &&
    optional(variety, value => typeof value === 'string') &&
    optional(method, value => value === 'sow' || value === 'transplant') &&
    optional(start, value => value === '' || Boolean(parseDate(value))) &&
    optional(rowSpacingCm, distanceIsValid) && optional(plantSpacingCm, distanceIsValid) &&
    optional(daysMin, durationIsValid) && optional(daysMax, durationIsValid) &&
    (daysMin == null || daysMax == null || daysMin <= daysMax) &&
    optional(germinationPct, germinationIsValid) && optional(yieldEach, yieldIsValid) &&
    optional(yieldUnit, value => value === 'kg' || value === 'pieces')
}

function projectedBed(geometry, metric, angle) {
  if (!geometry?.length || !Number.isFinite(angle) ||
      !Array.isArray(metric) || metric.length !== 2 || !metric.every(value => Number.isFinite(value) && value > 0)) return null
  const bearing = (angle % 180 + 180) % 180
  const radians = bearing * Math.PI / 180
  const sin = bearing === 0 ? 0 : Math.sin(radians)
  const cos = bearing === 90 ? 0 : Math.cos(radians)
  const [originX, originY] = geometry[0][0][0]
  const [metresX, metresY] = metric
  // In the row plane, X follows the bearing and a row is horizontal.
  const coordinates = geometry.map(polygon => polygon.map(ring => ring.map(([x, y]) => {
    const east = (x - originX) * metresX
    const south = (y - originY) * metresY
    return [east * sin - south * cos, east * cos + south * sin]
  })))
  return new GeoJSONReader().read({type: 'MultiPolygon', coordinates})
}

function interiorLengths(geometry, locator) {
  if (geometry.isEmpty()) return []
  const type = geometry.getGeometryType()
  if (type === 'MultiLineString' || type === 'GeometryCollection') {
    return Array.from({length: geometry.getNumGeometries()}, (_, i) =>
      interiorLengths(geometry.getGeometryN(i), locator)).flat()
  }
  if (type !== 'LineString') return []

  // Polygon intersection can yield stretches exactly along a hole or outer edge.
  // Those stretches do not provide planting space.
  const points = geometry.getCoordinates()
  const lengths = []
  let length = 0
  for (let i = 1; i < points.length; i++) {
    const [first, last] = [points[i - 1], points[i]]
    const midpoint = new Coordinate((first.x + last.x) / 2, (first.y + last.y) / 2)
    if (locator.locate(midpoint) === Location.INTERIOR) {
      length += Math.abs(last.x - first.x)
    } else if (length > 0) {
      lengths.push(length)
      length = 0
    }
  }
  if (length > 0) lengths.push(length)
  return lengths
}

const wholeSpacings = (length, spacing) => Math.floor(length / spacing + 1e-9)

function measureRows(geometry, metric, angle, rowSpacingCm, plantSpacingCm) {
  const bed = projectedBed(geometry, metric, angle)
  if (!bed) return geometry?.length ? null : {rowCount: 0, rowLengthMetres: 0, plants: plantSpacingCm ? 0 : null}
  const locator = new IndexedPointInAreaLocator(bed)
  const envelope = bed.getEnvelopeInternal()
  const factory = bed.getFactory()
  const rowSpacing = rowSpacingCm / 100
  const plantSpacing = plantSpacingCm ? plantSpacingCm / 100 : null
  const rows = wholeSpacings(envelope.getHeight(), rowSpacing)
  let rowCount = 0
  let rowLengthMetres = 0
  let plants = plantSpacing ? 0 : null
  for (let i = 0; i < rows; i++) {
    const y = envelope.getMinY() + (i + 0.5) * rowSpacing
    const line = factory.createLineString([
      new Coordinate(envelope.getMinX() - 1, y), new Coordinate(envelope.getMaxX() + 1, y),
    ])
    const lengths = interiorLengths(OverlayOp.intersection(bed, line), locator)
    if (lengths.length) rowCount++
    for (const length of lengths) {
      rowLengthMetres += length
      if (plantSpacing) plants += wholeSpacings(length, plantSpacing)
    }
  }
  return {rowCount, rowLengthMetres, plants}
}

function dateAfter(date, duration) {
  if (!date || !durationIsValid(duration)) return null
  const result = new Date(date.getTime() + duration * dayMs)
  return Number.isFinite(result.getTime()) && result.getUTCFullYear() <= 9999 ?
    result.toISOString().slice(0, 10) : null
}

export function calculatePlanting(geometry, metric, angle, details = {}) {
  const {method, start, rowSpacingCm, plantSpacingCm, daysMin, daysMax, germinationPct, yieldEach, yieldUnit} = details ?? {}
  const measurement = distanceIsValid(rowSpacingCm) && measureRows(geometry, metric, angle, rowSpacingCm,
    distanceIsValid(plantSpacingCm) ? plantSpacingCm : null)
  const plants = measurement?.plants ?? null
  let unitsNeeded = null
  if (plants != null) {
    if (method === 'transplant') unitsNeeded = plants
    else if (method === 'sow' && germinationIsValid(germinationPct)) {
      unitsNeeded = Math.ceil(plants * 100 / germinationPct - 1e-9)
    }
  }
  const date = method === 'sow' || method === 'transplant' ? parseDate(start) : null
  const inverted = durationIsValid(daysMin) && durationIsValid(daysMax) && daysMin > daysMax
  const yieldAmount = plants != null && yieldIsValid(yieldEach) && ['kg', 'pieces'].includes(yieldUnit) ?
    plants * yieldEach : null
  return {
    rowCount: measurement?.rowCount ?? null,
    rowLengthMetres: measurement?.rowLengthMetres ?? null,
    plants, unitsNeeded,
    harvestStart: inverted ? null : dateAfter(date, daysMin),
    harvestEnd: inverted ? null : dateAfter(date, daysMax),
    expectedYield: Number.isFinite(yieldAmount) ? yieldAmount : null,
  }
}
