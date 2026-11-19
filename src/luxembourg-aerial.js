import Polygon from 'ol/geom/Polygon.js'
import {fromLonLat} from 'ol/proj.js'
import {createXYZ} from 'ol/tilegrid.js'
import boundary from './luxembourg-coverage.json'

export const luxembourgAerial = {
  credit: 'ACT Luxemburg · Mai 2025',
  creditUrl: 'https://data.public.lu/en/datasets/orthophoto-officielle-du-grand-duche-de-luxembourg-edition-ete-2025/',
  coverage: new Polygon([boundary.map(point => fromLonLat(point))]),
  grid: createXYZ({minZoom: 8, maxZoom: 20, tileSize: 256}),
  tileUrl([zoom, x, y]) {
    const matrix = String(zoom).padStart(2, '0')
    return `https://wmts1.geoportail.lu/opendata/wmts/ortho_2025/GLOBAL_WEBMERCATOR_4_V3/${matrix}/${x}/${y}.jpeg`
  },
}
