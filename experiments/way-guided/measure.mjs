import {createHash} from 'node:crypto'
import {readFileSync, writeFileSync} from 'node:fs'
import assert from 'node:assert/strict'
import {PNG} from 'pngjs'
import clip from 'polygon-clipping'
import {baguaNetwork, readGardens} from './gardens.js'
import {area, derive, intersect, iou, pixelPoint, reconcile, shape} from './model.js'

const read = path => readFileSync(new URL('../../' + path, import.meta.url))
const json = path => JSON.parse(read(path))
const gardens = await readGardens(json)
const hash = data => createHash('sha256').update(data).digest('hex')
const datasets = {
  tandel: {image: 'public/garden/tandel-ortho-2023.png', reference: 'public/garden/fixture.json'},
  hesperange: {image: 'evidence/transfer/hesperange-ortho-2023.png', reference: 'evidence/transfer/references.json'},
  bagua: {image: 'evidence/segmentation/bagua-ortho-2023.png', reference: 'evidence/segmentation/references.json'},
}

function referenceWidth(geometry, a, b, fraction) {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1])
  const normal = [(a[1] - b[1]) / length, (b[0] - a[0]) / length]
  const point = a.map((value, i) => value + (b[i] - value) * fraction)
  const crossings = []
  for (const [ring] of geometry) {
    for (let i = 1; i < ring.length; i++) {
      const relative = ring.slice(i - 1, i + 1).map(p => p.map((v, j) => v - point[j]))
      const [s, t] = relative.map(([x, y]) => x * normal[1] - y * normal[0])
      if ((s > 0) === (t > 0)) continue
      const [u, v] = relative.map(([x, y]) => x * normal[0] + y * normal[1])
      crossings.push(u + (v - u) * s / (s - t))
    }
  }
  crossings.sort((x, y) => x - y)
  for (let i = 0; i + 1 < crossings.length; i += 2) {
    if (crossings[i] <= 0 && crossings[i + 1] >= 0) return crossings[i + 1] - crossings[i]
  }
  return null
}

function bestAssignment(references, lines, used = new Set()) {
  if (!references.length) return {sum: 0, indices: []}
  const [head, ...tail] = references
  const candidates = [-1, ...lines.keys()].filter(i => !used.has(i))
  return candidates.map(i => {
    const score = i < 0 ? 0 : iou(head.geometry, lines[i].geometry)
    if (i >= 0 && !score) return null
    const rest = bestAssignment(tail, lines, i < 0 ? used : new Set([...used, i]))
    return {sum: score + rest.sum, indices: [i, ...rest.indices]}
  }).filter(Boolean).sort((a, b) => b.sum - a.sum)[0]
}

function measure(name, alternative) {
  const {fixture, axes: previousAxes} = gardens[name]
  const points = alternative ?? previousAxes
  const source = datasets[name]
  const buffer = read(source.image)
  const image = PNG.sync.read(buffer)
  const boundary = shape(fixture.suggestedBoundary.slice(0, -1).map(point => pixelPoint(fixture.image, point)))
  const axes = points.map((line, id) => ({id, points: line}))
  const pixelMetres = (fixture.image.projectedExtent[2] - fixture.image.projectedExtent[0]) / image.width
    * Math.cos((fixture.image.extent[1] + fixture.image.extent[3]) * Math.PI / 360)
  const before = process.memoryUsage()
  const timings = []
  let result
  for (let i = 0; i < 9; i++) {
    const start = performance.now()
    result = derive(image, boundary, axes)
    timings.push(performance.now() - start)
  }
  const after = process.memoryUsage()
  const orderedTimings = timings.slice(1).sort((a, b) => a - b)
  const fixed = derive(image, boundary, axes.map(axis => ({...axis, widths: axis.points.slice(1).map(() => 8)})))
  const referenceJson = json(source.reference)
  const references = (referenceJson.references ?? referenceJson).map(ref => ({
    ...ref, geometry: shape(ref.ring.slice(0, -1).map(point => pixelPoint(fixture.image, point))),
  }))
  const pathRefs = references.filter(ref => ref.kind === 'path')
  const matches = bestAssignment(pathRefs, result.lines).indices
  const fixedMatches = bestAssignment(pathRefs, fixed.lines).indices
  const paths = pathRefs.map((ref, index) => {
    const match = matches[index]
    const line = result.lines[match]
    const widthSamples = line?.sections.flatMap(section => section.widths.slice(1, -1).map((width, i) => {
      const axis = axes[match].points
      const actual = referenceWidth(ref.geometry, axis[section.index], axis[section.index + 1], (i + 1) / (section.widths.length - 1))
      return actual == null ? null : [width * pixelMetres, actual * pixelMetres]
    })) ?? []
    const comparable = widthSamples.filter(Boolean)
    return {
      id: ref.id, matchedAxis: match < 0 ? null : match + 1,
      iou: line ? iou(ref.geometry, line.geometry) : 0,
      fixed8PixelIou: fixed.lines[fixedMatches[index]] ? iou(ref.geometry, fixed.lines[fixedMatches[index]].geometry) : 0,
      referenceM2: area(ref.geometry) * pixelMetres ** 2,
      predictedM2: area(line?.geometry ?? []) * pixelMetres ** 2,
      widthSamples: comparable.length, excludedStations: widthSamples.length - comparable.length,
      widthMAEMetres: comparable.length ? comparable.reduce((sum, [a, b]) => sum + Math.abs(a - b), 0) / comparable.length : null,
      fixed8PixelWidthMAEMetres: comparable.length ? comparable.reduce((sum, [, b]) => sum + Math.abs(8 * pixelMetres - b), 0) / comparable.length : null,
      widthRangeMetres: line?.sections.map(s => [Math.min(...s.widths) * pixelMetres, Math.max(...s.widths) * pixelMetres]),
    }
  })
  const remainder = references.filter(ref => ref.kind === 'bed').map(ref => ({
    id: ref.id, bestRegionIou: Math.max(0, ...result.regions.map(region => iou(ref.geometry, region.geometry))),
    coveredByPaths: area(intersect(ref.geometry, result.paths)) / area(ref.geometry),
  }))
  const union = clip.union(...pathRefs.map(ref => ref.geometry))
  const referenceRemainder = clip.difference(boundary, union)
  const actionCounts = {mode: axes.length, vertices: axes.reduce((sum, axis) => sum + axis.points.length, 0), finish: axes.length}
  return {
    name, imageSha256: hash(buffer), referenceSha256: hash(read(source.reference)),
    pixelMetres, pathComponents: result.paths.length, residualComponents: result.regions.length,
    residualAreasM2: result.regions.map(region => area(region.geometry) * pixelMetres ** 2).sort((a, b) => b - a),
    residualIouAgainstBoundaryMinusReferencedPaths: iou(result.remainder, referenceRemainder),
    residualAreaErrorM2: (area(result.remainder) - area(referenceRemainder)) * pixelMetres ** 2,
    partitionAreaErrorPixels: Math.abs(area(boundary) - area(result.remainder) - area(result.paths)),
    paths, remainder, unresolvedRegionTypes: result.regions.length,
    widthQuestions: result.lines.flatMap(line => line.sections).filter(s => s.weakProfiles).length,
    actionCounts, elapsedMs: {first: timings[0], repeatedMedian: (orderedTimings[3] + orderedTimings[4]) / 2},
    memoryBytes: {rgba: image.data.length, rssBefore: before.rss, rssAfter: after.rss, heapUsedBefore: before.heapUsed, heapUsedAfter: after.heapUsed},
  }
}

function synthetic() {
  const width = 160
  const height = 160
  const data = Buffer.alloc(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const paved = Math.abs(y - 75) < (x < 80 ? 4 : 9) || Math.abs(x - 50) < 4
      const i = (y * width + x) * 4
      data.fill(paved ? 200 : 45, i, i + 3)
      data[i + 3] = 255
    }
  }
  const image = {width, height, data}
  const boundary = shape([[12, 12], [145, 12], [145, 145], [110, 145], [100, 125], [12, 145]])
  const axes = [{id: 1, points: [[10, 75], [147, 75]]}, {id: 2, points: [[50, 10], [50, 147]]}]
  const result = derive(image, boundary, axes)
  const widths = result.lines[0].sections[0].widths
  const narrow = widths[4]
  const wide = widths.at(-5)
  const partitionError = Math.abs(area(boundary) - area(result.paths) - area(result.remainder))
  assert.equal(result.paths.length, 1)
  assert.equal(result.regions.length, 4)
  assert.ok(narrow <= 9 && wide >= 14 && wide - narrow >= 6)
  assert.ok(partitionError < 1e-6)
  let id = 0
  const nextId = () => ++id
  const first = reconcile([], result.regions, nextId).regions
  first[0].culture = 'Möhre'
  const correction = derive(image, boundary, [axes[0], {...axes[1], widths: [9]}])
  const matched = reconcile(first, correction.regions, nextId)
  assert.equal(matched.regions.find(region => region.id === first[0].id).culture, 'Möhre')
  const merged = reconcile(first, derive(image, boundary, axes.slice(0, 1)).regions, nextId)
  assert.ok(merged.retired.some(region => region.culture === 'Möhre'))
  return {pathComponents: result.paths.length, residualComponents: result.regions.length,
    narrowPixels: narrow, widePixels: wide, expectedRasterWidthsPixels: [7, 17], partitionAreaErrorPixels: partitionError,
    stableCultureAfterCorrection: true, mergeArchivesCulture: true}
}

const network = measure('bagua', baguaNetwork)
const output = {
  synthetic: synthetic(), gardens: Object.keys(gardens).map(name => measure(name)),
  baguaMainNetwork: {
    pathComponents: network.pathComponents, residualComponents: network.residualComponents,
    residualAreasM2: network.residualAreasM2,
    partitionAreaErrorPixels: network.partitionAreaErrorPixels,
    remainder: network.remainder, widthQuestions: network.widthQuestions, actionCounts: network.actionCounts,
    elapsedMs: network.elapsedMs, memoryBytes: network.memoryBytes,
  },
}
writeFileSync(new URL('./measurements.json', import.meta.url), JSON.stringify(output, null, 2) + '\n')
console.log(JSON.stringify(output, null, 2))
