import { toLonLat } from 'ol/proj.js'
import { metresPerPixel, shape } from '../experiments/way-guided/model.js'
import { isBuilding, isShell } from '../experiments/way-guided/inventory.js'
import { renderGardenIso } from './garden-iso.js'
import { maxFieldNameLength } from './integrated-storage.js'
import { isoAerialSource, mountIsoAerial } from './iso-aerial.js'
import { fieldGeometrySignature } from './iso-session-draft.js'
import { angleForLayout, closestSubdivisionCount, normalizeAngle, planStripChange, splitField, subdivisionWidthMetres } from './strip-layout.js'
import { mountStripAnglePreview } from './strip-angle-preview.js'
import { calculatePlanting } from './planting-plan.js'
import { attachPlantingDialog } from './planting-dialog.js'
import { builtInCrops, maxCropNameLength, normalizeVariety, readOwnCrops, saveOwnCrop, varietyLibraryKey } from './variety-library.js'
import { createHarvestJournal, formatSeasonDate } from './harvest-journal.js'

export { splitField } from './strip-layout.js'

const groundNames = { bed: 'Beet', growing: 'Anbaufläche', free: 'Freifläche', other: 'Sonstige Fläche', unknown: 'Ungeklärt' }
const objectNames = { building: 'Gebäude', shed: 'Schuppen', tree: 'Baum', hedge: 'Hecke',
  woody: 'Gehölz', greenhouse: 'Gewächshaus', tunnel: 'Folientunnel', unknown: 'Ungeklärter Bestand' }
const plantable = ({ kind }) => kind === 'bed' || kind === 'growing'
const wholeField = field => field.kind === 'bed' ? 'Ganzes Beet' : 'Ganze Anbaufläche'
const formatAngle = angle => String(normalizeAngle(Number(angle.toFixed(8))))

function describeLayout(count, angle) {
  return `${count || 'Offen'} · ${angle === '' || !Number.isFinite(Number(angle)) ? 'Winkel offen' : `${angle}°`}`
}

function element(tag, content) {
  const node = document.createElement(tag)
  if (content) node.textContent = content
  return node
}

function action(label, callback) {
  const button = element('button', label)
  button.type = 'button'
  button.onclick = callback
  return button
}

function label(text, input) {
  const node = element('label', text)
  node.append(' ', input)
  return node
}

function previousCrops(planning, fieldId) {
  return Object.entries(planning.cultures).filter(([id]) => id === fieldId || id.startsWith(`${fieldId}:strip:`))
}

function assignCulture(planning, id, culture) {
  const cultures = {...planning.cultures}
  if (culture) cultures[id] = culture
  else delete cultures[id]
  const next = {...planning, cultures}
  const previous = planning.cultures[id]
  const details = planning.plantings?.[id]
  if (previous && previous !== culture && (details || !culture)) {
    const fieldId = id.split(':strip:')[0]
    if (details) {
      next.plantings = {...planning.plantings}
      delete next.plantings[id]
    }
    next.archived = [...planning.archived, {
      fieldId, split: planning.splits[fieldId] ?? null,
      cultures: {[id]: previous}, ...(details && {plantings: {[id]: details}}),
    }]
  }
  return next
}

function cropLabel(fieldId, cropId, crop) {
  const strip = cropId.slice(fieldId.length + ':strip:'.length)
  return cropId === fieldId ? crop : `Streifen ${strip}: ${crop}`
}

export function mountIntegratedIso(container, {
  snapshot, planning, onChange, onInput, state, getRevision, onCheckRevision, camera, getName,
  seasonYear, viewDate = null, readOnly = false, cameraView, referenceBoundary,
  dockOpen, onDockChange, onOpenTheme,
  aerialEnabled, onAerialChange,
}) {
  const { georeference, boundary, regions, retired, outlines, net } = snapshot
  const { projectedExtent: [west, south, east, north], size: [width, height], projection } = georeference
  const metric = metresPerPixel({...georeference, extent: [...toLonLat([west, south], projection), ...toLonLat([east, north], projection)]})
  const lonLat = ([x, y]) => toLonLat([west + x / width * (east - west), north - y / height * (north - south)], projection)
  const geometryToLonLat = geometry => geometry.map(polygon => polygon.map(ring => ring.map(lonLat)))
  const projectionBoundary = [...boundary, boundary[0]].map(lonLat)
  const aerialSource = isoAerialSource(snapshot, lonLat)
  const controls = element('div')
  controls.className = 'iso-planning-controls'
  const heading = readOnly ? 'Anbaugeschichte' : 'Anbau planen'
  const scene = element('div')
  scene.className = 'iso-planning-scene'
  const fitArea = element('div')
  fitArea.className = 'iso-fit-area'
  fitArea.setAttribute('aria-hidden', 'true')
  const rail = element('div')
  rail.className = 'iso-workbench-tools'
  const viewControls = element('div')
  viewControls.className = 'iso-view-controls'
  const theme = action('◐', () => onOpenTheme(theme))
  theme.className = 'iso-theme'
  theme.setAttribute('aria-label', 'Farbschema')
  theme.setAttribute('aria-haspopup', 'dialog')
  theme.title = 'Farbschema'
  const cameraControls = element('div')
  cameraControls.className = 'iso-workbench-camera'
  const dock = element('aside')
  dock.className = 'iso-detail-dock'
  dock.id = `${container.id}-details`
  const dockHeader = element('div')
  dockHeader.className = 'iso-detail-heading'
  const dockTitle = element('h2', heading)
  dockTitle.id = `${dock.id}-title`
  dockTitle.tabIndex = -1
  dock.setAttribute('aria-labelledby', dockTitle.id)
  const toggleDock = action('Beetdetails', () => changeDock(dock.hidden))
  toggleDock.className = 'iso-details-toggle'
  toggleDock.setAttribute('aria-controls', dock.id)
  const closeDock = action('×', () => changeDock(false))
  closeDock.className = 'iso-details-close'
  closeDock.setAttribute('aria-label', 'Beetdetails schließen')
  closeDock.title = 'Beetdetails schließen'
  viewControls.append(theme, cameraControls)
  rail.append(toggleDock, viewControls)
  dockHeader.append(dockTitle, closeDock)
  dock.append(dockHeader, controls)
  const feedback = element('p')
  feedback.setAttribute('role', 'status')
  let selectedFieldId = state?.fieldId ?? null
  let selectedId = state?.id ?? null
  let pending = false
  let draft = state?.draft ?? null
  let blocked = state?.blocked ?? false
  let readDraft = () => draft
  let refreshCultureOptions
  let dateUpdaters = []
  const fieldName = id => planning.fieldNames?.[id] ?? id
  const fieldLabel = field => `${groundNames[field.kind]} · ${fieldName(field.id)}`
  const getState = () => ({fieldId: selectedFieldId, id: selectedId, draft: readDraft(), blocked,
    ...(blocked && {sourceRevision: state?.sourceRevision, baseSplit: state?.baseSplit, baseGeometry: state?.baseGeometry})})
  if (onInput) controls.addEventListener('input', () => onInput(getState()))
  container.replaceChildren(fitArea, rail, scene, dock)
  let viewportDrawing

  function setAerial(enabled) {
    aerialEnabled = enabled
    viewportDrawing?.setAerial?.(enabled)
  }

  function fitViewport() {
    viewportDrawing?.fitViewport(viewportDrawing.svg.getBoundingClientRect(), fitArea.getBoundingClientRect())
  }

  function setDockOpen(open) {
    dock.hidden = !open
    container.dataset.dockOpen = String(open)
    toggleDock.setAttribute('aria-expanded', String(open))
    fitViewport()
  }

  function changeDock(open) {
    onDockChange(open)
    const focusTarget = open ? dockTitle : toggleDock
    focusTarget.focus({preventScroll: true})
  }

  function dismissDock(event) {
    if (event.key !== 'Escape' || event.defaultPrevented || dock.hidden ||
        (event.target !== toggleDock && !dock.contains(event.target)) || dock.querySelector('dialog[open]')) return
    event.preventDefault()
    changeDock(false)
  }

  const resizeObserver = new ResizeObserver(fitViewport)
  resizeObserver.observe(fitArea)
  resizeObserver.observe(scene)
  container.addEventListener('keydown', dismissDock)
  function refreshLibrary({key}) {
    if (key === varietyLibraryKey || key === null) refreshCultureOptions?.()
  }
  if (!readOnly) window.addEventListener('storage', refreshLibrary)
  setDockOpen(dockOpen)

  function setDate(date) {
    viewDate = date
    for (const updateDay of dateUpdaters) updateDay(date)
  }

  function resolvePart(part) {
    const remaining = {...draft}
    delete remaining[part]
    draft = Object.keys(remaining).length ? remaining : null
    blocked = Boolean(draft)
  }

  async function update(next, message, form, nextId = selectedId, nextFieldId = selectedFieldId) {
    if (pending) return
    pending = true
    feedback.textContent = 'Speichere Änderungen …'
    try {
      if (next) {
        if (await onChange(next) === false) throw new Error('Der Plan konnte nicht gespeichert werden.')
      } else await onCheckRevision()
      if (blocked) resolvePart(form)
      else {
        const outstanding = readDraft()
        if (form === 'fieldName') draft = outstanding
        else draft = form === 'culture' && outstanding?.split ? {split: outstanding.split} : null
      }
      if (next) planning = next
      selectedId = nextId
      selectedFieldId = nextFieldId
      feedback.textContent = message
      render(form === 'fieldName' ? 'fieldName' : undefined)
    } catch (error) {
      feedback.textContent = error.message
    } finally {
      pending = false
    }
  }

  function draftAngle(field, current, split) {
    if (split.angle !== undefined) return split.angle
    if (!field) return ''
    return formatAngle(angleForLayout(field, {count: Number(split.count), direction: split.direction, axis: current?.axis}, metric))
  }

  function confirmUnclearCrops({archivedCount, preservedCount}) {
    if (!archivedCount) return true
    return window.confirm(`Unterteilung ändern? Eindeutig zugeordnet: ${preservedCount}. In die Prüfliste übernommen: ${archivedCount} nicht eindeutig zuordenbare Belegungen.`)
  }

  function matchesPreviousStrip(current, field) {
    const old = state?.baseSplit
    const angleDifference = normalizeAngle(old?.angle - current?.angle) % 180
    const sameDirection = Number.isFinite(old?.angle) && Number.isFinite(current?.angle)
      ? Math.min(angleDifference, 180 - angleDifference) < 1e-8
      : old?.angle === current?.angle && old?.direction === current?.direction &&
        JSON.stringify(old?.axis) === JSON.stringify(current?.axis)
    return Boolean(field && old && current && old.count === current.count && sameDirection &&
      state.baseGeometry === fieldGeometrySignature(field.geometry, field.usable))
  }

  function renderManualAssignment(fields) {
    const targets = fields.filter(plantable).flatMap(field => field.strips
      .filter(strip => strip.geometry.length)
      .map(strip => ({id: strip.id, fieldId: field.id, label: `${fieldLabel(field)} · ${strip.label}`})))
    if (!targets.length) {
      controls.append(element('p', 'Kein nutzbarer aktueller Streifen verfügbar.'))
      return null
    }
    const picker = element('select')
    picker.add(new Option('Zielstreifen auswählen', ''))
    for (const target of targets) picker.add(new Option(target.label, target.id))
    const currentCrop = element('p')
    currentCrop.setAttribute('role', 'status')
    const apply = action('Zuordnung übernehmen', () => {
      const target = targets.find(item => item.id === picker.value)
      if (pending || !target) return
      const previous = planning.cultures[target.id]
      const prompt = previous && previous !== draft.culture
        ? `„${draft.culture}“ in ${target.label} übernehmen und „${previous}“ ersetzen?`
        : `„${draft.culture}“ in ${target.label} übernehmen?`
      if (!window.confirm(prompt)) return
      const next = previous === draft.culture ? null : assignCulture(planning, target.id, draft.culture)
      update(next, next ? 'Kultur zugeordnet.' : 'Kultur bereits gespeichert.', 'culture',
        draft.split ? selectedId : target.id, draft.split ? selectedFieldId : target.fieldId)
    })
    function choose(id) {
      if (pending || (id && !targets.some(target => target.id === id))) return
      picker.value = id
      apply.disabled = !id
      currentCrop.textContent = id ? `Aktuelle Belegung · ${planning.cultures[id] || 'Unbelegt'}` : ''
      for (const item of scene.querySelectorAll('[data-bed-id]')) {
        item.setAttribute('aria-pressed', String(item.dataset.bedId === id))
      }
    }
    picker.onchange = () => choose(picker.value)
    choose('')
    controls.append(element('h3', 'Kultur manuell zuordnen'),
      element('p', 'Wähle einen aktuellen Streifen in der Liste oder in der Skizze.'),
      label('Zielstreifen', picker), currentCrop, apply)
    return choose
  }

  function renderConflict(field, plantableNow, hasStrip, fields) {
    const current = field && planning.splits[field.id]
    const isStrip = selectedId !== selectedFieldId
    const cultureTarget = plantableNow && (isStrip ? hasStrip && matchesPreviousStrip(current, field) : !(current?.count > 1))
    const scope = isStrip ? `${selectedFieldId} · Streifen ${selectedId.split(':strip:').at(-1)}` : selectedFieldId
    controls.append(element('h3', 'ISO-Entwurf vergleichen'),
      element('p', `Der Garten wurde zwischenzeitlich gespeichert. Der Entwurf für ${scope} bleibt zur Prüfung sichtbar.`))
    const table = element('table')
    table.className = 'iso-draft-comparison'
    table.setAttribute('aria-label', 'Vergleich des ISO-Entwurfs')
    const thead = table.createTHead().insertRow()
    for (const title of ['Eingabe', state?.sourceRevision ? `Entwurf · Rev. ${state.sourceRevision}` : 'Älterer Entwurf',
      `Gespeichert · Rev. ${getRevision?.() ?? '–'}`]) {
      const header = element('th', title)
      header.scope = 'col'
      thead.append(header)
    }
    const rows = table.createTBody()
    const comparison = (label, proposed, latest) => {
      const row = rows.insertRow()
      const heading = element('th', label)
      heading.scope = 'row'
      row.append(heading, element('td', proposed), element('td', latest))
    }
    if (draft.split) comparison('Unterteilung', describeLayout(draft.split.count, draftAngle(field, current, draft.split)),
      field ? describeLayout(current?.count ?? 1, formatAngle(angleForLayout(field, current, metric))) : 'Fläche nicht verfügbar')
    if (draft.culture !== undefined) comparison('Kultur', draft.culture || 'Keine Auswahl',
      cultureTarget ? planning.cultures[selectedId] || 'Unbelegt' : 'Ziel nicht eindeutig verfügbar')
    controls.append(table)

    function decision(part, label, unavailable, adopt) {
      const actions = element('div')
      actions.className = 'tools iso-draft-actions'
      const apply = action(`${label} übernehmen`, () => { if (!pending) adopt() })
      apply.disabled = Boolean(unavailable)
      actions.append(apply, action(`${label} verwerfen`, () => {
        if (pending) return
        resolvePart(part)
        render('field')
      }))
      controls.append(actions)
      if (unavailable) controls.append(element('p', unavailable))
    }

    if (draft.split) {
      const count = Number(draft.split.count)
      const rawAngle = draftAngle(field, current, draft.split)
      const angle = Number(rawAngle)
      const valid = Number.isInteger(count) && count >= 1 && count <= 100 &&
        rawAngle !== '' && Number.isFinite(angle) && angle >= 0 && angle <= 360
      decision('split', 'Unterteilung', !plantableNow ? 'Die Grundfläche ist derzeit nicht bepflanzbar.' :
        !valid ? 'Streifenanzahl oder Winkel liegt außerhalb des gültigen Bereichs.' : null, () => {
        if ((current?.count ?? 1) === count && normalizeAngle(angle) === Number(formatAngle(angleForLayout(field, current, metric)))) {
          update(null, 'Unterteilung bereits gespeichert.', 'split')
          return
        }
        const change = planStripChange(planning, field, {count, angle: normalizeAngle(angle)}, metric)
        const confirmed = change.archivedCount ? confirmUnclearCrops(change) :
          window.confirm('Ältere Unterteilung für diese Grundfläche speichern?')
        if (confirmed) update(change.next, 'Unterteilung übernommen.', 'split',
          draft.culture === undefined ? field.id : selectedId)
      })
    }
    if (draft.culture !== undefined) {
      const validCulture = draft.culture.length <= maxCropNameLength && Boolean(normalizeVariety(draft.culture))
      decision('culture', 'Kultur', !cultureTarget ? 'Die Kultur kann dem aktuellen Ziel nicht eindeutig zugeordnet werden.' :
        !validCulture ? 'Der Entwurf enthält keine gültige Kulturwahl.' : null, () => {
        if (planning.cultures[selectedId] === draft.culture) {
          update(null, 'Kultur bereits gespeichert.', 'culture')
          return
        }
        if (!window.confirm(`„${draft.culture}“ für ${scope} speichern?`)) return
        const next = assignCulture(planning, selectedId, draft.culture)
        update(next, 'Kultur übernommen.', 'culture')
      })
      if (!cultureTarget && validCulture) return renderManualAssignment(fields)
    }
    return null
  }

  function select(fieldId, id = fieldId, picker, focusPicker) {
    if (pending || (fieldId === selectedFieldId && id === selectedId) ||
        (readDraft() && !window.confirm('Ungespeicherte Eingaben im Beetplan verwerfen und Auswahl wechseln?'))) {
      if (picker) {
        picker.value = focusPicker === 'strip'
          ? (selectedId === selectedFieldId ? '' : selectedId ?? '') : selectedFieldId ?? ''
        if (picker.selectedIndex < 0) picker.value = ''
      }
      return
    }
    draft = null
    blocked = false
    selectedFieldId = fieldId
    selectedId = id
    render(focusPicker)
  }

  function planFields() {
    return regions.map(field => {
      const usable = net.regions.find(({ id }) => id === field.id)?.geometry ?? []
      const split = planning.splits[field.id]
      const strips = split?.count > 1 && plantable(field) ? splitField(field, usable, split, metric) : []
      return { ...field, usable, strips }
    })
  }

  function render(focusPicker) {
    readDraft = () => draft
    refreshCultureOptions = undefined
    dateUpdaters = []
    controls.removeAttribute('data-pending-subdivision')
    const fields = planFields()
    const field = fields.find(item => item.id === selectedFieldId)
    const plantableNow = field && plantable(field) && field.usable.length
    const hasStrip = field?.strips.some(strip => strip.id === selectedId && strip.geometry.length)
    const targetUnavailable = draft && (blocked || !plantableNow || (selectedId !== selectedFieldId && !hasStrip))
    if (!draft) {
      if (!field) selectedFieldId = selectedId = null
      else if (selectedId !== selectedFieldId && !hasStrip) selectedId = selectedFieldId
    }
    const previewObjects = []
    if (net.paths.length) previewObjects.push({ id: 'Wegenetz', label: 'Weg', kind: 'path', geometry: net.paths })
    for (const field of fields) {
      if (field.strips.length) {
        previewObjects.push(...field.strips.map(strip => ({ ...strip,
          kind: 'bed', fieldId: field.id, label: `${fieldName(field.id)} · ${strip.label}` })))
      } else {
        previewObjects.push({ id: field.id, fieldId: field.id, label: fieldLabel(field),
          kind: plantable(field) ? 'bed' : 'field', selectable: true, geometry: field.usable })
      }
    }
    previewObjects.push(...outlines.filter(item => !item.hidden).map(item => ({
      id: item.id, label: `${objectNames[item.kind]} · ${item.id}`,
      kind: isBuilding(item.kind) ? 'building' : isShell(item.kind) ? 'shell' : 'vegetation',
      geometry: shape(item.points),
    })))
    const visibleCultures = Object.fromEntries(previewObjects
      .filter(object => object.kind === 'bed' && object.geometry.length && planning.cultures[object.id])
      .map(object => [object.id, planning.cultures[object.id]]))
    let pickManualStrip
    if (viewportDrawing) resizeObserver.unobserve(viewportDrawing.svg)
    const drawing = renderGardenIso(scene, {
      camera, cameraView, referenceBoundary,
      boundary: projectionBoundary,
      addUnderlay: aerialSource && (drawing => mountIsoAerial({...drawing, source: aerialSource, onChange: onAerialChange})),
      selectedId: blocked && selectedId !== selectedFieldId && !matchesPreviousStrip(planning.splits[selectedFieldId], field) ? null : selectedId,
      cultureById: visibleCultures,
      objects: previewObjects.map(object => ({ ...object, source: 'survey', geometry: geometryToLonLat(object.geometry) })),
      onSelect: id => {
        if (pickManualStrip) pickManualStrip(id)
        else select(previewObjects.find(object => object.id === id).fieldId, id)
      },
    })
    viewportDrawing = drawing
    if (drawing) resizeObserver.observe(drawing.svg)
    setAerial(aerialEnabled)
    cameraControls.replaceChildren(...(drawing?.toolbar ? [drawing.toolbar] : []))
    fitViewport()

    const fieldPicker = element('select')
    fieldPicker.add(new Option('Grundfläche auswählen', ''))
    for (const item of fields) fieldPicker.add(new Option(fieldLabel(item), item.id))
    fieldPicker.value = field ? selectedFieldId : ''
    fieldPicker.onchange = () => select(fieldPicker.value || null, undefined, fieldPicker, 'field')
    controls.replaceChildren(label('Grundfläche', fieldPicker))
    if (readOnly) {
      if (field) renderHistoricalField(field, focusPicker)
      else controls.append(element('p', 'Wähle eine historische Grundfläche im Plan oder in der Liste.'))
    } else if (blocked && draft) pickManualStrip = renderConflict(field, plantableNow, hasStrip, fields)
    else if (targetUnavailable) {
      controls.append(element('p', `Der Entwurf für ${selectedFieldId} kann auf der aktuellen Geometrie nicht angewendet werden.`))
      if (draft.split) controls.append(element('p', `Streifenanzahl ${describeLayout(draft.split.count, draftAngle(field, field && planning.splits[field.id], draft.split))}`))
      if (draft.culture !== undefined) controls.append(element('p', `Kultur · ${draft.culture || 'keine Auswahl'}`))
      controls.append(action('ISO-Entwurf verwerfen', () => {
        if (!window.confirm('Ungespeicherte Eingaben im Beetplan verwerfen?')) return
        draft = null
        blocked = false
        render('field')
      }))
    } else if (field) renderField(field, focusPicker, drawing)
    else controls.append(element('p', 'Wähle eine Grundfläche im Plan oder in der Liste.'))
    if (seasonYear) {
      dateUpdaters.push(day => {
        for (const item of scene.querySelectorAll('[data-bed-id]')) {
          const start = planning.plantings?.[item.dataset.bedId]?.start
          item.classList.toggle('iso-before-start', Boolean(day && start && day < start))
        }
      })
      renderSeasonDetails(field, plantableNow && (!field.strips.length || hasStrip), targetUnavailable)
      setDate(viewDate)
    }
    renderReview(fields)
    controls.append(feedback)
    if (focusPicker === 'field') fieldPicker.focus({preventScroll: true})
    onInput?.(getState())
  }

  function renderHistoricalField(field, focusPicker) {
    controls.append(element('h3', fieldLabel(field)))
    if (!field.strips.length) return
    renderStripPicker(field, focusPicker)
    if (selectedId === field.id) controls.append(element('p', `${field.strips.length} Streifen`))
  }

  function renderStripPicker(field, focusPicker) {
    const picker = element('select')
    picker.add(new Option(wholeField(field), ''))
    for (const strip of field.strips) {
      const available = Boolean(strip.geometry.length)
      const option = new Option(`${strip.label}${available ? '' : ' · nicht nutzbar'}`, strip.id)
      option.disabled = !available
      picker.add(option)
    }
    picker.value = selectedId === field.id ? '' : selectedId
    picker.onchange = () => select(field.id, picker.value || field.id, picker, 'strip')
    controls.append(label('Streifen', picker))
    if (focusPicker === 'strip') picker.focus({preventScroll: true})
  }

  function renderSeasonDetails(field, validTarget, targetUnavailable) {
    const culture = validTarget && planning.cultures[selectedId]
    let target
    if (culture) {
      const details = planning.plantings?.[selectedId] ?? {}
      const strip = field.strips.find(item => item.id === selectedId)
      const name = strip ? `${fieldName(field.id)} · ${strip.label}` : fieldLabel(field)
      target = {targetId: selectedId, fieldId: field.id, culture, label: name,
        variety: details.variety ?? '', unit: details.yieldUnit,
        context: JSON.stringify([strip?.geometry ?? field.usable, details.start ?? ''])}
      const info = element('section')
      info.className = 'iso-planting-season-info'
      const begin = details.start
      const {harvestStart, harvestEnd} = calculatePlanting(null, null, 0, details)
      let forecast = 'offen'
      if (harvestStart && harvestEnd) forecast = `${formatSeasonDate(harvestStart)}–${formatSeasonDate(harvestEnd)}`
      else if (harvestStart) forecast = `ab ${formatSeasonDate(harvestStart)}`
      else if (harvestEnd) forecast = `bis ${formatSeasonDate(harvestEnd)}`
      const phase = element('p')
      info.append(element('h3', [culture, details.variety].filter(Boolean).join(' · ')),
        element('p', `Anbaubeginn · ${begin ? formatSeasonDate(begin) : 'offen'}`),
        element('p', `Geplantes Erntefenster · ${forecast}`), phase)
      dateUpdaters.push(day => {
        let text = ''
        if (day && begin) {
          if (day < begin) text = 'Vor Anbaubeginn'
          else if (harvestEnd && day > harvestEnd) text = 'Nach dem geplanten Erntefenster'
          else if (harvestStart && day >= harvestStart) text = 'Im geplanten Erntefenster'
          else text = 'Seit Anbaubeginn'
        }
        phase.textContent = text
        phase.hidden = !text
      })
      controls.append(info)
    } else if (readOnly && validTarget) controls.append(element('p', 'Dieser Bereich war unbelegt.'))

    const {journal, renderDay} = createHarvestJournal({
      target, year: seasonYear, currentDate: viewDate, entries: () => planning.harvests ?? [],
      onAdd: readOnly || targetUnavailable ? null : async entry => {
        if (pending) throw new Error('Warte auf die laufende Speicherung.')
        if (readDraft()) throw new Error('Speichere zuerst die geänderte Unterteilung oder Kultur.')
        pending = true
        try {
          const next = {...planning, harvests: [...(planning.harvests ?? []), entry]}
          if (await onChange(next) === false) throw new Error('Die Ernte konnte nicht gespeichert werden.')
          planning = next
        } finally {
          pending = false
        }
      },
    })
    controls.append(journal)
    dateUpdaters.push(renderDay)
  }

  function renderField(field, focusPicker, drawing) {
    controls.append(element('h3', fieldLabel(field)))
    if (!plantable(field)) {
      controls.append(element('p', 'Diese Fläche ist derzeit nicht bepflanzbar.'))
      controls.append(element('p', 'Als Beet oder Anbaufläche einstufen. Wähle dazu dieselbe Grundfläche auf der Karte aus.'))
      return
    }
    const selectedStrip = field.strips.find(strip => strip.id === selectedId && strip.geometry.length)
    if (field.strips.length) renderStripPicker(field, focusPicker)
    const structure = element('details')
    structure.className = 'iso-field-structure'
    structure.open = !selectedStrip || Boolean(draft?.split) || focusPicker === 'fieldName'
    structure.append(element('summary', 'Name und Unterteilung'))
    controls.append(structure)
    renderFieldName(field, focusPicker, structure)
    if (!field.usable.length) {
      controls.append(element('p', 'Diese Fläche ist derzeit nicht bepflanzbar.'))
      return
    }

    const current = planning.splits[field.id]
    const count = element('input')
    count.type = 'number'
    count.min = 1
    count.max = 100
    const initialCount = String(current?.count ?? 1)
    const initialAngle = formatAngle(angleForLayout(field, current, metric))
    count.value = draft?.split?.count ?? initialCount
    count.required = true
    const angle = element('input')
    Object.assign(angle, {type: 'number', min: '0', max: '360', step: 'any', required: true, readOnly: true, inputMode: 'decimal'})
    angle.value = draft?.split ? draftAngle(field, current, draft.split) : initialAngle
    const validAngle = () => Number.isFinite(angle.valueAsNumber) && angle.valueAsNumber >= 0 && angle.valueAsNumber <= 360
    const layoutChanged = () => count.value !== initialCount || !validAngle() ||
      normalizeAngle(angle.valueAsNumber) !== Number(initialAngle)
    const readLayout = () => count.validity.valid && validAngle()
      ? {count: count.valueAsNumber, angle: normalizeAngle(angle.valueAsNumber), preview: layoutChanged()}
      : null
    const initialCulture = planning.cultures[selectedId] ?? ''
    let culture
    readDraft = () => {
      const splitChanged = layoutChanged()
      const cultureChanged = culture && culture.value !== initialCulture
      if (!splitChanged && !cultureChanged) return null
      return {
        ...(splitChanged && {split: {count: count.value, angle: angle.value}}),
        ...(cultureChanged && {culture: culture.value}),
      }
    }
    const hint = element('p', 'Winkel vom Norden im Uhrzeigersinn. Shift rastet beim Ziehen in 15°-Schritten ein.')
    hint.hidden = true
    const savedLayoutHint = element('p', 'Diese Belegung gilt für den zuletzt gespeicherten Streifen.')
    const pendingHint = element('p', 'Übernimm die Unterteilung und wähle anschließend einen Streifen für die Kultur.')
    pendingHint.setAttribute('role', 'status')
    const width = element('output')
    width.setAttribute('aria-label', 'Breite je Unterteilung')
    width.title = 'Breite quer zur Streifenrichtung an der Grundfläche'
    const formatWidth = new Intl.NumberFormat('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})
    const divisionRow = element('div')
    divisionRow.className = 'iso-subdivision-row iso-subdivision-count'
    const widthLabel = element('span', 'Breite je Unterteilung')
    widthLabel.append(width)
    divisionRow.append(label('Unterteilungen', count), widthLabel)
    const desiredWidth = element('input')
    Object.assign(desiredWidth, {type: 'number', step: 'any', inputMode: 'decimal'})
    const widthRow = element('div')
    widthRow.className = 'iso-subdivision-row'
    widthRow.append(label('Wunschbreite (m)', desiredWidth))
    function applyDesiredWidth() {
      const value = desiredWidth.valueAsNumber
      desiredWidth.setCustomValidity(desiredWidth.value && !(value > 0) ? 'Gib eine Breite größer als 0 m ein.' : '')
      if (!desiredWidth.validity.valid || !Number.isFinite(value) || !validAngle()) return
      const span = subdivisionWidthMetres(field, {count: 1, angle: normalizeAngle(angle.valueAsNumber)}, metric)
      count.value = closestSubdivisionCount(span, value, Number(count.max))
    }
    const angleRow = element('div')
    angleRow.className = 'iso-subdivision-row'
    const toggleAngle = action('Winkel ändern', () => {
      const active = angle.readOnly
      if (!active && !angle.reportValidity()) return
      angle.readOnly = !active
      hint.hidden = !active
      toggleAngle.textContent = active ? 'Winkel fertig' : 'Winkel ändern'
      toggleAngle.setAttribute('aria-pressed', String(active))
      if (active) angle.focus()
      refresh()
    })
    toggleAngle.setAttribute('aria-pressed', 'false')
    angleRow.append(label('Winkel (°)', angle), toggleAngle)
    structure.append(divisionRow, widthRow, angleRow, hint,
      action('Unterteilung übernehmen', () => {
        if (pending || !desiredWidth.reportValidity() || !count.reportValidity()) return
        const layout = readLayout()
        if (!layout) {
          if (angle.readOnly) toggleAngle.click()
          angle.reportValidity()
          return
        }
        if (!layoutChanged()) {
          angle.value = initialAngle
          return
        }
        if (readDraft()?.culture !== undefined &&
            !window.confirm('Die ungespeicherte Kultur verwerfen und die Unterteilung übernehmen?')) return
        const change = planStripChange(planning, field, {count: layout.count, angle: layout.angle}, metric)
        if (confirmUnclearCrops(change)) {
          update(change.next, change.archivedCount ? 'Unterteilung gespeichert. Frühere Belegungen stehen in der Prüfliste.' : 'Unterteilung gespeichert.', 'split', field.id)
        }
      }))
    const preview = drawing && mountStripAnglePreview({
        svg: drawing.svg,
        world: drawing.world,
        projectPoint: point => drawing.projectRing([lonLat(point)])[0],
        field, metric, readLayout, isAngleActive: () => !angle.readOnly,
        onAngle(value) {
          if (pending) return
          angle.value = formatAngle(value)
          angle.dispatchEvent(new Event('input', {bubbles: true}))
        },
      })
    function refresh() {
      const layout = readLayout()
      const measured = layout && subdivisionWidthMetres(field, layout.preview ? layout : current ?? layout, metric)
      width.value = layout ? `${formatWidth.format(measured)} m` : '–'
      preview?.refresh()
      const paused = !field.strips.length && count.valueAsNumber > 1
      controls.toggleAttribute('data-pending-subdivision', paused)
      pendingHint.hidden = !paused
      savedLayoutHint.hidden = !selectedStrip || !layoutChanged()
    }
    count.oninput = () => {
      desiredWidth.value = ''
      desiredWidth.setCustomValidity('')
      refresh()
    }
    angle.oninput = desiredWidth.oninput = () => {
      applyDesiredWidth()
      refresh()
    }
    refresh()

    if (field.strips.length && !selectedStrip) {
      controls.append(element('p', `${field.strips.length} Streifen gespeichert. Wähle einen Streifen im Plan oder in der Liste.`))
      return
    }
    controls.append(pendingHint)
    const planting = element('section')
    planting.className = 'iso-planting-target'
    planting.append(element('h4', `Anbau · ${selectedStrip?.label ?? wholeField(field)}`))
    controls.append(planting)

    culture = element('select')
    const libraryStatus = element('p')
    libraryStatus.setAttribute('role', 'status')
    const savedCrops = Object.values(planning.cultures)

    function fillCultureOptions(selection = culture.value) {
      const names = new Map()
      let personal = []
      try {
        personal = readOwnCrops()
      } catch (error) {
        libraryStatus.textContent = error.message
      }
      for (const name of [...personal, ...builtInCrops, ...savedCrops]) {
        const key = normalizeVariety(name)
        if (key && !names.has(key)) names.set(key, name)
      }
      // Imported gardens and open drafts retain the exact name they were saved with.
      for (const name of [initialCulture, selection]) {
        if (name) names.set(normalizeVariety(name), name)
      }
      const sorted = [...names.values()].sort((a, b) => a.localeCompare(b, 'de'))
      culture.replaceChildren(new Option('Kultur wählen', ''), ...sorted.map(name => new Option(name, name)))
      culture.value = selection
    }

    fillCultureOptions(draft?.culture ?? initialCulture)
    refreshCultureOptions = fillCultureOptions
    culture.oninput = () => { feedback.textContent = '' }
    const addCrop = element('details')
    addCrop.className = 'iso-own-crop'
    addCrop.append(element('summary', 'Eigene Kultur hinzufügen'))
    const form = element('form')
    const cropInput = Object.assign(element('input'), {type: 'text', required: true, maxLength: maxCropNameLength})
    const saveCrop = Object.assign(element('button', 'Kultur speichern'), {type: 'submit'})
    form.append(label('Kulturname', cropInput), saveCrop)
    const addStatus = element('p')
    addStatus.setAttribute('role', 'status')
    addCrop.append(form, addStatus)
    addCrop.ontoggle = () => { if (addCrop.open) cropInput.focus() }
    form.onsubmit = event => {
      event.preventDefault()
      if (pending) return
      try {
        const typedKey = normalizeVariety(cropInput.value)
        const gardenName = savedCrops.find(candidate => candidate.length <= maxCropNameLength &&
          normalizeVariety(candidate) === typedKey)
        const {name, created} = saveOwnCrop(gardenName ?? cropInput.value)
        const selection = normalizeVariety(initialCulture) === normalizeVariety(name) ? initialCulture : name
        fillCultureOptions(selection)
        culture.dispatchEvent(new Event('input', {bubbles: true}))
        cropInput.value = ''
        addStatus.textContent = ''
        libraryStatus.textContent = created ? `„${name}“ zur Bibliothek hinzugefügt und ausgewählt.` :
          `„${selection}“ ist bereits in der Bibliothek und wurde ausgewählt.`
        addCrop.open = false
        culture.focus()
      } catch (error) {
        addStatus.textContent = error.message
        cropInput.focus()
      }
    }
    const cultureChoice = label('Kultur', culture)
    cultureChoice.className = 'iso-culture-choice'
    planting.append(savedLayoutHint, cultureChoice, addCrop, libraryStatus, action('Belegung speichern', () => {
      if (!culture.value) {
        feedback.textContent = 'Wähle zuerst eine Kultur.'
        return
      }
      const next = assignCulture(planning, selectedId, culture.value)
      update(next, `Gespeichert · ${culture.value}`, 'culture')
    }))
    const crop = planning.cultures[selectedId]
    if (crop) {
      const id = selectedId
      attachPlantingDialog(planting, {
        title: selectedStrip ? `${fieldName(field.id)} · ${selectedStrip.label}` : fieldLabel(field), crop,
        details: planning.plantings?.[id], geometry: selectedStrip?.geometry ?? field.usable,
        metric, angle: angleForLayout(field, current, metric),
        onLibraryChange: fillCultureOptions,
        canOpen() {
          if (pending) return false
          if (culture.value === crop) return true
          feedback.textContent = 'Speichere zuerst die geänderte Kultur.'
          return false
        },
        async onSave(details) {
          if (pending) throw new Error('Warte auf die laufende Speicherung.')
          pending = true
          try {
            const next = {...planning, plantings: {...planning.plantings, [id]: details}}
            if (await onChange(next) === false) throw new Error('Die Anbaudaten konnten nicht gespeichert werden.')
            draft = readDraft()
            planning = next
            feedback.textContent = 'Anbaudaten gespeichert.'
          } finally {
            pending = false
          }
        },
        onSaved: render,
      })
      planting.append(action('Belegung entfernen', () => {
        if (pending || !window.confirm(`Gespeicherte Belegung „${crop}“ entfernen? Die bisherigen Anbaudaten bleiben in der Prüfliste.`)) return
        update(assignCulture(planning, id, ''), 'Belegung entfernt. Frühere Angaben stehen in der Prüfliste.', 'culture')
      }))
    } else planting.append(element('p', 'Wähle eine Kultur und speichere die Belegung, um die Anbaudaten zu öffnen.'))
  }

  function renderFieldName(field, focusPicker, parent) {
    const form = element('form')
    form.className = 'iso-field-name-form'
    const input = Object.assign(element('input'), {type: 'text', maxLength: maxFieldNameLength,
      value: planning.fieldNames?.[field.id] ?? '', placeholder: field.id})
    form.append(label('Name der Fläche', input), element('button', 'Flächenname speichern'))
    form.onsubmit = event => {
      event.preventDefault()
      const name = input.value.trim()
      const current = planning.fieldNames?.[field.id] ?? ''
      const nextName = name === field.id ? '' : name
      if (nextName.length > maxFieldNameLength || current === nextName) return
      const next = {...planning}
      const fieldNames = {...planning.fieldNames}
      if (nextName) fieldNames[field.id] = nextName
      else delete fieldNames[field.id]
      if (Object.keys(fieldNames).length) next.fieldNames = fieldNames
      else delete next.fieldNames
      update(next, 'Flächenname gespeichert.', 'fieldName')
    }
    parent.append(form)
    if (focusPicker === 'fieldName') input.focus({preventScroll: true})
  }

  function exportPlan() {
    const rows = []
    const unplanted = []
    for (const field of planFields()) {
      const targets = field.strips.length ? field.strips : [{id: field.id, geometry: field.usable}]
      for (const {id, geometry} of targets) {
        if (!geometry.length) continue
        const culture = plantable(field) && planning.cultures[id]
        if (!culture) {
          unplanted.push(geometry)
          continue
        }
        const angle = angleForLayout(field, planning.splits[field.id], metric)
        const details = planning.plantings?.[id]
        rows.push({id, geometry, culture, details, result: calculatePlanting(geometry, metric, angle, details)})
      }
    }
    return {name: getName?.() ?? 'Garten', boundary, paths: net.paths, unplanted, rows}
  }

  function renderReview(fields) {
    const knownFields = new Set([...fields, ...retired].map(({ id }) => id))
    const unassignedFields = new Set(Object.keys(planning.cultures)
      .map(id => id.split(':strip:')[0]).filter(id => !knownFields.has(id)))
    const entries = [
      ...retired.map(({ id }) => ({ fieldId: id, cultures: Object.fromEntries(previousCrops(planning, id)) })),
      ...Array.from(unassignedFields, id => ({ fieldId: id, cultures: Object.fromEntries(previousCrops(planning, id)) })),
      ...planning.archived,
      ...fields.map(field => {
        const available = new Set(plantable(field) && field.usable.length
          ? field.strips.length ? field.strips.filter(strip => strip.geometry.length).map(strip => strip.id) : [field.id]
          : [])
        return { fieldId: field.id, cultures: Object.fromEntries(
          previousCrops(planning, field.id).filter(([id]) => !available.has(id))) }
      }),
    ].filter(entry => Object.keys(entry.cultures).length)
    if (!entries.length) return
    const section = element('section')
    section.append(element('h3', 'Frühere Belegungen prüfen'))
    const list = element('ul')
    for (const entry of entries) {
      const {fieldId, cultures: crops} = entry
      const names = Object.entries(crops).map(([id, crop]) => cropLabel(fieldId, id, crop))
      const item = element('li', `${fieldId} · ${names.join(', ')}`)
      const detailsById = entry.plantings ?? (planning.archived.includes(entry) ? undefined : planning.plantings)
      for (const id of Object.keys(crops)) {
        const details = detailsById?.[id]
        if (!details) continue
        const notes = [details.variety, details.method === 'sow' ? 'Direktsaat' : 'Auspflanzen', details.start,
          details.rowSpacingCm != null && `Reihe ${details.rowSpacingCm} cm`,
          details.plantSpacingCm != null && `Pflanze ${details.plantSpacingCm} cm`,
          details.daysMin != null && `${details.daysMin}–${details.daysMax ?? '?'} Tage`,
          details.germinationPct != null && `Keimrate ${details.germinationPct} %`,
          details.yieldEach != null && `${details.yieldEach} ${details.yieldUnit === 'kg' ? 'kg' : 'Stück'} je Pflanze`]
        item.append(element('p', `${id} · ${notes.filter(Boolean).join(' · ')}`))
      }
      list.append(item)
    }
    section.append(list)
    controls.append(section)
  }

  render()
  return Object.assign(getState, {setDate, projectionBoundary, setDockOpen, setAerial, exportPlan, dispose() {
    resizeObserver.disconnect()
    container.removeEventListener('keydown', dismissDock)
    window.removeEventListener('storage', refreshLibrary)
  }})
}
