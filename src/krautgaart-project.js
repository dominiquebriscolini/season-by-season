import {derive, metresPerPixel, reconcile, shape} from '../experiments/way-guided/model.js'
import {netInventory} from '../experiments/way-guided/inventory.js'
import {krautgaartBoundary, krautgaartFixture, krautgaartKey} from './krautgaart-fixture.js'

export const krautgaartDemoId = 'krautgaart-beispiel-v1'

export function createKrautgaartProject() {
  const {image} = krautgaartFixture.fixture
  const {projection, projectedExtent, size} = image
  const boundary = structuredClone(krautgaartBoundary)
  const axes = structuredClone(krautgaartFixture.axes).map((points, index) => ({
    id: `Weg-${index + 1}`, points, width: null, widths: points.slice(1).map(() => null),
  }))
  const directions = {}
  const defaultWidth = 0.8
  const outlines = []
  const ground = shape(boundary)
  const result = derive(null, ground, axes, {defaultWidth, directions, scale: metresPerPixel(image)})
  let counter = axes.length
  const {regions, retired} = reconcile([], result.regions, () => `Fläche-${++counter}`)
  const [herbs, vegetables, , greens, openSpace] = regions
  herbs.kind = 'bed'
  vegetables.kind = 'bed'
  greens.kind = 'growing'
  openSpace.kind = 'free'
  const plannedStrip = `${vegetables.id}:strip:1`
  return {
    id: krautgaartDemoId,
    name: 'Krautgaart',
    view: 'iso',
    snapshot: {
      garden: krautgaartKey, georeference: {projection, projectedExtent, size},
      boundary, axes, directions, outlines, regions, retired, result, counter,
      net: netInventory(result.paths, regions, outlines, ground), defaultWidth, widthUnit: 'm',
    },
    planning: {
      cultures: {[herbs.id]: 'Kresse', [plannedStrip]: 'Möhre', [`${vegetables.id}:strip:2`]: 'Radieschen'},
      splits: {[vegetables.id]: {count: 3, angle: 90}},
      fieldNames: {[herbs.id]: 'Kräuterbeet', [vegetables.id]: 'Gemüsebeet', [greens.id]: 'Anbaufläche Nord'},
      plantings: {[plannedStrip]: {method: 'sow', start: '2026-04-10', rowSpacingCm: 30, plantSpacingCm: 5}},
      archived: [],
    },
    season: {siteId: krautgaartDemoId, year: 2026, history: []},
  }
}
