import assert from 'node:assert/strict'
import {area, intersect, shape} from '../experiments/way-guided/model.js'
import {
  angleForLayout, normalizeAngle, planStripChange, splitField, validStripLayout,
} from '../src/strip-layout.js'

const metric = [0.2, 0.4]
const outline = shape([[0, 0], [12, 0], [12, 10], [8, 10], [8, 3], [4, 3], [4, 10], [0, 10]])
const hole = shape([[1, 4], [3, 4], [3, 6], [1, 6]])
const usable = [[outline[0][0], hole[0][0]]]
const irregular = {id: 'Fläche-1', geometry: outline, usable}
const rectangle = shape([[0, 0], [20, 0], [20, 10], [0, 10]])
const field = {id: 'Fläche-2', geometry: rectangle, usable: rectangle}
const original = {
  cultures: {'Fläche-2:strip:1': 'Bohne', 'Fläche-2:strip:2': 'Möhre', 'Fläche-3': 'Tomate'},
  splits: {'Fläche-2': {count: 2, angle: 0}},
  archived: [],
}

assert.equal(normalizeAngle(360), 0)
assert.equal(normalizeAngle(-15), 345)
assert.equal(normalizeAngle(-Number.EPSILON), 0)
assert.ok(validStripLayout({count: 1, angle: 185.4}))
assert.ok(validStripLayout({count: 2, direction: 'cross', axis: [1, 0]}))
assert.ok(!validStripLayout({count: 1, direction: 'cross'}))
assert.ok(!validStripLayout({count: 2, angle: 360}))
assert.equal(angleForLayout(field, {count: 2, direction: 'length', axis: [1, 0]}, metric), 90)

for (const angle of [0, 5, 17.42, 45, 90, 162.215, 270, 359.9]) {
  const strips = splitField(irregular, usable, {count: 9, angle}, metric)
  const flipped = splitField(irregular, usable, {count: 9, angle: normalizeAngle(angle + 180)}, metric)
  assert.deepEqual(strips, flipped, `Half-turn changed strip order at ${angle}°`)
  let covered = 0
  for (const [index, strip] of strips.entries()) {
    covered += area(strip.geometry)
    assert.ok(area(intersect(hole, strip.geometry)) < 1e-7)
    for (const other of strips.slice(0, index)) assert.ok(area(intersect(strip.geometry, other.geometry)) < 1e-7)
  }
  assert.ok(Math.abs(covered - area(usable)) < 1e-7)
}
assert.ok(splitField(irregular, usable, {count: 4, angle: 90}, metric).some(strip => strip.geometry.length > 1))

for (const angle of [2, 180]) {
  const result = planStripChange(original, field, {count: 2, angle}, metric)
  assert.equal(result.preservedCount, 2)
  assert.deepEqual(result.next.cultures, original.cultures)
}
const unclear = planStripChange(original, field, {count: 2, angle: 90}, metric)
assert.equal(unclear.archivedCount, 2)
assert.deepEqual(unclear.next.cultures, {'Fläche-3': 'Tomate'})
assert.deepEqual(unclear.next.archived[0].cultures, {'Fläche-2:strip:1': 'Bohne', 'Fläche-2:strip:2': 'Möhre'})
assert.equal(original.archived.length, 0)
assert.deepEqual(original.cultures, {'Fläche-2:strip:1': 'Bohne', 'Fläche-2:strip:2': 'Möhre', 'Fläche-3': 'Tomate'})

const legacy = {...original, splits: {'Fläche-2': {count: 2, direction: 'cross', axis: [1, 0]}}}
const legacyStrips = splitField(field, rectangle, legacy.splits['Fläche-2'], metric)
assert.deepEqual(legacyStrips.map(strip => strip.geometry), [
  shape([[10, 0], [20, 0], [20, 10], [10, 10]]),
  shape([[0, 0], [10, 0], [10, 10], [0, 10]]),
])
const reversed = planStripChange(legacy, field, {count: 2, angle: 180}, metric)
assert.equal(reversed.preservedCount, 2)
assert.deepEqual(reversed.next.cultures, {'Fläche-2:strip:1': 'Möhre', 'Fläche-2:strip:2': 'Bohne', 'Fläche-3': 'Tomate'})
assert.deepEqual(splitField(field, rectangle, {count: 1, angle: 45}, metric), [])

console.log('Strip geometry, legacy order, validation and crop reassignment passed.')
