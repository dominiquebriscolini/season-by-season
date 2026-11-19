import bagua from '../evidence/segmentation/fixture.json' with {type: 'json'}
import {baguaNetwork} from '../experiments/way-guided/gardens.js'
import {derive, metresPerPixel, pixelPoint, reconcile, shape} from '../experiments/way-guided/model.js'
import {netInventory} from '../experiments/way-guided/inventory.js'
import {splitField} from './strip-layout.js'
import {varietyCatalog} from './variety-catalog.js'

export const gardenExampleId = 'garden-example-v1'
export const gardenExampleName = 'Garden_Example'
export const gardenExampleLocation = bagua.name
export const gardenExampleDate = '2026-06-15'

const fieldPlans = [
  {
    regionIndex: 0,
    name: 'Frühlingsbeet',
    layout: {count: 2, angle: 90},
    crops: [
      {profileId: 'saat-und-gut-maikoenig', start: '2026-05-01', daysMin: 42, daysMax: 60},
      {profileId: 'sativa-ra31', start: '2026-05-22', daysMin: 25, daysMax: 40, germinationPct: 85},
    ],
  },
  {
    regionIndex: 2,
    name: 'Sommerbeet',
    layout: {count: 3, angle: 90},
    crops: [
      {profileId: 'bingenheimer-g286', start: '2026-04-12', germinationPct: 80},
      {profileId: 'sativa-bo54', start: '2026-05-19', method: 'sow', daysMin: 55, daysMax: 72, germinationPct: 90},
      {profileId: 'sativa-zu26', start: '2026-05-23', method: 'transplant', daysMin: 45, daysMax: 60},
    ],
  },
  {
    regionIndex: 3,
    name: 'Tomatenbeet',
    crops: [
      {profileId: 'sativa-to31', start: '2026-05-17', method: 'transplant', daysMin: 65, daysMax: 85},
    ],
  },
]

export function createGardenExampleProject() {
  const {image, suggestedBoundary} = bagua
  const {projection, projectedExtent, size} = image
  const boundary = suggestedBoundary.slice(0, -1).map(point => pixelPoint(image, point))
  const axes = structuredClone(baguaNetwork).map((points, index) => ({
    id: `Weg-${index + 1}`, points, width: null, widths: points.slice(1).map(() => null),
  }))
  const directions = {}
  const outlines = []
  const defaultWidth = 0.8
  const scale = metresPerPixel(image)
  const ground = shape(boundary)
  const result = derive(null, ground, axes, {defaultWidth, directions, scale})
  let counter = axes.length
  const {regions, retired} = reconcile([], result.regions, () => `Fläche-${++counter}`)
  const net = netInventory(result.paths, regions, outlines, ground)

  const planning = {cultures: {}, splits: {}, fieldNames: {}, plantings: {}, archived: []}
  for (const {regionIndex, name, layout, crops} of fieldPlans) {
    const region = regions[regionIndex]
    region.kind = 'bed'
    planning.fieldNames[region.id] = name
    if (layout) planning.splits[region.id] = {...layout}
    const targets = layout ? splitField(region, net.regions[regionIndex].geometry, layout, scale) : [region]
    for (const [index, {profileId, ...exampleDetails}] of crops.entries()) {
      const {id} = targets[index]
      const {crop, name: variety, source, values} = varietyCatalog.find(profile => profile.id === profileId)
      planning.cultures[id] = crop
      planning.plantings[id] = {
        variety, ...values, ...exampleDetails,
        profileSource: {name: variety, source: {...source}, values: {...values}},
      }
    }
  }

  return {
    id: gardenExampleId,
    name: gardenExampleName,
    view: 'map',
    snapshot: {
      garden: 'bagua', georeference: {projection, projectedExtent: [...projectedExtent], size: [...size]},
      boundary, axes, directions, outlines, regions, retired, result, counter,
      net, defaultWidth, widthUnit: 'm',
    },
    planning,
    season: {siteId: gardenExampleId, year: Number(gardenExampleDate.slice(0, 4)), history: []},
  }
}
