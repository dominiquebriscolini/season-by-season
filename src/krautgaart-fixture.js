import {toLonLat} from 'ol/proj.js'

export const krautgaartKey = 'krautgaart'
export const krautgaartDemoId = 'krautgaart-beispiel-v1'

// Coordinate frame required to open existing copies of the former public example.
const size = [624, 624]
const projectedExtent = [-78, -78, 78, 78]
const extent = [...toLonLat([-78, -78]), ...toLonLat([78, 78])]

export const krautgaartFixture = {
  fixture: {
    name: 'Früheres schematisches Beispiel',
    image: {projection: 'EPSG:3857', projectedExtent, extent, size, schematic: true},
  },
  timeZone: 'Europe/Luxembourg',
}
