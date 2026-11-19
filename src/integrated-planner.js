import editorPage from '../experiments/way-guided/index.html?raw'
import '../experiments/way-guided/experiment.css'
import './integrated-planner.css'
import './workbench.css'
import './iso-workbench.css'
import './map-workbench.css'
import {renderGardenIso} from './garden-iso.js'
import {mountIntegratedIso} from './integrated-iso.js'
import {downloadPlantingPlan, printPlantingPlan} from './planting-export.js'
import {mountMapWorkbench} from './map-workbench.js'
import {mountWorkbenchTheme} from './workbench-theme.js'
import {createIsoCamera} from './iso-camera.js'
import {readIsoDraft, savedFieldGeometry, writeIsoDraft} from './iso-session-draft.js'
import {mountSeasonToolbar} from './season-toolbar.js'
import {isKrautgaartPreview, krautgaartKey} from './krautgaart-fixture.js'
import {assignSeasonYear, createSeasonProject, importProject, listProjects, readLegacyBackup, readProject,
  readProjectBackup, restoreProject, saveProject} from './integrated-storage.js'

const app = document.getElementById('app')
if (import.meta.env.MODE === 'teststand') document.title += ' · Teststand'
app.innerHTML = editorPage.slice(editorPage.indexOf('<header>'), editorPage.indexOf('<script'))
const get = id => document.getElementById(id)
const editorPageElement = app.querySelector('main')
const header = app.querySelector('header')
const mapSources = header.querySelector('nav')
header.querySelector('h1').textContent = 'Gartenplanung'
mapSources.ariaLabel = 'Kartenausschnitt und Vorlagen'
const mapLabel = document.createElement('span')
mapLabel.textContent = 'Kartenausschnitt'
mapSources.querySelector('label').firstChild.replaceWith(mapLabel)
const worldMapButton = document.createElement('button')
worldMapButton.type = 'button'
worldMapButton.textContent = 'Weltkarte'
worldMapButton.setAttribute('aria-haspopup', 'dialog')
mapSources.prepend(worldMapButton)
header.insertAdjacentHTML('afterend', `
  <nav id="integrated-navigation" aria-label="Garten und Ansichten">
    <div id="garden-actions">
      <button id="project-library" aria-haspopup="dialog" aria-controls="project-page" aria-label="Gespeicherte Gärten" title="Gespeicherte Gärten"><span class="iso-nav-icon" aria-hidden="true">▤</span><span class="iso-nav-caption">Gespeicherte Gärten</span></button>
      <div id="plan-export-actions" role="group" aria-label="Planausgabe" hidden>
        <button id="print-planting-plan" type="button" aria-label="Anbauplan drucken" title="Anbauplan drucken"><span class="iso-nav-icon" aria-hidden="true">⎙</span><span class="iso-nav-caption">Anbauplan drucken</span></button>
        <button id="download-planting-plan" type="button" aria-label="Excel herunterladen" title="Excel herunterladen"><span class="iso-nav-icon" aria-hidden="true">⇩</span><span class="iso-nav-caption">Excel herunterladen</span></button>
      </div>
    </div>
    <div id="iso-project-menu" hidden></div>
    <button id="map-tab" aria-pressed="true">Karte</button>
    <button id="iso-tab" aria-pressed="false">Beetplan</button>
    <label class="iso-project-name"><span>Gartenname</span> <input id="project-name" maxlength="100" placeholder="Gartenname"></label>
    <button id="save-project" aria-label="Garten speichern" title="Garten speichern"><span class="iso-nav-icon" aria-hidden="true">▣</span><span class="iso-nav-caption">Garten speichern</span></button>
    <button id="close-project" aria-label="Garten schließen" title="Garten schließen"><span class="iso-nav-icon" aria-hidden="true">×</span><span class="iso-nav-caption">Garten schließen</span></button>
    <button id="workbench-theme" type="button" aria-label="Farbschema" aria-haspopup="dialog" title="Farbschema"><span class="iso-nav-icon" aria-hidden="true">◐</span><span class="iso-nav-caption">Farbschema</span></button>
    <div id="project-notices">
      <span id="example-project-status" hidden>Schematisches Beispiel</span>
      <span id="save-state" role="status"></span>
      <span id="project-status" role="status"></span>
      <span id="draft-storage-status" role="status"></span>
    </div>
  </nav>
`)
editorPageElement.id = 'map-page'
editorPageElement.insertAdjacentHTML('afterend', `
  <main id="iso-page" hidden>
    <div id="iso-content" class="iso-stage"></div>
    <div id="iso-history" class="iso-stage" hidden></div>
    <div class="iso-workbench-footer">
      <div id="iso-season"></div>
      <div id="iso-notices"></div>
    </div>
  </main>
  <dialog id="project-page" aria-labelledby="library-title">
    <div class="library-heading">
      <h2 id="library-title">Gespeicherte Gärten</h2>
      <button id="return-project" autofocus>Zurück zum Garten</button>
    </div>
    <div class="tools">
      <button id="new-project">Neuen Garten zeichnen</button>
      <label>Sicherung öffnen <input id="import-project" type="file" accept=".json,application/json"></label>
    </div>
    <div id="project-list"></div>
    <div id="legacy-list"></div>
    <p id="library-status" role="status"></p>
  </dialog>
`)
const projectDialog = get('project-page')
get('download').hidden = true
get('land').open = true
mountMapWorkbench(editorPageElement, mapSources, () => hasEditorDraft())
app.dataset.layout = 'map'
const openTheme = mountWorkbenchTheme(app, get('workbench-theme'))
get('map-notices').append(get('project-notices'))

const {clearEditor, configureIntegratedEditor, editorInputSignature, hasEditorDraft, openWorldSection, readEditor, restoreEditor} =
  await import('../experiments/way-guided/ui.js')
mapSources.append(editorPageElement.querySelector('.world-basemap-control'))
let id = crypto.randomUUID()
let saved = null
let savedInputs = null
let planning = emptyPlanning()
let page = 'map'
let working = false
let showLegacy = false
let readIsoState = () => null
let isoAerialEnabled = false
let isoCamera = cameraFor(id)
let seasonToolbar
let displayedHistory
let readHistoryState
let mountedHistoryId
let dockOpen = true
let saveStateFrame = 0
const emptyInputs = editorInputSignature()
const draftBlocked = 'Schließe die aktive Zeichnung oder Punktbearbeitung zuerst ab.'

function emptyPlanning() {
  return {cultures: {}, splits: {}, archived: []}
}

function say(message) {
  get('project-status').textContent = message
  if (projectDialog.open) get('library-status').textContent = message
}

function cameraFor(projectId) {
  const key = `season-by-season.iso-camera.v1.${projectId}`
  let state
  try {
    state = JSON.parse(localStorage.getItem(key))
  } catch {
    // A missing or unreadable preference falls back to the default framing.
  }
  return createIsoCamera({state, onChange(preference) {
    try {
      localStorage.setItem(key, JSON.stringify(preference))
    } catch {
      say('Die Kameraansicht konnte nicht dauerhaft gespeichert werden.')
    }
  }})
}

function isoUnderlayKey(projectId) {
  return `season-by-season.iso-underlay.v1.${projectId}`
}

function readIsoUnderlay(projectId) {
  try {
    return localStorage.getItem(isoUnderlayKey(projectId)) === 'aerial'
  } catch {
    return false
  }
}

function checkpointIsoDraft(state) {
  const notice = get('draft-storage-status')
  try {
    writeIsoDraft(saved, state)
    notice.textContent = ''
  } catch {
    notice.textContent = 'Der ISO-Entwurf kann beim Neuladen verloren gehen.'
  }
  scheduleSaveState()
}

function setPage(next) {
  page = next
  if (!showLegacy) app.dataset.layout = page
  else delete app.dataset.layout
  get('iso-project-menu').hidden = page !== 'iso' || showLegacy
  get('plan-export-actions').hidden = page !== 'iso' || showLegacy
  get('workbench-theme').hidden = page !== 'map' || showLegacy
  const notices = showLegacy ? 'integrated-navigation' : `${page}-notices`
  get(notices).append(get('project-notices'))
  get('example-project-status').hidden = showLegacy || saved?.snapshot.garden !== krautgaartKey
  if (page !== 'iso') seasonToolbar?.stop()
  get('map-page').hidden = page !== 'map'
  get('iso-page').hidden = page !== 'iso'
  get('map-tab').ariaPressed = String(page === 'map')
  get('iso-tab').ariaPressed = String(page === 'iso')
  updateEditAvailability()
  get('iso-tab').disabled = showLegacy
  scheduleSaveState()
}

function updateEditAvailability() {
  const readOnly = showLegacy || (page === 'iso' && Boolean(displayedHistory))
  get('project-name').disabled = readOnly
  get('save-project').disabled = readOnly
}

function name() {
  return get('project-name').value.trim() || 'Mein Garten'
}

function hasUnsavedChanges(includeIsoInput = true) {
  if (showLegacy) return false
  if (includeIsoInput && readIsoState()?.draft) return true
  const inputs = editorInputSignature()
  return hasEditorDraft() || (saved ? savedInputs !== inputs || saved.name !== name() :
    emptyInputs !== inputs || Boolean(get('project-name').value.trim()))
}

function scheduleSaveState() {
  if (saveStateFrame) return
  saveStateFrame = requestAnimationFrame(() => {
    saveStateFrame = 0
    const state = get('save-state')
    const dirty = hasUnsavedChanges()
    const value = showLegacy ? '' : dirty ? 'Ungespeicherte Änderungen' :
      saved ? 'Gespeicherter Stand' : ''
    if (state.textContent !== value) state.textContent = value
    state.classList.toggle('is-dirty', dirty)
    const notice = get('project-status').textContent
    if ((dirty && ['Garten gespeichert.', 'Keine Änderungen zu speichern.'].includes(notice)) ||
        (notice === draftBlocked && !hasEditorDraft())) say('')
  })
}

function canLeave() {
  return !working && (!hasUnsavedChanges() || confirm('Ungespeicherte Änderungen verwerfen?'))
}

function resetProject() {
  isoAerialEnabled = false
  clearSeasonView()
  readIsoState.dispose?.()
  dockOpen = true
  id = crypto.randomUUID()
  saved = null
  savedInputs = null
  planning = emptyPlanning()
  readIsoState = () => null
  isoCamera.suspend?.()
  isoCamera = cameraFor(id)
  checkpointIsoDraft(null)
  showLegacy = false
  get('project-name').value = ''
  say('')
  setPage('map')
}

configureIntegratedEditor({confirmReset: canLeave, resetProject, editorChanged: scheduleSaveState})
get('project-name').addEventListener('input', scheduleSaveState)
worldMapButton.addEventListener('click', loadWorldMapPicker)

async function loadWorldMapPicker() {
  const triggerHadFocus = document.activeElement === worldMapButton
  worldMapButton.disabled = true
  try {
    const {mountWorldMapPicker} = await import('./world-map-picker.js')
    const open = mountWorldMapPicker(worldMapButton, {
      async onUse({georeference, name, basemap}) {
        if (!canLeave()) return false
        working = true
        try {
          resetProject()
          await openWorldSection(georeference, name.slice(0, 150), basemap)
          say('Ausschnitt übernommen. Zeichne die Grundstücksgrenze.')
        } finally {
          working = false
        }
      },
    })
    worldMapButton.removeEventListener('click', loadWorldMapPicker)
    worldMapButton.disabled = false
    if (triggerHadFocus && document.activeElement === document.body) worldMapButton.focus({preventScroll: true})
    open()
  } catch {
    say('Die Weltkarte konnte nicht geladen werden. Versuche es erneut.')
  } finally {
    worldMapButton.disabled = false
  }
}

async function run(operation) {
  if (working) return
  working = true
  try {
    await operation()
  } catch (error) {
    say(error.message)
  } finally {
    working = false
  }
}

async function persist(nextPlanning, view, explicit = false) {
  if (page === 'iso' && displayedHistory) throw new Error('Die Vorjahresansicht ist schreibgeschützt.')
  if (hasEditorDraft()) throw new Error(draftBlocked)
  if (explicit && page === 'iso' && readIsoState()?.draft) {
    throw new Error('Übernimm die Unterteilung oder speichere die Belegung zuerst im Beetplan.')
  }
  if (saved && !hasUnsavedChanges(false) && JSON.stringify(nextPlanning) === JSON.stringify(planning)) {
    if (explicit) say('Keine Änderungen zu speichern.')
    return
  }
  const snapshot = readEditor()
  if (!snapshot.result || snapshot.boundary.length < 3) throw new Error('Zeichne zuerst eine Grundstücksgrenze.')
  say('Speichere Garten …')
  const season = saved?.season
  saved = await saveProject({id, name: name(), snapshot, planning: nextPlanning, view, ...(season && {season})},
    saved?.revision ?? null)
  savedInputs = editorInputSignature(saved.snapshot)
  planning = nextPlanning
  if (view === 'map') checkpointIsoDraft(readIsoState())
  say('Garten gespeichert.')
  scheduleSaveState()
}

function showIso() {
  const viewState = seasonToolbar?.getView()
  clearSeasonView()
  const state = readIsoState()
  readIsoState.dispose?.()
  readIsoState = mountIntegratedIso(get('iso-content'), {
    snapshot: readEditor(),
    planning,
    state,
    camera: isoCamera,
    onOpenTheme: openTheme,
    aerialEnabled: isoAerialEnabled, onAerialChange: setIsoAerial,
    dockOpen, onDockChange: setDockOpen,
    seasonYear: saved?.season?.year,
    getRevision: () => saved?.revision,
    getName: () => saved?.name,
    async onCheckRevision() {
      if (working) throw new Error('Warte, bis der laufende Speichervorgang beendet ist.')
      working = true
      try {
        const current = await readProject(saved.id)
        if (current?.revision !== saved.revision) {
          throw new Error('Ein anderer Tab hat diesen Garten geändert. Lade neu, um die aktuelle Revision zu vergleichen.')
        }
      } finally {
        working = false
      }
    },
    onInput: checkpointIsoDraft,
    async onChange(nextPlanning) {
      if (working) throw new Error('Warte, bis der laufende Speichervorgang beendet ist.')
      working = true
      try {
        await persist(nextPlanning, 'iso')
      } catch (error) {
        say(error.message)
        throw error
      } finally {
        working = false
      }
    },
  })
  setPage('iso')
  if (saved) seasonToolbar = mountSeasonToolbar(get('iso-season'), {
    project: saved, listProjects, onView: displaySeasonDate, projectMenuHost: get('iso-project-menu'),
    viewState,
    onAssignYear: year => seasonAction(async () => {
      if (hasUnsavedChanges()) throw new Error('Speichere zunächst die Änderungen im Garten und Beetplan.')
      saved = await assignSeasonYear(saved.id, saved.revision, year)
      planning = saved.planning
      showIso()
      get('iso-season').querySelector('input[type="date"]')?.focus({preventScroll: true})
      say(`Hauptjahr ${year} gespeichert.`)
    }),
    onCreate: options => seasonAction(async () => {
      const {project, copied, skipped} = await createSeasonProject(saved.id, saved.revision, options)
      await open(project)
      say(options.copyLayout ? `Saisonprojekt angelegt. Aufteilungen kopiert: ${copied}. Ausgelassen: ${skipped}.` : 'Leeres Saisonprojekt angelegt.')
    }, true),
    onOpen: projectId => seasonAction(async () => open(await readProject(projectId)), true),
  })
}

async function seasonAction(operation, leavesProject = false) {
  if (working || (leavesProject && !canLeave())) return false
  working = true
  try {
    return await operation()
  } finally {
    working = false
  }
}

function clearSeasonView() {
  seasonToolbar?.destroy()
  seasonToolbar = undefined
  displayedHistory = undefined
  mountedHistoryId = undefined
  readHistoryState?.dispose()
  readHistoryState = undefined
  isoCamera.unmount('history')
  get('iso-history').hidden = true
  get('iso-history').replaceChildren()
  get('iso-content').hidden = false
}

function setDockOpen(open) {
  dockOpen = open
  readIsoState.setDockOpen(open)
  readHistoryState?.setDockOpen(open)
}

function setIsoAerial(enabled) {
  isoAerialEnabled = enabled
  readIsoState.setAerial(enabled)
  readHistoryState?.setAerial(enabled)
  try {
    localStorage.setItem(isoUnderlayKey(id), enabled ? 'aerial' : 'drawing')
  } catch {
    say('Der ISO-Untergrund konnte nicht dauerhaft gespeichert werden.')
  }
}

function displaySeasonDate({date, history}) {
  const historyStage = get('iso-history')
  get('iso-content').hidden = Boolean(history)
  historyStage.hidden = !history
  if (history) {
    if (mountedHistoryId !== history.id) {
      const selection = (readHistoryState ?? readIsoState)()
      readHistoryState?.dispose()
      readHistoryState = mountIntegratedIso(historyStage, {
        snapshot: history.snapshot, planning: history.planning, camera: isoCamera,
        cameraView: 'history', referenceBoundary: readIsoState.projectionBoundary,
        onOpenTheme: openTheme,
        aerialEnabled: isoAerialEnabled, onAerialChange: setIsoAerial,
        state: selection && {fieldId: selection.fieldId, id: selection.id},
        dockOpen, onDockChange: setDockOpen,
        getName: () => history.name, seasonYear: history.year, viewDate: date, readOnly: true,
      })
      mountedHistoryId = history.id
    }
    readHistoryState.setDate(date)
  } else {
    readIsoState.setDate(date)
  }
  displayedHistory = history
  updateEditAvailability()
}

for (const stage of document.querySelectorAll('.iso-stage')) {
  stage.addEventListener('focusin', () => seasonToolbar?.stop())
}

function download(data, filename) {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'}))
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(link.href), 1000)
}

function action(label, fn) {
  const button = document.createElement('button')
  button.textContent = label
  button.onclick = fn
  return button
}

function legacyGarden(raw) {
  for (const value of Object.values(raw)) {
    try {
      const data = JSON.parse(value)
      if (data?.version === 1 && Array.isArray(data.boundary) && Array.isArray(data.objects) && data.cultures) return data
    } catch {
      // The other checkpoint may still be readable.
    }
  }
  return null
}

function openLegacy(record) {
  const content = get('iso-content')
  const heading = document.createElement('h2')
  heading.textContent = `${record.fixtureName} · Altbestand (v1)`
  const note = document.createElement('p')
  note.textContent = 'Schreibgeschützte Ansicht mit den früher gespeicherten Konturen und Kulturen.'
  const scene = document.createElement('div')
  const details = document.createElement('p')
  renderGardenIso(scene, {
    boundary: record.boundary, objects: record.objects, cultureById: record.cultures,
    onSelect(item) {
      const object = typeof item === 'string' ? record.objects.find(object => object.id === item) : item
      details.textContent = `${object.label} · ${record.cultures[object.id] ?? 'Unbepflanzt'}`
    },
  })
  resetProject()
  clearEditor()
  content.replaceChildren(heading, note, scene, details)
  showLegacy = true
  setPage('iso')
  projectDialog.close()
}

async function open(record, resumed = null) {
  if (!record) throw new Error('Der gespeicherte Garten ist nicht verfügbar.')
  clearSeasonView()
  setPage('map')
  await restoreEditor(record.snapshot)
  readIsoState.dispose?.()
  readIsoState = () => resumed
  dockOpen = true
  isoCamera.suspend?.()
  id = record.id
  isoAerialEnabled = readIsoUnderlay(id)
  isoCamera = cameraFor(id)
  saved = record
  savedInputs = editorInputSignature(saved.snapshot)
  planning = record.planning
  showLegacy = false
  get('project-name').value = record.name
  if (resumed || record.view === 'iso') showIso()
  else {
    checkpointIsoDraft(null)
    setPage('map')
  }
  projectDialog.close()
  say(resumed ? 'ISO-Entwurf wiederhergestellt.' : 'Gespeicherten Garten geöffnet.')
}

async function library() {
  const list = get('project-list')
  const projects = await listProjects()
  list.replaceChildren()
  for (const project of projects) {
    const row = document.createElement('div')
    row.className = 'project-row'
    row.append(
      action(project.name, () => {
        if (canLeave()) run(async () => open(await readProject(project.id)))
      }),
      action('Sicherung herunterladen', () => run(async () => {
        const backup = await readProject(project.id)
        if (!backup) throw new Error('Für diesen Garten ist keine Sicherung vorhanden.')
        download(backup, `garten-${project.id}.json`)
      })),
      action('Sicherung wiederherstellen', () => {
        if (canLeave() && confirm(`Sicherung für „${project.name}“ wiederherstellen?`)) {
          run(async () => open(await restoreProject(project.id, project.revision)))
        }
      }),
    )
    list.append(row)
  }
  const legacy = get('legacy-list')
  legacy.replaceChildren()
  const raw = readLegacyBackup()
  if (Object.values(raw).some(value => value !== null)) {
    const data = legacyGarden(raw)
    if (data) legacy.append(action('Altbestand (v1) ansehen', () => {
      if (canLeave()) run(() => openLegacy(data))
    }))
    else legacy.append('Die v1-Daten konnten nicht gelesen werden. ')
    legacy.append(action('v1-Original und Sicherung herunterladen', () => download(raw, 'garten-v1-sicherung.json')))
  }
  get('library-status').textContent = ''
  if (!projectDialog.open) projectDialog.showModal()
}

get('new-project').onclick = () => {
  if (!canLeave()) return
  resetProject()
  clearEditor()
  projectDialog.close()
}
function closeProject() {
  if (!canLeave()) return
  resetProject()
  clearEditor()
  run(library)
}
get('project-library').onclick = () => run(library)
const displayedPlan = () => (displayedHistory ? readHistoryState : readIsoState).exportPlan()
get('print-planting-plan').onclick = () => run(() => printPlantingPlan(displayedPlan()))
get('download-planting-plan').onclick = () => run(() => downloadPlantingPlan(displayedPlan()))
get('close-project').onclick = closeProject
get('return-project').onclick = () => { if (!working) projectDialog.close() }
projectDialog.oncancel = event => { if (working) event.preventDefault() }
get('map-tab').onclick = () => {
  if (showLegacy) run(library)
  else if (!working) setPage('map')
}
get('iso-tab').onclick = () => {
  if (showLegacy || page === 'iso') return
  run(async () => {
    await persist(planning, 'iso')
    showIso()
  })
}
get('save-project').onclick = () => run(() => persist(planning, page === 'iso' ? 'iso' : 'map', true))
get('import-project').onchange = event => {
  const file = event.target.files[0]
  event.target.value = ''
  if (!file || !canLeave()) return
  run(async () => {
    const record = await importProject(JSON.parse(await file.text()))
    await open(record)
    say('Garten aus der Sicherung geöffnet.')
  })
}

async function openKrautgaartExample() {
  const {createKrautgaartProject, krautgaartDemoId} = await import('./krautgaart-project.js')
  let record = await readProject(krautgaartDemoId)
  if (!record) {
    try {
      record = await saveProject(createKrautgaartProject(), null)
    } catch (error) {
      record = await readProject(krautgaartDemoId)
      if (!record) throw error
    }
  }
  await open(record)
}

await run(async () => {
  const preview = isKrautgaartPreview(location.search)
  let checkpoint
  try {
    checkpoint = readIsoDraft()
  } catch {
    get('draft-storage-status').textContent = 'Der Tab-Speicher für ISO-Entwürfe ist nicht verfügbar.'
    if (preview) await openKrautgaartExample()
    return
  }
  if (!checkpoint) {
    if (preview) await openKrautgaartExample()
    return
  }
  const record = await readProject(checkpoint.projectId)
  if (!record) {
    checkpointIsoDraft(null)
    if (preview) await openKrautgaartExample()
    else say('Der Garten zum ISO-Entwurf ist nicht mehr verfügbar.')
    return
  }
  const state = {...checkpoint.state}
  if (!state.blocked && checkpoint.revision !== record.revision) {
    state.blocked = true
    state.sourceRevision = checkpoint.revision
    if (state.baseSplit === undefined || (state.id !== state.fieldId && state.baseGeometry === undefined)) {
      const backup = await readProjectBackup(record.id).catch(() => null)
      if (backup?.revision === checkpoint.revision) {
        if (state.baseSplit === undefined) state.baseSplit = backup.planning.splits[state.fieldId] ?? null
        state.baseGeometry ??= savedFieldGeometry(backup.snapshot, state.fieldId)
      }
    }
  }
  await open(record, state)
})
