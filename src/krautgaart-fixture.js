import {toLonLat} from 'ol/proj.js'

export const krautgaartKey = 'krautgaart'
export const isKrautgaartPreview = search => new URLSearchParams(search).get('beispiel') === krautgaartKey

// This shape and coordinate frame are independent of the private garden.
export const krautgaartBoundary = [[54, 230], [492, 217], [565, 237], [575, 352], [496, 377], [57, 365]]
const spine = [[58, 291], [245, 286], [390, 304], [567, 299]]
const onSpine = (segment, x) => {
  const [[ax, ay], [bx, by]] = spine.slice(segment, segment + 2)
  return [x, ay + (by - ay) * (x - ax) / (bx - ax)]
}
const axes = [
  spine,
  [[186, 227], onSpine(0, 190)],
  [onSpine(1, 326), [320, 370]],
  [[459, 218], onSpine(2, 461)],
]
const size = [624, 624]
const projectedExtent = [-78, -78, 78, 78]
const extent = [...toLonLat([-78, -78]), ...toLonLat([78, 78])]

export const krautgaartFixture = {
  fixture: {
    name: 'Krautgaart · Schematisches Beispiel',
    image: {projection: 'EPSG:3857', projectedExtent, extent, size, schematic: true},
    suggestedBoundary: [...krautgaartBoundary, krautgaartBoundary[0]]
      .map(([x, y]) => toLonLat([-78 + x / 4, 78 - y / 4])),
  },
  timeZone: 'Europe/Luxembourg',
  axes,
}
