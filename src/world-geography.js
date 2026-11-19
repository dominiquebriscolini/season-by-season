import {get as getProjection, toLonLat} from 'ol/proj.js'
import {getIntersection, isEmpty} from 'ol/extent.js'
import {createXYZ} from 'ol/tilegrid.js'
import {worldBasemaps} from './world-basemaps.js'
import {luxembourgAerial} from './luxembourg-aerial.js'

export const worldProjection = 'EPSG:3857'
const sectionSize = 624
const minSpan = 4
export const maxWorldSectionSpan = 5000
const projectionExtent = getProjection(worldProjection).getExtent()
const grids = Object.fromEntries(Object.entries(worldBasemaps).map(([mode, {tileSize, levels}]) =>
  [mode, createXYZ({extent: projectionExtent, maxZoom: levels.at(-1), tileSize})]))
const svgNamespace = 'http://www.w3.org/2000/svg'
let nextTileLayer = 0

export function validWorldGeoreference(georeference) {
  const {projection, projectedExtent, size} = georeference ?? {}
  if (projection !== worldProjection || !Array.isArray(size) || size.length !== 2 ||
      !size.every(dimension => dimension === sectionSize) ||
      !Array.isArray(projectedExtent) || projectedExtent.length !== 4 ||
      !projectedExtent.every(Number.isFinite)) return false
  const [west, south, east, north] = projectedExtent
  const width = east - west
  const height = north - south
  return west >= projectionExtent[0] && south >= projectionExtent[1] &&
    east <= projectionExtent[2] && north <= projectionExtent[3] &&
    width >= minSpan - 1e-8 && width <= maxWorldSectionSpan + 1e-8 &&
    Math.abs(width - height) <= 1e-8
}

export function worldSection(center, resolution) {
  if (!Array.isArray(center) || center.length !== 2 || !center.every(Number.isFinite) ||
      !Number.isFinite(resolution) || resolution <= 0) return null
  const [x, y] = center
  const radius = sectionSize * resolution / 2
  const georeference = {projection: worldProjection, size: [sectionSize, sectionSize],
    projectedExtent: [x - radius, y - radius, x + radius, y + radius]}
  return validWorldGeoreference(georeference) ? georeference : null
}

export function worldImage(georeference) {
  if (!validWorldGeoreference(georeference)) return null
  const [west, south, east, north] = georeference.projectedExtent
  return {...georeference, extent: [...toLonLat([west, south]), ...toLonLat([east, north])]}
}

function svgElement(svg, name, attributes) {
  const node = svg.ownerDocument.createElementNS(svgNamespace, name)
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value)
  return node
}

export function renderWorldTiles(svg, georeference, mode, {onAvailable, onUnavailable, onRegionalAvailability} = {}) {
  const [west, south, east, north] = georeference.projectedExtent
  const unitsPerMetre = sectionSize / (east - west)
  const grid = grids[mode]
  const {levels, url} = worldBasemaps[mode]
  const nativeZoom = grid.getZForResolution(1 / unitsPerMetre)
  const group = svgElement(svg, 'g', {'data-world-tiles': '', 'data-world-basemap': mode,
    'aria-hidden': 'true', 'pointer-events': 'none'})
  const clipId = `world-map-section-clip-${++nextTileLayer}`
  const clip = svgElement(svg, 'clipPath', {id: clipId})
  clip.append(svgElement(svg, 'rect', {x: 0, y: 0, width: sectionSize, height: sectionSize}))
  const tiles = svgElement(svg, 'g', {'clip-path': `url(#${clipId})`})
  group.append(clip, tiles)
  function imageTile(extent, href) {
    const [left, bottom, right, top] = extent
    return svgElement(svg, 'image', {href, x: (left - west) * unitsPerMetre,
      y: (north - top) * unitsPerMetre, width: (right - left) * unitsPerMetre,
      height: (top - bottom) * unitsPerMetre, preserveAspectRatio: 'none'})
  }
  // Draw the global imagery first. Missing regional tiles leave that layer visible.
  const zooms = new Set(levels.map(level => Math.min(level, nativeZoom)))
  const images = []
  for (const zoom of zooms) {
    const range = grid.getTileRangeForExtentAndZ(georeference.projectedExtent, zoom)
    for (let x = range.minX; x <= range.maxX; x++) {
      for (let y = range.minY; y <= range.maxY; y++) {
        const extent = grid.getTileCoordExtent([zoom, x, y])
        images.push(imageTile(extent, url.replace('{z}', zoom).replace('{x}', x).replace('{y}', y)))
      }
    }
  }
  let failed = 0
  let loaded = false
  for (const image of images) {
    if (onAvailable) image.addEventListener('load', () => {
      if (!loaded) onAvailable()
      loaded = true
    }, {once: true})
    if (onUnavailable) image.addEventListener('error', () => {
      if (++failed === images.length) onUnavailable()
    }, {once: true})
  }
  tiles.append(...images)
  const {coverage} = luxembourgAerial
  if (mode !== 'aerial' || !coverage.intersectsExtent(georeference.projectedExtent)) return {group}

  const regionalId = `${clipId}-orthophoto`
  const regionalClip = svgElement(svg, 'clipPath', {id: regionalId})
  const ring = coverage.getCoordinates()[0].map(([x, y]) => [(x - west) * unitsPerMetre, (north - y) * unitsPerMetre])
  regionalClip.append(svgElement(svg, 'polygon', {points: ring.map(point => point.join(',')).join(' ')}))
  const regionalTiles = svgElement(svg, 'g', {'data-regional-tiles': '', 'clip-path': `url(#${regionalId})`})
  tiles.append(regionalClip, regionalTiles)
  const regionalGrid = luxembourgAerial.grid
  let previousRange
  let visibleTiles = new Map()
  const notify = () => onRegionalAvailability?.([...visibleTiles.values()].some(node => node.dataset.loaded === 'true'))

  function updateViewport(units, box = svg.viewBox.baseVal) {
    if (!(box.width > 0 && box.height > 0)) return
    const viewExtent = [west + box.x / unitsPerMetre, north - (box.y + box.height) / unitsPerMetre,
      west + (box.x + box.width) / unitsPerMetre, north - box.y / unitsPerMetre]
    const visibleExtent = getIntersection(georeference.projectedExtent, viewExtent)
    const zoom = regionalGrid.getZForResolution(units / unitsPerMetre)
    const tileRange = !isEmpty(visibleExtent) && coverage.intersectsExtent(visibleExtent)
      ? regionalGrid.getTileRangeForExtentAndZ(visibleExtent, zoom) : null
    const rangeKey = tileRange && [zoom, tileRange.minX, tileRange.minY, tileRange.maxX, tileRange.maxY].join('/')
    if (rangeKey === previousRange) return
    previousRange = rangeKey
    const nextTiles = new Map()
    if (tileRange) {
      for (let x = tileRange.minX; x <= tileRange.maxX; x++) {
        for (let y = tileRange.minY; y <= tileRange.maxY; y++) {
          const coordinate = [zoom, x, y]
          const key = coordinate.join('/')
          const extent = regionalGrid.getTileCoordExtent(coordinate)
          if (!coverage.intersectsExtent(extent)) continue
          let node = visibleTiles.get(key)
          if (!node) {
            node = imageTile(extent, luxembourgAerial.tileUrl(coordinate))
            node.addEventListener('load', () => {
              node.dataset.loaded = 'true'
              if (visibleTiles.get(key) === node) notify()
            }, {once: true})
            regionalTiles.append(node)
          }
          nextTiles.set(key, node)
        }
      }
    }
    for (const [key, node] of visibleTiles) if (!nextTiles.has(key)) node.remove()
    visibleTiles = nextTiles
    notify()
  }

  return {group, updateViewport}
}
