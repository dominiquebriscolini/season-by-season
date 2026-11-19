import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { toLonLat } from 'ol/proj.js'
import { PNG } from 'pngjs'
import { evaluateImage } from '../../src/garden-analysis.js'
import { compare } from '../aerial-transfer.mjs'

const directory = fileURLToPath(new URL('../../evidence/segmentation/', import.meta.url))
const file = name => resolve(directory, name)
const read = name => JSON.parse(readFileSync(file(name), 'utf8').replace(/^\uFEFF/u, ''))
const sha = name => createHash('sha256').update(readFileSync(file(name))).digest('hex')
const save = (name, value) => writeFileSync(file(name), JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
const methods = ['manual', 'rgb', 'segment']
const [command, argument, output] = process.argv.slice(2)
const fixture = read('fixture.json')
if ('references' in fixture) throw new Error('The benchmark fixture must not contain references.')
const { image, suggestedBoundary } = fixture

function pixelToGeo([x, y]) {
  const [west, south, east, north] = image.projectedExtent
  const [width, height] = image.size
  return toLonLat([west + x / width * (east - west), north - y / height * (north - south)])
}

function rgb(pairs, pixels) {
  return pairs.flatMap(({ points: [a, b, c, d], halfWidth }, index) => {
    const window = [
      Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1]),
    ]
    const axis = [c, d].sort((first, second) => first[1] - second[1])
    if (axis[0][1] === axis[1][1]) throw new Error('Existing RGB procedure requires positive rise in image Y.')
    const analysisPrompts = { bed: { window }, path: { axis, halfWidth } }
    const { objects } = evaluateImage({ image, analysisPrompts, references: [] }, suggestedBoundary, pixels)
    return objects.map(object => ({ ...object, id: object.kind + '-' + (index + 1) }))
  })
}

function manual(outlines) {
  return outlines.map(({ kind, points }, index) => {
    const ring = [...points, points[0]].map(pixelToGeo)
    return { id: kind + '-' + (index + 1), kind, ring }
  })
}

if (['manual', 'rgb'].includes(command)) {
  const input = read(command + '-input.json')
  const pixels = command === 'rgb' ? PNG.sync.read(readFileSync(file(image.url.split('/').at(-1)))) : null
  const start = performance.now()
  const objects = command === 'rgb' ? rgb(input.objects, pixels) : manual(input.objects)
  const runtimeMs = performance.now() - start
  save(argument ? resolve(argument) : command + '-predictions.json', { objects, runtimeMs })
} else if (command === 'seal') {
  if (!/^[0-9a-f]{64}$/u.test(argument) || existsSync(file('references.json'))) {
    throw new Error('Seal all methods before releasing reference polygons.')
  }
  const names = ['fixture.json', image.url.split('/').at(-1),
    ...methods.flatMap(method => [method + '-input.json', method + '-predictions.json'])]
  save('seal.json', { time: new Date().toISOString(), referenceSha256: argument, files: Object.fromEntries(names.map(name => [name, sha(name)])) })
  console.log(JSON.stringify(read('seal.json'), null, 2))
} else if (command === 'score') {
  const seal = read('seal.json')
  if (sha('seal.json') !== argument) throw new Error('Verify the seal SHA-256 before scoring.')
  if (sha('references.json') !== seal.referenceSha256) throw new Error('Reference SHA-256 does not match.')
  for (const [name, digest] of Object.entries(seal.files)) {
    if (sha(name) !== digest) throw new Error('Sealed file changed: ' + name)
  }
  const references = read('references.json')
  const runs = methods.map(method => {
    const input = read(method + '-input.json')
    const predictions = read(method + '-predictions.json')
    const result = compare({ id: method, name: fixture.name, image, objects: predictions.objects }, references)
    const actions = input.events.reduce((counts, event) => {
      counts[event.action] = (counts[event.action] ?? 0) + 1
      return counts
    }, {})
    const averageIoU = result.rows.reduce((total, row) => total + row.iou, 0) / result.rows.length
    const reached = result.rows.filter(row => row.iou >= 0.5).length
    return { ...result, actions, actionCount: input.events.length, elapsedMs: input.elapsedMs,
      runtimeMs: predictions.runtimeMs, averageIoU, reached }
  })
  save(output ? resolve(output) : 'score.json', { sealSha256: argument, matching: 'Maximum total IoU, independent of kind and ID', runs })
  console.log(JSON.stringify(runs, null, 2))
} else {
  throw new Error('Usage: run.mjs (manual|rgb) [output] | seal <reference-sha> | score <seal-sha> [output]')
}
