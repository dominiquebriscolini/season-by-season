import {baguaNetwork, readGardens} from './gardens.js'
import {area, derive, intersect, metresPerPixel, pixelPoint, reconcile, shape, widthMetres} from './model.js'
import {setupViewport} from './viewport.js'
import {containsPoint, inspectRegion, isBuilding, isShell, netInventory, vegetationMask} from './inventory.js'
import {renderWorldTiles, worldImage} from '../../src/world-geography.js'
import {createWorldBasemapControl, worldBasemaps} from '../../src/world-basemaps.js'
import {luxembourgAerial} from '../../src/luxembourg-aerial.js'
import {isKrautgaartPreview, krautgaartKey} from '../../src/krautgaart-fixture.js'

const get = id => document.getElementById(id)
const garden = get('garden')
const map = get('map')
const photoLayer = map.querySelector('image')
const attribution = document.querySelector('.map-frame .attribution')
const photoCredit = {text: attribution.textContent, href: attribution.getAttribute('href')}
const credits = document.createElement('div')
credits.className = 'map-credits'
const regionalAttribution = document.createElement('a')
regionalAttribution.textContent = luxembourgAerial.credit
regionalAttribution.href = luxembourgAerial.creditUrl
regionalAttribution.hidden = true
attribution.before(credits)
credits.append(regionalAttribution, attribution)
const photoLabel = map.getAttribute('aria-label')
const status = message => { get('status').textContent = message }
const basemapNotice = document.createElement('p')
basemapNotice.className = 'world-basemap-notice'
basemapNotice.setAttribute('role', 'status')
basemapNotice.hidden = true
credits.before(basemapNotice)
const basemapControl = createWorldBasemapControl(basemap => {
  if (garden.value !== 'world' || worldSection.basemap === basemap) return
  worldSection.basemap = basemap
  showWorldBasemap()
  if (!get('draft-tools').hidden || hasEditorDraft()) map.focus({preventScroll: true})
})
basemapControl.element.hidden = true
document.querySelector('.toolbar').append(basemapControl.element)
const integrated = Boolean(get('integrated-navigation'))
const gardens = integrated ? (await import('../../src/integrated-gardens.js')).gardens : await readGardens(async path => {
  const response = await fetch('/' + path.replace(/^public\//, ''))
  if (!response.ok) throw new Error(`Testdaten fehlen: ${path}`)
  return response.json()
})
const kinds = {unknown: 'Ungeklärt', bed: 'Beet', growing: 'Anbaufläche', free: 'Freifläche', other: 'Sonstige Fläche',
  tree: 'Baum', hedge: 'Hecke', woody: 'Sonstiges Gehölz', building: 'Gebäude', shed: 'Schuppen',
  greenhouse: 'Gewächshaus', tunnel: 'Begehbarer Folientunnel'}
const objectKinds = ['unknown', 'tree', 'hedge', 'woody', 'building', 'shed', 'greenhouse', 'tunnel']
const groundKinds = ['unknown', 'bed', 'growing', 'free', 'other']
let image, boundary, axes, outlines, regions, result, retired, net
let counter, mode, draft, selected, moving, loadVersion = 0
let activeGarden
let worldSection, worldTiles, updateWorldViewport
let phase = 'draw'
let repeatAxis = false
let defaultWidth = 0.8
let selection = null
let directions, extensionEdit
let mask, suggestion, selectedPoint
let beforeReset = () => true
let onReset = () => {}
let onEditorChange = () => {}
const nextId = prefix => `${prefix}-${++counter}`
const nextRegion = () => nextId('Fläche')
const newAxis = points => ({id: nextId('Weg'), points, width: null, widths: points.slice(1).map(() => null)})
const viewport = setupViewport(map, () => {
  paint()
  updateWorldViewport?.(viewport.units())
})

function svg(name, attributes) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', name)
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value)
  return element
}

function drawGeometry(layer, geometry, stroke, fill) {
  const d = geometry.flatMap(polygon => polygon.map(ring => `M${ring.join(' L')} Z`)).join(' ')
  layer.append(svg('path', {d, stroke, fill, 'fill-rule': 'evenodd', 'stroke-width': 1.4}))
}

function paint() {
  const layer = get('overlays')
  layer.replaceChildren()
  for (const region of regions) {
    const active = region.id === selected
    const fill = region.kind === 'unknown' ? '#55b9891c' : '#36e5be69'
    drawGeometry(layer, region.geometry, active ? '#f7fff8' : '#c4efdb', active ? '#36e5bec2' : fill)
  }
  if (result) drawGeometry(layer, result.paths, '#ffdf95', '#f4a13d88')
  if (boundary.length) drawGeometry(layer, shape(boundary), '#ffffff', 'none')
  for (const outline of outlines.filter(item => !item.hidden)) {
    const colour = isBuilding(outline.kind) ? '#d2a9a0' : isShell(outline.kind) ? '#98dfff' : '#e2defd'
    drawGeometry(layer, shape(outline.points), colour,
      isBuilding(outline.kind) ? '#6f4641' : colour + (outline.id === selected ? '88' : '44'))
  }
  const selectedOutline = outlines.find(item => item.id === selected && !item.hidden)
  if (selectedOutline) drawGeometry(layer, shape(selectedOutline.points), '#ffffff', 'none')
  for (const axis of axes) layer.append(svg('polyline', {points: axis.points.join(' '),
    stroke: selection?.axis === axis ? '#fff' : '#ffe98e', fill: 'none', 'stroke-width': selection?.axis === axis ? 2 : 1.2}))
  for (const line of result?.lines ?? []) {
    for (const extension of line.extensions) layer.append(svg('polyline', {
      points: extension.points.join(' '), stroke: '#9af6ff', fill: 'none',
      'stroke-width': 2, 'stroke-dasharray': '5 3',
    }))
  }
  if (selection) layer.append(svg('polyline', {points: selection.axis.points.slice(selection.index, selection.index + 2).join(' '),
    stroke: '#fff', fill: 'none', 'stroke-width': 3, 'stroke-dasharray': '5 3'}))
  if (draft.length) layer.append(svg('polyline', {points: draft.join(' '), stroke: '#ffdc68', fill: 'none', 'stroke-width': 2}))
  const handles = ['move', 'insert', 'delete'].includes(mode) ? editable().flatMap(item => item.points)
    : mode === 'outline-move' && moving ? [moving] : draft
  for (const point of handles) layer.append(svg('circle', {cx: point[0], cy: point[1], r: 4 * viewport.units(), fill: moving === point ? '#e6a030' : '#fff', stroke: '#264638'}))
  onEditorChange()
}

function field(parent, label, input) {
  const element = document.createElement('label')
  element.append(label + ' ', input)
  parent.append(element)
}

function card(parent, title) {
  const element = document.createElement('fieldset')
  const legend = document.createElement('legend')
  legend.textContent = title
  element.append(legend)
  parent.append(element)
  return element
}

function button(parent, text, action) {
  const element = document.createElement('button')
  element.textContent = text
  element.onclick = action
  parent.append(element)
  return element
}

const centimetres = value => (value * 100).toFixed(1).replace(/\.0$/, '')
const squareMetres = geometry => `${(area(geometry) * gridScale().reduce((a, b) => a * b)).toFixed(2)} m²`

function widthInput(value, inherited, update) {
  const input = document.createElement('input')
  Object.assign(input, {type: 'number', min: 1, max: 1000, step: 0.1, value: value == null ? '' : centimetres(value)})
  input.placeholder = centimetres(inherited)
  input.onchange = () => {
    if (!input.checkValidity()) {
      input.reportValidity()
      input.value = value == null ? '' : centimetres(value)
      return
    }
    const next = input.value === '' ? null : input.valueAsNumber / 100
    update(next)
    if (!boundary.length || analyse({keepPathFields: true})) value = next
    else {
      update(value)
      input.value = value == null ? '' : centimetres(value)
    }
  }
  input.onkeydown = event => { if (event.key === 'Enter') input.blur() }
  return input
}

function renderPathControls() {
  const paths = get('paths')
  paths.replaceChildren()
  paths.hidden = phase !== 'edit' || !selection
  if (paths.hidden) return
  const {axis, index} = selection
  const panel = card(paths, axis.id)
  field(panel, 'Wegbreite (cm)', widthInput(axis.width, defaultWidth, width => { axis.width = width }))
  const section = document.createElement('select')
  for (let i = 0; i < axis.points.length - 1; i++) section.add(new Option(`Abschnitt ${i + 1}`, i))
  section.value = index
  section.onchange = () => {
    selection.index = Number(section.value)
    renderPathControls()
    paths.querySelector('select').focus()
    paint()
  }
  field(panel, 'Abschnitt', section)
  field(panel, 'Abschnittsbreite (cm)', widthInput(axis.widths[index], axis.width ?? defaultWidth, width => {
    axis.widths[index] = width
  }))
  const note = document.createElement('small')
  note.textContent = 'Leere Felder übernehmen die jeweils übergeordnete Breite.'
  panel.append(note)
  const line = result?.lines.find(line => line.id === axis.id)
  if (line && !line.geometry.length) {
    const warning = document.createElement('small')
    warning.textContent = 'Diese Achse erzeugt keine Wegfläche innerhalb der Grundstücksgrenze.'
    panel.append(warning)
  }
  for (const end of ['start', 'end']) {
    const label = end === 'start' ? 'am Anfang' : 'am Ende'
    const extension = line?.extensions.find(item => item.end === end)
    const blocked = line?.openEnds.includes(end)
    if (blocked) {
      const warning = document.createElement('small')
      warning.textContent = `Offenes Ende ${label}: Diese Richtung ergibt keine gültige Trennlinie.`
      panel.append(warning)
    }
    if (extension || blocked) {
      button(panel, `Verlängerung ${label} korrigieren`, () => {
        if (extensionEdit?.axis === axis && extensionEdit.end === end) return
        if (!canDiscardEditorDraft()) return
        viewport.stopPanning()
        setMode('extension')
        extensionEdit = {axis, end}
        onEditorChange()
        status('Auf der Karte die neue Richtung für die virtuelle Trennlinie angeben.')
      })
    }
    if (directions[axis.id]?.[end]) button(panel, `Verlängerung ${label} zurücksetzen`, () => {
      if (!canDiscardEditorDraft()) return
      const previous = directions[axis.id][end]
      delete directions[axis.id][end]
      if (!analyse()) {
        directions[axis.id][end] = previous
        return
      }
      setMode('select')
      status(instructions.select)
    })
  }
  button(panel, 'Achse entfernen', () => {
    if (!canDiscardEditorDraft()) return
    const previous = {axes, selection}
    axes = axes.filter(item => item !== axis)
    selection = null
    if (!boundary.length || analyse()) {
      delete directions[axis.id]
      if (hasEditorDraft()) setMode('select')
      if (!boundary.length) {
        renderPathControls()
        paint()
      }
    } else {
      ({axes, selection} = previous)
    }
  })
}

function renderControls(keepPathFields = false) {
  if (keepPathFields && selection && !get('paths').hidden) {
    const [axisInput, sectionInput] = get('paths').querySelectorAll('input')
    axisInput.placeholder = centimetres(defaultWidth)
    sectionInput.placeholder = centimetres(selection.axis.width ?? defaultWidth)
  } else {
    renderPathControls()
  }
  get('regions').replaceChildren()
  get('retired').replaceChildren()
  renderShells()
  const item = [...regions, ...outlines].find(item => item.id === selected)
  get('inventory-help').hidden = Boolean(item)
  if (item) {
    const panel = card(get('regions'), item.id)
    const geometry = item.geometry ?? shape(item.points)
    if (item.points) {
      button(panel, 'Umriss entfernen', () => {
        if (!canDiscardEditorDraft()) return
        if (setOutlines(outlines.filter(outline => outline !== item))) {
          selected = null
          setMode('inventory')
          renderControls()
        }
      })
      button(panel, 'Objekt verschieben', () => beginInventory('outline-move'))
      button(panel, 'Umriss korrigieren', () => beginInventory('outline-correct'))
      if (selectedPoint && regions.some(region => containsPoint(region.geometry, selectedPoint))) {
        button(panel, 'Grundfläche darunter auswählen', () => changeInventorySelection(true))
      }
      for (const other of objectsAt(selectedPoint).filter(outline => outline.id !== item.id)) {
        button(panel, `${kinds[other.kind]} ${other.id} auswählen`, () => changeInventorySelection(false, other.id))
      }
    } else if (!mapImage().schematic) {
      button(panel, 'Luftbild prüfen', () => {
        mask ??= vegetationMask(image)
        suggestion = inspectRegion(item, mask)
        renderControls()
        paint()
      }).disabled = !image
    }
    const note = document.createElement('small')
    const overlap = result && item.points && area(intersect(geometry, result.paths)) > 1
    const hint = item.kind === 'free' ? 'Unbepflanzte Grundfläche' : item.hint === 'Nutzung offen'
      ? 'Bestand ungeklärt' : item.hint ?? (item.points ? 'Manueller Umriss' : 'Grundfläche')
    const netGeometry = net?.regions.find(region => region.id === item.id)?.geometry
    const size = netGeometry ? `${squareMetres(geometry)} gesamt · ${squareMetres(netGeometry)} nutzbar` : squareMetres(geometry)
    note.textContent = `${size} · ${hint}${overlap ? ' · Überschneidet einen Weg' : ''}`
    panel.append(note)
    const type = document.createElement('select')
    for (const value of item.points ? objectKinds : groundKinds) type.add(new Option(kinds[value], value))
    type.value = item.kind
    type.onchange = () => {
      if (item.points) {
        const next = {...item, kind: type.value, hidden: isShell(type.value) && Boolean(item.hidden)}
        if (!replaceOutline(next)) type.value = item.kind
        else {
          renderControls()
          get('regions').querySelector('select')?.focus()
        }
      } else {
        item.kind = type.value
        paint()
      }
    }
    field(panel, 'Objekttyp im Bestand', type)
    if (!item.points && suggestion) {
      const question = document.createElement('p')
      question.textContent = `Ungeprüfter Bildhinweis · ${Math.round(suggestion.fraction * 100)} % grüne Bildfläche. Bewuchs und Schatten können die Einschätzung beeinflussen. Bitte Flächentyp prüfen.`
      panel.append(question)
      button(panel, 'Bildhinweis verwerfen', () => { suggestion = null; renderControls(); paint() })
    }
  }
  for (const item of retired) {
    const note = document.createElement('p')
    note.textContent = `${item.id}: Zuordnung prüfen (${kinds[item.kind]})`
    get('retired').append(note)
  }
}

const mapImage = () => garden.value === 'world' ? worldSection.image : gardens[garden.value].fixture.image
const gridScale = () => metresPerPixel(mapImage())

function renderShells() {
  const controls = get('shells')
  controls.replaceChildren()
  const shells = outlines.filter(item => isShell(item.kind))
  for (const [index, item] of shells.entries()) {
    button(controls, `${kinds[item.kind]} ${item.id} ${item.hidden ? 'einblenden' : 'ausblenden'}`, () => {
      if (!canDiscardEditorDraft()) return
      if (replaceOutline({...item, hidden: !item.hidden})) {
        if (!item.hidden && selected === item.id) selected = null
        setMode('inventory')
        renderControls()
        controls.children[index]?.focus()
      }
    })
  }
}

function setOutlines(next) {
  try {
    const usable = netInventory(result.paths, regions, next, shape(boundary))
    outlines = next
    net = usable
    updateStats()
    paint()
    return true
  } catch (error) {
    status(`Bestand konnte nicht aktualisiert werden. ${error.message}`)
    return false
  }
}

function replaceOutline(next) {
  return setOutlines(outlines.map(item => item.id === next.id ? next : item))
}

function updateStats(elapsed) {
  const wayAreas = `${result.paths.length} verbundene Wegfläche${result.paths.length === 1 ? '' : 'n'}`
  const restAreas = `${regions.length} Restfläche${regions.length === 1 ? '' : 'n'}`
  const blocked = result.lines.reduce((count, line) => count + line.openEnds.length, 0)
  get('stats').textContent = `${wayAreas} · ${restAreas}${elapsed == null ? '' : ` · ${elapsed.toFixed(1)} ms`}`
  get('net-ways').textContent = `Wegenetz: ${squareMetres(result.paths)} gesamt · ${squareMetres(net.paths)} nutzbar`
  get('extension-warning').hidden = !blocked
  get('empty-path-warning').hidden = !result.lines.some(line => !line.geometry.length)
}

function objectsAt(point) {
  return point ? outlines.filter(item => !item.hidden && containsPoint(shape(item.points), point)) : []
}

function selectInventory(point, groundOnly = false, objectId) {
  const objects = groundOnly ? [] : objectsAt(point)
  const overlay = objectId ? objects.find(item => item.id === objectId) : objects.at(-1)
  const item = overlay ?? regions.find(item => containsPoint(item.geometry, point))
  selectedPoint = point
  selected = item?.id ?? null
  suggestion = null
  selection = null
  get('land').open = true
  renderControls()
  status(item ? `${item.id} ausgewählt.` : 'Hier liegt keine auswählbare Grundfläche.')
  paint()
}

function beginInventory(value) {
  if (mode === value && hasEditorDraft()) return
  if (!canDiscardEditorDraft()) return
  viewport.stopPanning()
  suggestion = null
  setMode(value)
  status(instructions[value])
}

function changeInventorySelection(groundOnly, objectId) {
  if (!canDiscardEditorDraft()) return
  setMode('inventory')
  selectInventory(selectedPoint, groundOnly, objectId)
}

function analyse({keepPathFields = false, update} = {}) {
  if (boundary.length < 3) {
    status('Zuerst eine Grundstücksgrenze zeichnen.')
    return false
  }
  const start = performance.now()
  const previousCounter = counter
  let matching, usable
  try {
    update ??= derive(image, shape(boundary), axes, {defaultWidth, scale: gridScale(), directions})
    matching = reconcile(regions, update.regions, nextRegion)
    usable = netInventory(update.paths, matching.regions, outlines, shape(boundary))
  } catch (error) {
    counter = previousCounter
    status(`Geometrie konnte nicht berechnet werden. ${error.message}`)
    return false
  }
  result = update
  net = usable
  regions = matching.regions
  if (selected && !regions.some(item => item.id === selected) && !outlines.some(item => item.id === selected)) {
    selected = null
    selectedPoint = null
  }
  suggestion = null
  retired.push(...matching.retired)
  if (matching.retired.length) get('land').open = true
  updateStats(performance.now() - start)
  status(modeMessage())
  renderControls(keepPathFields)
  paint()
  return true
}

function setMode(value) {
  mode = value
  repeatAxis = false
  extensionEdit = null
  draft = []
  moving = null
  for (const button of document.querySelectorAll('[data-mode]')) button.setAttribute('aria-pressed', button.dataset.mode === value)
  get('draft-tools').hidden = !['boundary', 'axis', 'outline', 'outline-correct'].includes(mode)
  paint()
}

function setPhase(value) {
  phase = value
  viewport.stopPanning()
  if (phase === 'draw') selection = null
  get('draw-tools').hidden = phase !== 'draw'
  get('edit-tools').hidden = phase !== 'edit'
  get('phase-help').textContent = phase === 'draw' ? 'Die Standardbreite gilt für alle Abschnitte ohne eigene Breite.'
    : 'Einen Weg auf der Karte auswählen, um seine Breite anzupassen.'
  for (const button of document.querySelectorAll('[data-phase]')) button.setAttribute('aria-pressed', button.dataset.phase === phase)
  setMode(phase === 'edit' ? 'select' : null)
  renderPathControls()
  status(phase === 'edit' ? instructions.select : 'Grundstücksgrenze oder weitere Wegachsen zeichnen.')
}

function editable() {
  return [{points: boundary, ring: true}, ...axes, ...outlines.filter(item => !item.hidden).map(item => ({...item, ring: true}))]
}

function validEdits() {
  return validRing(boundary) && outlines.every(item => canUseOutline(item.points))
    && axes.every(axis => axis.points.every((p, i) => !i || Math.hypot(p[0] - axis.points[i - 1][0], p[1] - axis.points[i - 1][1]) >= 1))
}

function nearestSegment(point, items = editable(), selecting = false) {
  let best = null
  let distance = Infinity
  const tolerance = 10 * viewport.units()
  const groundUnit = Math.min(...gridScale())
  for (const item of items) {
    const count = item.ring ? item.points.length : item.points.length - 1
    for (let i = 0; i < count; i++) {
      const [ax, ay] = item.points[i]
      const [bx, by] = item.points[(i + 1) % item.points.length]
      const dx = bx - ax
      const dy = by - ay
      const t = ((point[0] - ax) * dx + (point[1] - ay) * dy) / (dx * dx + dy * dy)
      const fraction = selecting ? Math.max(0, Math.min(1, t)) : t
      const current = Math.hypot(point[0] - ax - fraction * dx, point[1] - ay - fraction * dy)
      const hitRadius = selecting ? Math.max(tolerance, widthMetres(item, i, defaultWidth) / (2 * groundUnit)) : tolerance
      if ((selecting || (t > 0.03 && t < 0.97)) && current < hitRadius && current < distance) {
        distance = current
        best = {item, index: i, position: [ax + t * dx, ay + t * dy]}
      }
    }
  }
  return best
}

function editVertex(point) {
  const selectedIndex = selection?.index
  let restore
  if (mode === 'insert') {
    const segment = nearestSegment(point)
    if (!segment) return status('Eine Kante oder Wegachse zwischen zwei Stützpunkten anklicken.')
    const {item, index, position} = segment
    item.points.splice(index + 1, 0, position)
    if (!validEdits()) {
      item.points.splice(index + 1, 1)
      return status('Hier lässt sich kein gültiger Stützpunkt einsetzen.')
    }
    const oldWidth = item.widths?.[index]
    if (item.widths) item.widths.splice(index, 1, oldWidth ?? null, oldWidth ?? null)
    restore = () => {
      item.points.splice(index + 1, 1)
      item.widths?.splice(index, 2, oldWidth)
    }
  } else {
    const vertex = nearest(point, editable().flatMap(item => item.points))
    const item = editable().find(candidate => candidate.points.includes(vertex))
    if (!item || item.points.length <= (item.ring ? 3 : 2)) return status('Diesen Punkt kann die Geometrie nicht entbehren.')
    const index = item.points.indexOf(vertex)
    item.points.splice(index, 1)
    if (!validEdits()) {
      item.points.splice(index, 0, vertex)
      return status('Die verbleibende Geometrie wäre ungültig.')
    }
    const {widths} = item
    const oldWidths = widths?.slice()
    if (widths && index === 0) widths.shift()
    else if (widths && index === item.points.length) widths.pop()
    else if (widths) widths.splice(index - 1, 2, widths[index - 1] === widths[index] ? widths[index] ?? null : null)
    restore = () => {
      item.points.splice(index, 0, vertex)
      widths?.splice(0, widths.length, ...oldWidths)
    }
  }
  if (selection) selection.index = Math.min(selection.index, selection.axis.points.length - 2)
  if (!analyse()) {
    restore()
    if (selection) selection.index = selectedIndex
  }
}

function validRing(points) {
  if (points.length < 3 || area(shape(points)) < 1 || new Set(points.map(point => point.join(','))).size !== points.length) return false
  const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
  const boundsOverlap = (a, b, c, d) => [0, 1].every(i =>
    Math.max(Math.min(a[i], b[i]), Math.min(c[i], d[i])) <= Math.min(Math.max(a[i], b[i]), Math.max(c[i], d[i])))
  return points.every((a, i) => {
    const b = points[(i + 1) % points.length]
    return points.every((c, j) => {
      if (j <= i + 1 || (i === 0 && j === points.length - 1)) return true
      const d = points[(j + 1) % points.length]
      return !boundsOverlap(a, b, c, d) || cross(a, b, c) * cross(a, b, d) > 0 || cross(c, d, a) * cross(c, d, b) > 0
    })
  })
}

function canUseOutline(points, ring = boundary) {
  if (!ring.length || !validRing(points)) return false
  return Math.abs(area(shape(points)) - area(intersect(shape(points), shape(ring)))) < 0.01
}

function finish() {
  let emptyPath = false
  if (mode === 'outline-correct') {
    if (!canUseOutline(draft)) return status('Der Umriss braucht ein gültiges Polygon innerhalb der Grundstücksgrenze.')
    const item = outlines.find(item => item.id === selected)
    if (!replaceOutline({...item, points: draft})) return
    selectedPoint = draft[0]
    setMode('inventory')
    renderControls()
    return status('Objektumriss korrigiert.')
  } else if (mode === 'boundary') {
    if (!validRing(draft)) return status('Die Grenze braucht ein gültiges Polygon.')
    if (outlines.some(item => !canUseOutline(item.points, draft))) return status('Die neue Grenze schließt einen manuell erfassten Umriss aus.')
    const previous = boundary
    boundary = draft
    if (!analyse()) {
      boundary = previous
      return
    }
    viewport.fit(boundary)
  } else if (mode === 'axis') {
    if (draft.length < 2) return status('Mindestens zwei Punkte entlang des Wegs setzen.')
    axes.push(newAxis(draft))
    if (boundary.length && !analyse()) {
      axes.pop()
      counter--
      return
    }
    emptyPath = boundary.length && !result.lines.at(-1).geometry.length
  } else if (mode === 'outline') {
    if (!canUseOutline(draft)) return status('Der Umriss braucht ein gültiges Polygon innerhalb der Grundstücksgrenze.')
    const outline = {id: nextId('Objekt'), points: draft, kind: 'unknown', culture: ''}
    if (!setOutlines([...outlines, outline])) return
    selectedPoint = draft[0]
    selected = outline.id
    suggestion = null
    get('land').open = true
  } else {
    return
  }
  const completedAxis = integrated && phase === 'draw' && mode === 'axis'
  setMode(phase === 'edit' ? 'select' : null)
  repeatAxis = completedAxis
  renderControls()
  if (emptyPath) status('Achse erfasst. Sie erzeugt keine Wegfläche innerhalb der Grundstücksgrenze.')
  else if (repeatAxis) status('Wegachse erfasst. Enter startet die nächste Wegachse.')
  else status(modeMessage())
}

function nearest(point, candidates) {
  let best = null
  let distance = 10 * viewport.units()
  for (const item of candidates) {
    const current = Math.hypot(point[0] - item[0], point[1] - item[1])
    if (current < distance) {
      best = item
      distance = current
    }
  }
  return best
}

function snapToAxes(point, candidates) {
  return nearest(point, candidates.flatMap(axis => axis.points))
    ?? nearestSegment(point, candidates)?.position
    ?? point
}

map.onclick = event => {
  const transform = map.getScreenCTM()?.inverse()
  if (!transform) return
  const {x, y} = new DOMPoint(event.clientX, event.clientY).matrixTransform(transform)
  if (activeGarden === 'world') {
    const [width, height] = worldSection.image.size
    if (x < 0 || y < 0 || x > width || y > height) {
      return status('Einen Punkt innerhalb des übernommenen Kartenausschnitts wählen.')
    }
  }
  const point = [x, y]
  if (mode === 'extension' && extensionEdit) {
    const {axis, end} = extensionEdit
    const start = end === 'start' ? axis.points[0] : axis.points.at(-1)
    const next = {...directions, [axis.id]: {...directions[axis.id], [end]: point.map((value, i) => value - start[i])}}
    try {
      const update = derive(image, shape(boundary), axes, {defaultWidth, scale: gridScale(), directions: next})
      if (!update.lines.find(line => line.id === axis.id)?.extensions.some(item => item.end === end)) {
        return status('Diese Richtung ergibt keine gültige Verlängerung. Einen anderen Punkt wählen.')
      }
      if (!analyse({update})) return
      directions = next
      setMode('select')
      renderPathControls()
      status('Virtuelle Trennlinie korrigiert. Wegachse und Wegfläche bleiben gleich.')
    } catch {
      return status('Diese Richtung ergibt keine gültige Verlängerung. Einen anderen Punkt wählen.')
    }
  } else if (mode === 'outline-move') {
    const item = outlines.find(item => item.id === selected)
    if (!moving) {
      if (!containsPoint(shape(item.points), point)) return status('Einen Punkt im Objektumriss anklicken.')
      moving = point
      status('Die neue Position für diesen Punkt anklicken.')
    } else {
      const points = item.points.map(vertex => vertex.map((value, i) => value + point[i] - moving[i]))
      if (!canUseOutline(points)) return status('Das Objekt muss innerhalb der Grundstücksgrenze bleiben.')
      if (!replaceOutline({...item, points})) return
      selectedPoint = point
      setMode('inventory')
      renderControls()
      status('Objekt verschoben.')
    }
  } else if (mode === 'inventory') {
    selectInventory(point)
  } else if (mode === 'select') {
    const segment = nearestSegment(point, axes, true)
    selection = segment ? {axis: segment.item, index: segment.index} : null
    if (selection) {
      selected = null
      selectedPoint = null
      suggestion = null
    }
    renderControls()
    if (selection) status(`${selection.axis.id}, Abschnitt ${selection.index + 1} ausgewählt.`)
  } else if (mode === 'move') {
    if (!moving) {
      moving = nearest(point, editable().flatMap(item => item.points))
      status(moving ? 'Neue Position anklicken.' : 'Einen sichtbaren Stützpunkt anklicken.')
    } else {
      const old = [...moving]
      const onAxis = axes.some(axis => axis.points.includes(moving))
      const linked = onAxis
        ? axes.flatMap(axis => axis.points).filter(item => item[0] === old[0] && item[1] === old[1])
        : [moving]
      const target = onAxis ? snapToAxes(point, axes.filter(axis => !axis.points.some(vertex => linked.includes(vertex)))) : point
      for (const item of linked) item.splice(0, 2, ...target)
      if (!validEdits()) {
        for (const item of linked) item.splice(0, 2, ...old)
        status('Ungültige Änderung. Einen anderen Zielpunkt wählen.')
      } else {
        if (analyse()) moving = null
        else for (const item of linked) item.splice(0, 2, ...old)
      }
    }
  } else if (mode === 'insert' || mode === 'delete') {
    editVertex(point)
  } else if (mode) {
    const snapped = mode === 'axis' ? snapToAxes(point, axes) : point
    if (!draft.length || Math.hypot(snapped[0] - draft.at(-1)[0], snapped[1] - draft.at(-1)[1]) >= 1) draft.push([...snapped])
  }
  paint()
}

function reset(withSample, points) {
  const sample = gardens[garden.value]
  const useSample = withSample && Boolean(sample)
  boundary = useSample ? sample.fixture.suggestedBoundary.slice(0, -1).map(point => pixelPoint(sample.fixture.image, point)) : []
  counter = 0
  axes = useSample ? structuredClone(points ?? sample.axes).map(newAxis) : []
  outlines = []
  directions = {}
  result = null
  net = null
  regions = []
  retired = []
  mask = undefined
  suggestion = null
  selectedPoint = null
  selected = null
  selection = null
  get('stats').textContent = ''
  get('net-ways').textContent = ''
  get('extension-warning').hidden = true
  get('empty-path-warning').hidden = true
  setPhase('draw')
  renderControls()
  viewport.fit(boundary)
  if (useSample) analyse()
  else status('Grundstücksgrenze und Wegachsen einzeichnen.')
}

function showWorldBasemap() {
  const {basemap, georeference} = worldSection
  const {credit, creditUrl} = worldBasemaps[basemap]
  worldTiles?.remove()
  basemapNotice.hidden = true
  regionalAttribution.hidden = true
  let baseUnavailable = false
  const {group, updateViewport} = renderWorldTiles(map, georeference, basemap, {
    onUnavailable() {
      if (worldTiles !== group) return
      baseUnavailable = true
      basemapNotice.textContent = basemap === 'aerial'
        ? 'Das Luftbild konnte nicht geladen werden. Die Straßenkarte bleibt auswählbar.'
        : 'Die Straßenkarte konnte nicht geladen werden.'
      basemapNotice.hidden = !regionalAttribution.hidden
    },
    onRegionalAvailability(available) {
      if (worldTiles !== group) return
      regionalAttribution.hidden = !available
      basemapNotice.hidden = available || !baseUnavailable
    },
  })
  worldTiles = group
  updateWorldViewport = updateViewport
  map.insertBefore(group, get('overlays'))
  updateWorldViewport?.(viewport.units())
  attribution.textContent = credit
  attribution.href = creditUrl
  basemapControl.setMode(basemap)
}

async function load(snapshot) {
  const version = ++loadVersion
  activeGarden = garden.value
  const usingWorldMap = activeGarden === 'world'
  const metadata = mapImage()
  const schematic = Boolean(metadata.schematic)
  get('sample').hidden = usingWorldMap
  get('network').hidden = garden.value !== 'bagua'
  image = null
  worldTiles?.remove()
  worldTiles = undefined
  updateWorldViewport = undefined
  regionalAttribution.hidden = true
  basemapNotice.hidden = true
  basemapControl.element.hidden = !usingWorldMap
  attribution.hidden = schematic
  if (usingWorldMap) {
    photoLayer.removeAttribute('href')
    showWorldBasemap()
    map.setAttribute('aria-label', 'Karte mit Grundstück, Wegachsen und Flächen')
  } else if (schematic) {
    photoLayer.removeAttribute('href')
    map.setAttribute('aria-label', 'Schematische Gartenkarte mit Grundstück, Wegachsen und Flächen')
  } else {
    photoLayer.setAttribute('href', metadata.url)
    map.setAttribute('aria-label', photoLabel)
    attribution.textContent = photoCredit.text
    attribution.href = photoCredit.href
  }
  reset(false)
  if (snapshot) {
    ({boundary, axes, directions, outlines, regions, retired, defaultWidth} = structuredClone(snapshot))
    counter = snapshot.counter
    get('standard').value = centimetres(defaultWidth)
    analyse()
    viewport.fit(boundary)
    get('land').open = true
  }
  if (usingWorldMap || schematic) return
  const photo = new Image()
  photo.src = metadata.url
  try {
    await photo.decode()
    if (loadVersion !== version) return
    const canvas = document.createElement('canvas')
    canvas.width = photo.naturalWidth
    canvas.height = photo.naturalHeight
    const context = canvas.getContext('2d')
    context.drawImage(photo, 0, 0)
    image = context.getImageData(0, 0, canvas.width, canvas.height)
    if (boundary.length) analyse()
  } catch {
    if (loadVersion === version) status('Das lokale Orthofoto konnte nicht geladen werden.')
  }
}

const schematicPreview = integrated && isKrautgaartPreview(location.search)
for (const [key, {fixture}] of Object.entries(gardens)) {
  if (!fixture.image.schematic || schematicPreview) garden.add(new Option(fixture.name, key))
}
if (schematicPreview) garden.value = krautgaartKey
garden.onchange = () => {
  if (integrated ? !beforeReset() : (boundary.length || axes.length || draft.length) &&
      !window.confirm('Beim Wechsel des Testgartens wird der aktuelle Entwurf verworfen. Testgarten wechseln?')) {
    garden.value = activeGarden
    return
  }
  closeExamples()
  onReset()
  load()
}
function closeExamples() { document.querySelector('.examples').open = false }
function startFresh(withSample, points) {
  if (!beforeReset()) return
  closeExamples()
  onReset()
  reset(withSample, points)
  if (integrated && withSample) get('land').open = true
}
get('sample').onclick = () => startFresh(true)
get('network').onclick = () => {
  startFresh(true, baguaNetwork)
}
get('clear').onclick = () => startFresh(false)
get('analyse').onclick = analyse
get('fit').onclick = () => viewport.fit(boundary)
get('finish').onclick = () => {
  finish()
  if (repeatAxis) map.focus({preventScroll: true})
}
get('undo').onclick = () => { draft.pop(); paint() }
get('standard').onchange = event => {
  const input = event.target
  if (!input.checkValidity()) {
    input.reportValidity()
    input.value = centimetres(defaultWidth)
    return
  }
  const previous = defaultWidth
  defaultWidth = input.valueAsNumber / 100
  if (boundary.length && !analyse({keepPathFields: true})) {
    defaultWidth = previous
    input.value = centimetres(previous)
  }
  onEditorChange()
}
get('standard').onkeydown = event => { if (event.key === 'Enter') event.target.blur() }
for (const button of document.querySelectorAll('[data-phase]')) button.onclick = () => {
  if (button.dataset.phase === phase && hasEditorDraft()) return
  if (canDiscardEditorDraft()) setPhase(button.dataset.phase)
}
const instructions = {
  boundary: 'Eckpunkte der Grundstücksgrenze setzen.',
  axis: 'Punkte entlang der Wegmitte setzen.',
  outline: 'Eckpunkte des Objektumrisses setzen. Niedrige temporäre Folienabdeckungen auslassen.',
  inventory: 'Grundfläche oder Objektumriss auf der Karte anklicken.',
  'outline-correct': 'Neue Außenkontur des Bestandsobjekts zeichnen.',
  'outline-move': 'Einen Punkt im Objekt und danach seine neue Position anklicken.',
  select: 'Weg oder Abschnitt auf der Karte anklicken.',
  move: 'Einen Stützpunkt und anschließend seine neue Position anklicken.',
  insert: 'Zwischen zwei Stützpunkten auf eine Kante oder Achse klicken.',
  delete: 'Den zu entfernenden Stützpunkt anklicken.',
}
function modeMessage() {
  return instructions[mode] ?? (phase === 'draw' ? 'Grundstücksgrenze oder weitere Wegachsen zeichnen.' : instructions.select)
}
function activateMode(nextMode) {
  if (nextMode === mode && hasEditorDraft()) return
  if (!canDiscardEditorDraft()) return
  viewport.stopPanning()
  setMode(nextMode)
  status(instructions[mode])
}
for (const button of document.querySelectorAll('[data-mode]')) button.onclick = () => activateMode(button.dataset.mode)
document.addEventListener('keydown', event => {
  if (!(event.target instanceof Element) || map.closest('[hidden]') || event.target.closest('dialog[open]')) return
  if (event.defaultPrevented || event.target.matches('input, select, textarea, [contenteditable="true"]')) return
  if (event.key === 'Enter') {
    if (integrated && (event.repeat || event.target.closest('button, summary, a[href], [contenteditable="true"]'))) return
    if (repeatAxis && (event.target === document.body || map.contains(event.target))) {
      event.preventDefault()
      activateMode('axis')
    } else if (!event.target.matches('button')) finish()
  }
  if (event.key === 'Escape') {
    const inventoryMode = ['outline-correct', 'outline-move'].includes(mode)
    setMode(inventoryMode ? 'inventory' : phase === 'edit' ? 'select' : null)
    status(modeMessage())
  }
})
export function readEditor() {
  const {projection, projectedExtent, size} = mapImage()
  const mapSection = garden.value === 'world' ? {name: worldSection.name} : undefined
  return structuredClone({garden: garden.value, defaultWidth, widthUnit: 'm', counter,
    georeference: {projection, projectedExtent, size}, ...(mapSection && {mapSection}),
    boundary, axes, directions, outlines, regions, retired, result, net})
}

export function hasEditorDraft() {
  return draft.length > 0 || Boolean(moving || extensionEdit)
}

function canDiscardEditorDraft() {
  return !hasEditorDraft() ||
    window.confirm('Die laufende Kartenaktion verwerfen und wechseln?')
}

// Choosing a different map starts a new garden. Only compare editable content here.
export function editorInputSignature(snapshot = {boundary, axes, directions, outlines, defaultWidth, regions, retired, counter}) {
  const {boundary, axes, directions, outlines, defaultWidth, regions, retired, counter} = snapshot
  const classification = ({id, kind}) => [id, kind]
  return JSON.stringify([boundary, axes, directions, outlines, defaultWidth, counter,
    regions.map(classification), retired.map(classification)])
}

export function restoreEditor(snapshot) {
  if (snapshot.garden === 'world') chooseWorldSection(snapshot.georeference, snapshot.mapSection?.name)
  const source = gardens[snapshot.garden]?.fixture
  if (source?.image.schematic && !Array.from(garden.options).some(option => option.value === snapshot.garden)) {
    garden.add(new Option(source.name, snapshot.garden))
  }
  garden.value = snapshot.garden
  return load(snapshot)
}

function chooseWorldSection(georeference, name, basemap = 'street') {
  const image = worldImage(georeference)
  if (!image) throw new Error('Der Weltkartenausschnitt ist ungültig.')
  const title = typeof name === 'string' && name.trim() ? name.trim() : 'Weltkartenausschnitt'
  worldSection = {georeference, name: title, image, basemap: basemap === 'aerial' ? 'aerial' : 'street'}
  const option = garden.querySelector('option[value="world"]')
  if (option) option.text = title
  else garden.add(new Option(title, 'world'))
  garden.value = 'world'
}

export function openWorldSection(georeference, name, basemap) {
  chooseWorldSection(georeference, name, basemap)
  closeExamples()
  defaultWidth = 0.8
  get('standard').value = 80
  return load()
}

export function clearEditor() {
  defaultWidth = 0.8
  get('standard').value = 80
  reset(false)
}

export function configureIntegratedEditor({confirmReset, resetProject, editorChanged}) {
  beforeReset = confirmReset
  onReset = resetProject
  onEditorChange = editorChanged
}

get('download').onclick = () => {
  const output = readEditor()
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([JSON.stringify(output, null, 2)], {type: 'application/json'}))
  link.download = 'wegversuch.json'
  link.click()
  setTimeout(() => URL.revokeObjectURL(link.href), 1000)
}
load()
