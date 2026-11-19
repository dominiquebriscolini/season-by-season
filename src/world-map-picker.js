import 'ol/ol.css'
import OlMap from 'ol/Map.js'
import View from 'ol/View.js'
import {defaults as controls} from 'ol/control/defaults.js'
import {getCenter, getIntersection, getWidth, intersects} from 'ol/extent.js'
import {defaults as interactions} from 'ol/interaction/defaults.js'
import TileLayer from 'ol/layer/Tile.js'
import {fromLonLat} from 'ol/proj.js'
import {getRenderPixel} from 'ol/render.js'
import OSM from 'ol/source/OSM.js'
import XYZ from 'ol/source/XYZ.js'
import {luxembourgAerial} from './luxembourg-aerial.js'
import {createWorldBasemapControl, worldBasemaps} from './world-basemaps.js'
import {validWorldGeoreference, worldSection} from './world-geography.js'
import './world-map-picker.css'

const searchEndpoint = 'https://photon.komoot.io/api/'
const searches = new Map()

function element(tag, text) {
  const node = document.createElement(tag)
  if (text) node.textContent = text
  return node
}

function action(text, type = 'button') {
  const button = element('button', text)
  button.type = type
  return button
}

function place(feature) {
  const {coordinates, type} = feature?.geometry ?? {}
  const details = feature?.properties
  if (type !== 'Point' || !Array.isArray(coordinates) || coordinates.length < 2 ||
    !coordinates.slice(0, 2).every(Number.isFinite) ||
    Math.abs(coordinates[0]) > 180 || Math.abs(coordinates[1]) > 85.05112878 || !details) return null
  const trimmed = value => typeof value === 'string' ? value.trim() : ''
  const address = [details.street, details.housenumber].map(trimmed).filter(Boolean).join(' ')
  const name = trimmed(details.name) || address || trimmed(details.city)
  if (!name) return null
  const label = [...new Set([name, address, details.district, details.city, details.county, details.state, details.country]
    .map(trimmed).filter(Boolean))].join(', ')
  return {coordinates: coordinates.slice(0, 2), label, name}
}

async function searchPlaces(query, signal) {
  const key = query.toLocaleLowerCase('de')
  if (searches.has(key)) return searches.get(key)
  const url = new URL(searchEndpoint)
  url.search = new URLSearchParams({q: query, limit: '6', lang: 'de'})
  const response = await fetch(url, {signal})
  if (!response.ok) throw new Error('Ortssuche derzeit nicht erreichbar.')
  const data = await response.json()
  if (!Array.isArray(data?.features)) throw new Error('Ungültige Antwort der Ortssuche.')
  const results = data.features.map(place).filter(Boolean)
  if (searches.size >= 24) searches.delete(searches.keys().next().value)
  searches.set(key, results)
  return results
}

export function mountWorldMapPicker(button, {getInitialSection, onUse}) {
  const dialog = element('dialog')
  dialog.className = 'world-map-picker'
  dialog.setAttribute('aria-label', 'Weltkarte')
  const heading = element('h2', 'Weltkarte')
  const form = element('form')
  const input = element('input')
  input.type = 'search'
  input.required = true
  input.maxLength = 150
  input.autocomplete = 'off'
  input.autofocus = true
  const label = element('label', 'Ort oder Adresse')
  label.append(input)
  const search = action('Suchen', 'submit')
  form.append(label, search)
  const results = element('ul')
  results.className = 'world-map-picker__results'
  results.setAttribute('aria-label', 'Suchergebnisse')
  const searchStatus = element('p')
  searchStatus.setAttribute('role', 'status')
  const frame = element('div')
  frame.className = 'world-map-picker__frame'
  const target = element('div')
  target.className = 'world-map-picker__canvas'
  target.tabIndex = 0
  target.setAttribute('role', 'region')
  target.setAttribute('aria-label', 'Navigierbare Weltkarte')
  const selection = element('div')
  selection.className = 'world-map-picker__selection'
  selection.setAttribute('aria-hidden', 'true')
  frame.append(target, selection)
  const tileStatus = element('p')
  tileStatus.className = 'world-map-picker__tile-status'
  tileStatus.setAttribute('role', 'status')
  frame.append(tileStatus)
  const controlsRow = element('div')
  controlsRow.className = 'world-map-picker__actions'
  const selectionStatus = element('p')
  const use = action('Ausschnitt übernehmen')
  const cancel = action('Abbrechen')
  controlsRow.append(selectionStatus, use, cancel)

  const view = new View({center: fromLonLat([12, 20]), zoom: 2, minZoom: 2, maxZoom: 22, enableRotation: false})
  const streetLayer = new TileLayer({source: new OSM()})
  const imagery = worldBasemaps.aerial
  const aerialLayers = imagery.levels.map((maxZoom, index) => {
    const previousMaxZoom = imagery.levels[index - 1]
    const minZoom = (previousMaxZoom ?? -1) + 1
    const source = new XYZ({
      attributions: `<a href="${imagery.creditUrl}" target="_blank" rel="noopener">${imagery.credit}</a>`,
      crossOrigin: 'anonymous',
      url: imagery.url,
      tileSize: imagery.tileSize,
      minZoom,
      maxZoom,
    })
    // Add each detail layer at the resolution where OpenLayers would first choose its tiles.
    const maxResolution = index === 0 ? undefined : source.getTileGrid().getResolution(minZoom) * 1.5
    return new TileLayer({source, maxResolution, visible: false})
  })
  const {coverage, grid, tileUrl, credit, creditUrl} = luxembourgAerial
  const loadedDetailExtents = new Map()
  const detailSource = new XYZ({
    attributions: ({extent}) => {
      for (const loaded of loadedDetailExtents.values()) {
        if (intersects(loaded, extent) && coverage.intersectsExtent(getIntersection(loaded, extent))) {
          return `<a href="${creditUrl}" target="_blank" rel="noopener">${credit}</a>`
        }
      }
      return []
    },
    crossOrigin: 'anonymous',
    wrapX: false,
    tileGrid: grid,
    tileUrlFunction: coordinate => coverage.intersectsExtent(grid.getTileCoordExtent(coordinate))
      ? tileUrl(coordinate)
      : undefined,
  })
  detailSource.on('tileloadend', ({tile}) => {
    const coordinate = tile.getTileCoord()
    loadedDetailExtents.set(coordinate.join('/'), grid.getTileCoordExtent(coordinate))
    if (loadedDetailExtents.size > 256) loadedDetailExtents.delete(loadedDetailExtents.keys().next().value)
  })
  const detailLayer = new TileLayer({
    className: 'ol-layer world-map-picker__luxembourg-aerial',
    source: detailSource,
    extent: coverage.getExtent(),
    maxResolution: grid.getResolution(grid.getMinZoom()) * 1.5,
    visible: false,
  })
  const [originX, originY] = coverage.getFirstCoordinate()
  const detailPath = new Path2D()
  for (const [first, ...edges] of coverage.getCoordinates()) {
    detailPath.moveTo(first[0] - originX, first[1] - originY)
    for (const [x, y] of edges) detailPath.lineTo(x - originX, y - originY)
    detailPath.closePath()
  }
  // The WMTS has opaque white pixels outside the flight area in border tiles.
  detailLayer.on('prerender', event => {
    const pixel = coordinate => getRenderPixel(event, map.getPixelFromCoordinate(coordinate))
    const [x, y] = pixel([originX, originY])
    const [eastX, eastY] = pixel([originX + 1, originY])
    const [northX, northY] = pixel([originX, originY + 1])
    const path = new Path2D()
    path.addPath(detailPath, new DOMMatrix([eastX - x, eastY - y, northX - x, northY - y, x, y]))
    event.context.save()
    event.context.clip(path, 'evenodd')
  })
  detailLayer.on('postrender', event => event.context.restore())
  aerialLayers.push(detailLayer)
  let basemap = 'street'
  const basemapControl = createWorldBasemapControl(mode => {
    basemap = mode
    streetLayer.setVisible(mode === 'street')
    for (const layer of aerialLayers) layer.setVisible(mode === 'aerial')
    tileStatus.textContent = ''
  })
  dialog.append(heading, form, searchStatus, results, basemapControl.element, frame, controlsRow)
  button.after(dialog)
  button.setAttribute('aria-haspopup', 'dialog')

  const map = new OlMap({
    view, layers: [streetLayer, ...aerialLayers],
    controls: controls({attributionOptions: {collapsible: false}, rotate: false,
      zoomOptions: {zoomInTipLabel: 'Vergrößern', zoomOutTipLabel: 'Verkleinern'}}),
    interactions: interactions({altShiftDragRotate: false, pinchRotate: false}),
  })
  let activeSearch
  let using = false
  let pickedName = ''
  let georeference = null
  let initializedSection = false

  function updateSelection() {
    const size = map.getSize()
    const resolution = view.getResolution()
    const side = size ? Math.min(...size, 624) : 0
    georeference = side > 0 && resolution ? worldSection(view.getCenter(), resolution * side / 624) : null
    selection.style.width = selection.style.height = `${side}px`
    selection.hidden = !georeference
    use.disabled = !georeference || using
    selectionStatus.textContent = georeference
      ? 'Der Rahmen markiert den Ausschnitt.'
      : 'Zoome auf das Grundstück, bis ein Ausschnitt gewählt werden kann.'
  }

  map.on('change:size', updateSelection)
  view.on('change:center', updateSelection)
  view.on('change:resolution', updateSelection)
  streetLayer.getSource().on('tileloaderror', () => {
    if (dialog.open && basemap === 'street') {
      tileStatus.textContent = 'Einige Kartenkacheln konnten nicht geladen werden.'
    }
  })
  aerialLayers[0].getSource().on('tileloaderror', () => {
    if (dialog.open && basemap === 'aerial') {
      tileStatus.textContent = 'Einige Luftbildkacheln konnten nicht geladen werden. Die Straßenkarte bleibt verfügbar.'
    }
  })

  function open() {
    dialog.showModal()
    map.setTarget(target)
    map.updateSize()
    const initial = initializedSection ? null : getInitialSection?.()
    const size = map.getSize()
    const side = size ? Math.min(...size, 624) : 0
    if (initial && side > 0 && validWorldGeoreference(initial.georeference)) {
      const {projectedExtent} = initial.georeference
      view.setCenter(getCenter(projectedExtent))
      view.setResolution(getWidth(projectedExtent) / side)
      input.value = pickedName = initial.name
      results.replaceChildren()
      initializedSection = true
    }
    updateSelection()
  }
  button.addEventListener('click', open)
  cancel.addEventListener('click', () => dialog.close())
  dialog.addEventListener('cancel', event => { if (using) event.preventDefault() })
  dialog.addEventListener('close', () => {
    activeSearch?.abort()
    activeSearch = undefined
    search.disabled = false
    searchStatus.textContent = ''
    tileStatus.textContent = ''
    map.setTarget(undefined)
  })

  form.addEventListener('submit', async event => {
    event.preventDefault()
    const query = input.value.trim().replace(/\s+/g, ' ')
    if (!query || activeSearch || using) return
    const controller = new AbortController()
    activeSearch = controller
    search.disabled = true
    results.replaceChildren()
    searchStatus.textContent = 'Ortssuche läuft …'
    try {
      const places = await searchPlaces(query, AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]))
      if (controller.signal.aborted) return
      searchStatus.textContent = places.length ? '' : 'Keine Orte gefunden.'
      for (const {coordinates, label, name} of places) {
        const row = element('li')
        const choose = action(label)
        choose.addEventListener('click', () => {
          pickedName = name
          for (const result of results.querySelectorAll('button')) {
            result.setAttribute('aria-pressed', String(result === choose))
          }
          view.setCenter(fromLonLat(coordinates))
          view.setZoom(19)
        })
        choose.setAttribute('aria-pressed', 'false')
        row.append(choose)
        results.append(row)
      }
    } catch {
      if (!controller.signal.aborted) {
        searchStatus.textContent = 'Die Ortssuche ist derzeit nicht erreichbar. Die Karte bleibt verfügbar.'
      }
    } finally {
      if (activeSearch === controller) {
        activeSearch = undefined
        search.disabled = false
      }
    }
  })

  use.addEventListener('click', async () => {
    if (!georeference || using) return
    using = true
    const captured = georeference
    updateSelection()
    cancel.disabled = true
    search.disabled = true
    try {
      if (await onUse({georeference: captured, name: pickedName, basemap}) !== false) dialog.close()
    } catch (error) {
      searchStatus.textContent = error instanceof Error ? error.message : 'Der Ausschnitt konnte nicht übernommen werden.'
    } finally {
      using = false
      cancel.disabled = false
      search.disabled = Boolean(activeSearch)
      updateSelection()
    }
  })
  return open
}
