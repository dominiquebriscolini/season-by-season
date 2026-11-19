import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fromLonLat } from 'ol/proj.js'
import { PNG } from 'pngjs'
import polygon from 'polygon-clipping'
import { evaluateImage } from '../src/garden-analysis.js'

const root = fileURLToPath(new URL('../', import.meta.url))
const source = resolve(root, 'src/garden-analysis.js')
const tandelFile = resolve(root, 'public/garden/fixture.json')
const readJson = file => JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/u, ''))
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const fileSha = file => sha256(readFileSync(file))
const serialize = data => `${JSON.stringify(data, null, 2)}\n`

function pngFor(fixture, fixtureFile) {
  const url = fixture.image.url
  const file = fixtureFile === tandelFile
    ? resolve(root, 'public', `.${url}`)
    : resolve(dirname(fixtureFile), url.split('/').at(-1))
  const png = readFileSync(file)
  const pixels = PNG.sync.read(png)
  if (pixels.width !== fixture.image.size[0] || pixels.height !== fixture.image.size[1]) {
    throw new Error(`PNG size does not match metadata: ${file}`)
  }
  return { pixels, imageSha256: sha256(png) }
}

function predict(id, fixtureFile, analysisPrompts, promptOrigin) {
  const fixture = readJson(fixtureFile)
  const { pixels, imageSha256 } = pngFor(fixture, fixtureFile)
  const { name, image, suggestedBoundary } = fixture
  // Keep the benchmark references outside this call, including at the baseline site.
  const { objects } = evaluateImage({ image, analysisPrompts, references: [] }, suggestedBoundary, pixels)
  return {
    id,
    name,
    imageSha256,
    image,
    boundary: suggestedBoundary,
    promptOrigin,
    analysisPrompts,
    manualInputs: {
      boundaryVertices: suggestedBoundary.length - 1,
      bedWindowCorners: promptOrigin === 'tandel-reused' ? 0 : 2,
      pathAxisEndpoints: promptOrigin === 'tandel-reused' ? 0 : 2,
      pathHalfWidths: promptOrigin === 'tandel-reused' ? 0 : 1,
      predefinedKinds: ['bed', 'path'],
    },
    objects,
  }
}

function freeze(fixtureFile, promptsFile, outputFile, referenceSha256) {
  if (!/^[a-f0-9]{64}$/u.test(referenceSha256 ?? '')) {
    throw new Error('Supply the SHA-256 of the sealed second-garden references.')
  }
  const tandel = readJson(tandelFile)
  const second = readJson(fixtureFile)
  if (second.references !== undefined) {
    throw new Error('The second-garden analysis fixture must not contain references.')
  }
  const secondPrompts = readJson(promptsFile)
  const frozen = {
    method: 'Unchanged RGB masks and contour extraction from src/garden-analysis.js',
    frozenAt: new Date().toISOString(),
    sourceSha256: fileSha(source),
    lockSha256: fileSha(resolve(root, 'package-lock.json')),
    secondFixtureSha256: fileSha(fixtureFile),
    secondPromptsSha256: fileSha(promptsFile),
    sealedSecondReferencesSha256: referenceSha256,
    runs: [
      predict('tandel-baseline', tandelFile, tandel.analysisPrompts, 'tandel-calibrated'),
      predict('second-fixed-priors', fixtureFile, tandel.analysisPrompts, 'tandel-reused'),
      predict('second-site-guided', fixtureFile, secondPrompts, 'second-raw-image'),
    ],
  }
  const bytes = serialize(frozen)
  writeFileSync(outputFile, bytes, { flag: 'wx' })
  console.log(`Predictions SHA-256 ${sha256(bytes)}`)
}

function localShape(ring, image) {
  const [west, south] = image.projectedExtent
  const latitude = (image.extent[1] + image.extent[3]) / 2
  const scale = Math.cos(latitude * Math.PI / 180)
  return [[ring.map(point => {
    const [x, y] = fromLonLat(point)
    return [(x - west) * scale, (y - south) * scale]
  })]]
}

function ringArea(ring) {
  let sum = 0
  for (let i = 1; i < ring.length; i++) {
    sum += ring[i - 1][0] * ring[i][1] - ring[i][0] * ring[i - 1][1]
  }
  return Math.abs(sum) / 2
}

function area(shape) {
  return shape.reduce((total, [exterior, ...holes]) =>
    total + ringArea(exterior) - holes.reduce((sum, hole) => sum + ringArea(hole), 0), 0)
}

function overlap(prediction, reference) {
  const intersection = area(polygon.intersection(prediction, reference))
  return intersection / (area(prediction) + area(reference) - intersection)
}

// Find the maximum total IoU with each object used at most once. Neither
// the fixed IDs nor the fixed class labels take part in this assignment.
function assign(overlaps, predictionIndex = 0, used = new Set()) {
  if (predictionIndex === overlaps.length) return { total: 0, pairs: [] }
  let best = assign(overlaps, predictionIndex + 1, used)
  for (const [referenceIndex, iou] of overlaps[predictionIndex].entries()) {
    if (iou <= 0 || used.has(referenceIndex)) continue
    const rest = assign(overlaps, predictionIndex + 1, new Set([...used, referenceIndex]))
    if (iou + rest.total > best.total) {
      best = { total: iou + rest.total, pairs: [[predictionIndex, referenceIndex], ...rest.pairs] }
    }
  }
  return best
}

export function compare(run, references) {
  const actualShapes = run.objects.map(object => localShape(object.ring, run.image))
  const referenceShapes = references.map(object => localShape(object.ring, run.image))
  const overlaps = actualShapes.map(actual => referenceShapes.map(reference => overlap(actual, reference)))
  const { pairs } = assign(overlaps)
  const matched = new Map(pairs.map(([actual, reference]) => [reference, actual]))
  const matchedPredictions = new Set(matched.values())
  return {
    id: run.id,
    name: run.name,
    promptOrigin: run.promptOrigin,
    manualInputs: run.manualInputs,
    predictedCount: run.objects.length,
    expectedCount: references.length,
    rows: references.map((reference, index) => {
      const actual = matched.get(index)
      const prediction = run.objects[actual]
      return {
        referenceId: reference.id,
        referenceKind: reference.kind,
        referenceAreaM2: area(referenceShapes[index]),
        predictionId: prediction?.id ?? null,
        predictionKind: prediction?.kind ?? null,
        predictionAreaM2: prediction ? area(actualShapes[actual]) : 0,
        iou: prediction ? overlaps[actual][index] : 0,
        kindAgrees: prediction ? prediction.kind === reference.kind : null,
      }
    }),
    unmatchedPredictions: run.objects.flatMap(({ id, kind }, index) =>
      matchedPredictions.has(index) ? [] : [{ id, kind, areaM2: area(actualShapes[index]) }]),
  }
}

function score(frozenFile, expectedSha256, referencesFile, outputFile) {
  const frozenSha256 = fileSha(frozenFile)
  if (frozenSha256 !== expectedSha256) throw new Error('Frozen predictions SHA-256 mismatch.')
  const frozen = readJson(frozenFile)
  const secondReferencesSha256 = fileSha(referencesFile)
  if (secondReferencesSha256 !== frozen.sealedSecondReferencesSha256) {
    throw new Error('The released reference file does not match the sealed SHA-256.')
  }
  const released = readJson(referencesFile)
  const second = Array.isArray(released) ? released : released.references
  const tandel = readJson(tandelFile)
  const result = {
    frozenSha256,
    tandelFixtureSha256: fileSha(tandelFile),
    secondReferencesSha256,
    matching: 'Maximum total IoU, positive overlap, one-to-one, independent of IDs and kinds',
    runs: frozen.runs.map(run => compare(run, run.id === 'tandel-baseline' ? tandel.references : second)),
  }
  writeFileSync(outputFile, serialize(result))
  console.log(serialize(result))
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command, ...args] = process.argv.slice(2)
  if (command === 'freeze' && args.length === 4) freeze(...args)
  else if (command === 'score' && args.length === 4) score(...args)
  else {
    console.error('Usage: aerial-transfer.mjs freeze fixture.json prompts.json frozen.json sealed-reference-sha256')
    console.error('       aerial-transfer.mjs score frozen.json predictions-sha256 reference.json score.json')
    process.exitCode = 1
  }
}
