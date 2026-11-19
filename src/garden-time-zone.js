import Polygon from 'ol/geom/Polygon.js'
import {toLonLat} from 'ol/proj.js'
import lookup from '@photostructure/tz-lookup'
import {validWorldGeoreference} from './world-geography.js'

export function worldGardenTimeZone(snapshot) {
  const {georeference, boundary} = snapshot ?? {}
  if (!validWorldGeoreference(georeference) || !Array.isArray(boundary) || boundary.length < 3) return null
  const [x, y] = new Polygon([[...boundary, boundary[0]]]).getInteriorPoint().getCoordinates()
  const [west, south, east, north] = georeference.projectedExtent
  const [width, height] = georeference.size
  const [longitude, latitude] = toLonLat([west + x / width * (east - west), north - y / height * (north - south)])
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? lookup(latitude, longitude) : null
}
