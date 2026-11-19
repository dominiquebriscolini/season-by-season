import assert from 'node:assert/strict'
import {calculatePlanting, validPlantingDetails} from '../src/planting-plan.js'

const rectangle = [[[ [0, 0], [10, 0], [10, 1], [0, 1], [0, 0] ]]]
const carrots = {
  variety: 'Testmöhre', method: 'sow', start: '2028-04-01',
  rowSpacingCm: 25, plantSpacingCm: 10, daysMin: 90, daysMax: 110,
  germinationPct: 80, yieldEach: .02, yieldUnit: 'kg',
}
assert(validPlantingDetails(carrots))
const original = calculatePlanting(rectangle, [1, 1], 90, carrots)
assert.deepEqual(original, {
  rowCount: 4, rowLengthMetres: 40, plants: 400, unitsNeeded: 500,
  harvestStart: '2028-06-30', harvestEnd: '2028-07-20', expectedYield: 8,
})
assert.deepEqual(calculatePlanting(rectangle, [1, 1], 270, carrots), original)

const wider = calculatePlanting(rectangle, [1, 1], 90, {...carrots, plantSpacingCm: 12.5})
assert.equal(wider.plants, 320)
assert.equal(wider.unitsNeeded, 400)
assert.equal(wider.expectedYield, 6.4)
const missing = calculatePlanting(rectangle, [1, 1], 90, {...carrots, yieldEach: null, germinationPct: null})
assert.equal(missing.plants, 400)
assert.equal(missing.unitsNeeded, null)
assert.equal(missing.expectedYield, null)
assert.equal(calculatePlanting(rectangle, [1, 1], 90, {...carrots, method: 'transplant'}).unitsNeeded, 400)

const u = [[[ [0, 0], [10, 0], [10, 4], [7, 4], [7, 1], [3, 1], [3, 4], [0, 4], [0, 0] ]]]
const uRows = calculatePlanting(u, [1, 1], 90, {...carrots, rowSpacingCm: 200, plantSpacingCm: 100})
assert.equal(uRows.rowCount, 2)
assert.equal(uRows.rowLengthMetres, 12)
assert.equal(uRows.plants, 12)

const hole = [[[ [0, 0], [10, 0], [10, 1], [0, 1], [0, 0] ],
  [ [3, .1], [7, .1], [7, .9], [3, .9], [3, .1] ]]]
const clipped = calculatePlanting(hole, [1, 1], 90, {...carrots, rowSpacingCm: 100, plantSpacingCm: 200})
assert.equal(clipped.rowCount, 1)
assert.equal(clipped.rowLengthMetres, 6)
assert.equal(clipped.plants, 2, 'The gap must not contribute fractional plant spacings.')

const pixels = [[[ [0, 0], [50, 0], [50, 10], [0, 10], [0, 0] ]]]
assert.deepEqual(calculatePlanting(pixels, [.2, .1], 90, carrots), original)
assert(!validPlantingDetails({...carrots, start: '2027-02-29'}))
assert(!validPlantingDetails({...carrots, daysMax: 89}))
assert(!validPlantingDetails({...carrots, germinationPct: 0}))
assert(!validPlantingDetails({...carrots, rowSpacingCm: .9}))
assert(validPlantingDetails({}))
console.log('Planting dates, yields, row geometry, gaps and input validation passed.')
