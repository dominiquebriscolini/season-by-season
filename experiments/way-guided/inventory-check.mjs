import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {PNG} from 'pngjs'
import {baguaNetwork, readGardens} from './gardens.js'
import {area, derive, intersect, iou, metresPerPixel, pixelPoint, reconcile, shape} from './model.js'
import {inspectRegion, netInventory, vegetationMask} from './inventory.js'

const rect = (x1, y1, x2, y2) => shape([[x1,y1],[x2,y1],[x2,y2],[x1,y2]])
let count = 0
const nextId = () => String(++count)
const ground = rect(0, 0, 100, 100)
const initial = reconcile([], [{geometry: ground}], nextId).regions
initial[0].kind = 'free'
const narrow = reconcile(initial, [{geometry: rect(10, 0, 50, 100)}], nextId)
assert.equal(narrow.regions[0].id, initial[0].id)
assert.equal(narrow.regions[0].kind, 'free')
const split = reconcile(initial, [{geometry: rect(0, 0, 40, 100)}, {geometry: rect(50, 0, 100, 100)}], nextId)
assert.deepEqual(split.retired, initial)
assert.ok(split.regions.every(item => item.kind === 'unknown' && item.id !== initial[0].id))
const merge = reconcile(split.regions.map(item => ({...item, kind: 'bed'})), [{geometry: ground}], nextId)
assert.equal(merge.retired.length, 2)
assert.equal(merge.regions[0].kind, 'unknown')

const ways = rect(0, 40, 100, 60)
const fields = [{id: 'north', geometry: rect(0, 0, 100, 40)}, {id: 'south', geometry: rect(0, 60, 100, 100)}]
const object = (id, kind, ...bounds) => ({id, kind, points: rect(...bounds)[0][0].slice(0, -1)})
const shed = object('shed', 'shed', 20, 30, 40, 50)
const building = object('house', 'building', 30, 35, 50, 55)
const overlays = ['tree', 'hedge', 'greenhouse', 'tunnel'].map(kind => object(kind, kind, 10, 10, 90, 90))
const net = netInventory(ways, fields, [shed, building, ...overlays], ground)
assert.equal(area(net.occupied), 650)
assert.equal(area(net.paths), 1600)
assert.deepEqual(net.regions.map(item => [item.id, area(item.geometry)]), [['north', 3750], ['south', 4000]])
const moved = netInventory(ways, fields, [object('shed', 'shed', 20, 70, 40, 90), building, ...overlays], ground)
assert.equal(area(moved.occupied), 800)
assert.equal(area(moved.paths), 1700)
assert.deepEqual(moved.regions.map(item => [item.id, area(item.geometry)]), [['north', 3900], ['south', 3600]])
assert.deepEqual(netInventory(ways, fields, overlays.map(item => ({...item, hidden: true})), ground),
  {paths: ways, regions: fields, occupied: []})

const rgba = new Uint8ClampedArray(100 * 100 * 4)
for (let y = 0; y < 100; y++) {
  for (let x = 0; x < 100; x++) {
    rgba.set(x < 50 ? [30, 120, 30, 255] : [80, 80, 80, 255], (y * 100 + x) * 4)
  }
}
const proposal = inspectRegion(initial[0], vegetationMask({width: 100, height: 100, data: rgba}))
assert.ok(proposal.fraction > 0.45 && proposal.fraction < 0.55)
assert.ok(proposal.candidate.length)
assert.equal(initial[0].kind, 'free')

const sampleImage = {width: 100, height: 100, data: rgba}
const metric = {defaultWidth: 4, scale: [1, 0.9935]}
const openAxes = [
  [[2.1515202681, 74.4088543546], [87.4293161649, 75.6240842803]],
  [[50.0213911785, 7.2860228927], [2.3901119493, 22.2270612749]],
  [[78.3033093857, 1.1898349752], [57.1967092361, 47.575930824]],
].map((points, id) => ({points, id}))
const openResult = derive(sampleImage, ground, openAxes, metric)
assert.deepEqual(openResult.lines.map(line => line.extensions.length), [2, 2, 1])
assert.equal(openResult.regions.length, 4)
assert.ok(Math.abs(area(openResult.paths) + area(openResult.remainder) - area(ground)) < 1e-5)

const preciseAxes = [{id: 0, points: [[248, 570], [203, 205]]}]
const preciseBoundary = rect(10, 10, 610, 610)
const preciseMetric = {defaultWidth: 2, scale: [0.1, 0.0994]}
const straight = derive(null, preciseBoundary, preciseAxes, preciseMetric)
const nearlyStraight = derive(null, preciseBoundary, preciseAxes, {
  ...preciseMetric, directions: {0: {start: [45.0000001, 365.000002]}},
})
assert.deepEqual(nearlyStraight.paths, straight.paths)
assert.ok(nearlyStraight.lines[0].extensions[0].corrected)
const wideJunction = derive(null, ground, [
  {id: 'through', points: [[20, 50], [80, 50]], width: 12},
  {id: 'spur', points: [[50, 20], [50, 45]], width: 2},
], {defaultWidth: 2, scale: [1, 1]})
assert.deepEqual(wideJunction.lines[1].extensions.map(item => item.end), ['start'])
assert.equal(wideJunction.regions.length, 3)

const centre = [[42, 42], [58, 42], [58, 58], [42, 58], [42, 42]]
const spokes = [[[50, 42], [50, 22]], [[58, 50], [78, 50]], [[50, 58], [50, 78]], [[42, 50], [22, 50]]]
const fourArms = (withCentre, directions) => derive(null, ground,
  (withCentre ? [centre, ...spokes] : spokes).map((points, id) => ({id, points})),
  {defaultWidth: 2, scale: [1, 1], directions})
assert.equal(fourArms(false).regions.length, 4)
const withCentre = fourArms(true)
assert.equal(withCentre.regions.length, 5)
assert.ok(withCentre.regions.some(region => Math.abs(area(region.geometry) - 196) < 1e-8))
assert.equal(withCentre.lines.flatMap(line => line.extensions).length, 4)
assert.ok(withCentre.lines.flatMap(line => line.extensions).every(line => !('geometry' in line) && !('widthMetres' in line)))
assert.deepEqual(fourArms(true, {1: {end: [5, -20]}}).paths, withCentre.paths)
for (const [i, region] of withCentre.regions.entries()) {
  assert.ok(area(intersect(region.geometry, withCentre.paths)) < 1e-8)
  for (const other of withCentre.regions.slice(i + 1)) assert.ok(area(intersect(region.geometry, other.geometry)) < 1e-8)
}
assert.ok(Math.abs(area(withCentre.paths) + area(withCentre.remainder) - 10000) < 1e-8)

const single = derive(null, ground, [{id: 'short', points: [[30, 50], [70, 50]]}], {scale: [1, 1], defaultWidth: 4})
assert.equal(single.regions.length, 2)
const expectedCapsule = 40 * 4 + 32 * 2 * Math.sin(Math.PI / 16)
assert.ok(Math.abs(area(single.paths) - expectedCapsule) < 1e-8)

const connectedCaps = derive(null, rect(0, 0, 120, 100), [
  {id: 'left', points: [[7, 65], [57, 65]]},
  {id: 'right', points: [[63, 65], [113, 65]]},
], {scale: [1, 1], defaultWidth: 10})
assert.deepEqual(connectedCaps.lines.map(line => line.extensions.map(item => item.end)), [['start'], ['end']])
assert.equal(connectedCaps.regions.length, 2)

const virtualMeeting = derive(null, ground, [
  {id: 'horizontal', points: [[20, 35], [35, 35]]},
  {id: 'vertical', points: [[65, 75], [65, 55]]},
], {scale: [1, 1], defaultWidth: 2})
assert.deepEqual(virtualMeeting.lines[0].extensions.find(item => item.end === 'end').points[1], [65, 35])
assert.deepEqual(virtualMeeting.lines[1].extensions.find(item => item.end === 'end').points[1], [65, 0])
assert.equal(virtualMeeting.regions.length, 3)
const nearlyCoincidentCaps = derive(null, preciseBoundary, [
  {id: 'bends', points: [[345, 508], [254, 533], [427, 244], [326, 409]], width: 1.154},
], preciseMetric)
assert.equal(nearlyCoincidentCaps.regions.length, 2)
assert.ok(Math.abs(area(nearlyCoincidentCaps.paths) + area(nearlyCoincidentCaps.remainder) - area(preciseBoundary)) < 1e-6)

const read = path => readFileSync(new URL('../../' + path, import.meta.url))
const json = path => JSON.parse(read(path))
const {bagua: {fixture}} = await readGardens(json)
const image = PNG.sync.read(read(fixture.image.url.slice(1)))
const boundary = shape(fixture.suggestedBoundary.slice(0, -1).map(point => pixelPoint(fixture.image, point)))
const scale = metresPerPixel(fixture.image)
const axes = baguaNetwork.map((points, id) => ({id, points}))
const result = derive(image, boundary, axes, {defaultWidth: 0.8, scale})
const mask = vegetationMask(image)
const candidates = result.regions.map(region => inspectRegion(region, mask))
const refs = json('evidence/segmentation/references.json').filter(ref => ref.kind === 'bed')
  .map(ref => shape(ref.ring.slice(0, -1).map(point => pixelPoint(fixture.image, point))))
assert.equal(result.paths.length, 1)
assert.equal(result.regions.length, 4)
assert.ok(Math.abs(area(result.paths) + area(result.remainder) - area(boundary)) < 1e-5)
console.log(JSON.stringify({
  connectedWays: result.paths.length, groundAreas: result.regions.length,
  proposals: candidates.map(candidate => ({green: candidate.fraction, squareMetres: area(candidate.candidate) * scale[0] * scale[1]})),
  bestBedIoU: refs.map(ref => Math.max(...candidates.map(candidate => iou(candidate.candidate, ref)))),
  bedReferenceOverlappingWays: refs.map(ref => area(intersect(ref, result.paths)) / area(ref)),
}, null, 2))
