import {derive, metresPerPixel, reconcile, shape} from '../experiments/way-guided/model.js'
import {netInventory} from '../experiments/way-guided/inventory.js'
import {validStripLayout} from './strip-layout.js'
import {validPlantingDetails} from './planting-plan.js'
import {copyMatchingLayouts, sameGarden, validHarvests, validSeasonYear} from './season-projects.js'
import {validWorldGeoreference, worldImage} from './world-geography.js'

const databaseName = 'season-by-season.gardens.v2'
const projectStore = 'projects'
const backupStore = 'checkpoints'
const legacyKey = 'season-by-season.garden.v1'
export const maxFieldNameLength = 80

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(projectStore, {keyPath: 'id'})
      request.result.createObjectStore(backupStore, {keyPath: 'id'})
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('Ein anderer Tab blockiert den Gartenspeicher.'))
  })
}

async function transact(stores, mode, work) {
  const database = await openDatabase()
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(stores, mode)
      let result, failure
      transaction.oncomplete = () => resolve(result)
      transaction.onabort = () => reject(failure ?? transaction.error ?? new Error('Der Speichervorgang wurde abgebrochen.'))
      const attempt = callback => {
        try {
          callback()
        } catch (error) {
          failure = error
          transaction.abort()
        }
      }
      attempt(() => work(transaction, value => { result = value }, attempt))
    })
  } finally {
    database.close()
  }
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isPoint(point) {
  return Array.isArray(point) && point.length === 2 && point.every(Number.isFinite)
}

function isGeometry(geometry) {
  return Array.isArray(geometry) && geometry.every(polygon =>
    Array.isArray(polygon) && polygon.length && polygon.every(ring =>
      Array.isArray(ring) && ring.length >= 4 && ring.every(isPoint)))
}

function verifyProjectBody(project) {
  const {snapshot, planning} = project ?? {}
  if (typeof project?.id !== 'string' || !project.id ||
      typeof project.name !== 'string' || !project.name.trim() ||
      !isRecord(snapshot) || !isRecord(planning) ||
      !Array.isArray(snapshot.boundary) || snapshot.boundary.length < 3 || !snapshot.boundary.every(isPoint) ||
      !Array.isArray(snapshot.axes) || !Array.isArray(snapshot.outlines) ||
      !Array.isArray(snapshot.regions) || !snapshot.regions.every(region =>
        typeof region?.id === 'string' && isGeometry(region.geometry)) ||
      !isGeometry(snapshot.net?.paths) || !Array.isArray(snapshot.net.regions) ||
      !snapshot.net.regions.every(region => typeof region?.id === 'string' && isGeometry(region.geometry)) ||
      !isGeometry(snapshot.result?.paths) ||
      !isCultures(planning.cultures) || !isRecord(planning.splits) || !validFieldNames(planning.fieldNames) ||
      !validPlantings(planning) || !validHarvests(planning.harvests) ||
      !Object.values(planning.splits).every(validStripLayout) || !Array.isArray(planning.archived) ||
      !planning.archived.every(entry => typeof entry?.fieldId === 'string' && isCultures(entry.cultures) && validPlantings(entry))) {
    throw new Error('Die Datei enthält keinen vollständigen Gartenstand.')
  }
  if (snapshot.garden === 'world' && (!validWorldGeoreference(snapshot.georeference) ||
      typeof snapshot.mapSection?.name !== 'string' || !snapshot.mapSection.name.trim() ||
      snapshot.mapSection.name.length > 150)) {
    throw new Error('Der gespeicherte Weltkartenausschnitt ist ungültig.')
  }
}

function verifyProject(project) {
  verifyProjectBody(project)
  if (project.season === undefined) return
  const {siteId, year, history} = project.season ?? {}
  if (typeof siteId !== 'string' || !siteId.trim() || !validSeasonYear(year) ||
      !Array.isArray(history) || history.length > 2) {
    throw new Error('Die Saisonangaben des Gartens sind ungültig.')
  }
  const checked = new Set([project.id])
  for (const [index, previous] of history.entries()) {
    verifyProjectBody(previous)
    if (checked.has(previous.id) || Object.hasOwn(previous, 'season') ||
        !validSeasonYear(previous.year) || previous.year !== year - history.length + index ||
        !Number.isSafeInteger(previous.revision) || previous.revision < 1) {
      throw new Error('Die verknüpfte Saisonfolge ist ungültig.')
    }
    checked.add(previous.id)
  }
}

const isCultures = value => isRecord(value) && Object.values(value).every(culture => typeof culture === 'string')
const validFieldNames = names => names === undefined || (isRecord(names) &&
  Object.entries(names).every(([id, name]) => /^Fläche-[1-9]\d*$/.test(id) && typeof name === 'string' &&
    name.length > 0 && name.length <= maxFieldNameLength && name === name.trim()))
const validPlantings = ({plantings, cultures}) => plantings === undefined || (isRecord(plantings) &&
  Object.entries(plantings).every(([id, details]) => Object.hasOwn(cultures, id) && validPlantingDetails(details)))
const isWidth = width => Number.isFinite(width) && width >= 0.01 && width <= 10
const isOverride = width => width === null || isWidth(width)
async function verifyImportedSnapshot(snapshot) {
  const {gardens} = await import('./integrated-gardens.js')
  const {garden, boundary, axes, outlines, regions, retired, directions, defaultWidth, counter, georeference} = snapshot
  const image = garden === 'world' ? worldImage(georeference)
    : Object.hasOwn(gardens, garden) ? gardens[garden].fixture.image : null
  const groundKinds = ['unknown', 'bed', 'growing', 'free', 'other']
  const outlineKinds = ['unknown', 'tree', 'hedge', 'woody', 'building', 'shed', 'greenhouse', 'tunnel']
  const validRegion = region => typeof region?.id === 'string' && isGeometry(region.geometry) && groundKinds.includes(region.kind)
  if (!image || georeference?.projection !== image.projection ||
      String(georeference?.projectedExtent) !== String(image.projectedExtent) ||
      String(georeference?.size) !== String(image.size) ||
      !isWidth(defaultWidth) || !Number.isSafeInteger(counter) || counter < 0 ||
      !isRecord(directions) || !Object.values(directions).every(value =>
        isRecord(value) && Object.values(value).every(isPoint)) ||
      !axes.every(axis => typeof axis?.id === 'string' &&
        Array.isArray(axis.points) && axis.points.length >= 2 && axis.points.every(isPoint) &&
        isOverride(axis.width) && Array.isArray(axis.widths) &&
        axis.widths.length === axis.points.length - 1 && axis.widths.every(isOverride)) ||
      !outlines.every(outline => typeof outline?.id === 'string' && outlineKinds.includes(outline.kind) &&
        Array.isArray(outline.points) && outline.points.length >= 3 && outline.points.every(isPoint)) ||
      !regions.every(validRegion) || !Array.isArray(retired) || !retired.every(validRegion)) {
    throw new Error('Die Geometrie der Sicherung ist unvollständig oder ungültig.')
  }
  const items = [...axes, ...outlines, ...regions, ...retired]
  const ids = new Set(items.map(({id}) => id))
  if (ids.size !== items.length || items.some(({id}) => !/^(Weg|Objekt|Fläche)-[1-9]\d*$/.test(id) ||
      Number(id.split('-').at(-1)) > counter)) {
    throw new Error('Die Sicherung enthält ungültige oder doppelte Geometrie-IDs.')
  }
  try {
    const boundaryShape = shape(boundary)
    const result = derive(null, boundaryShape, axes, {defaultWidth, directions, scale: metresPerPixel(image)})
    const matching = reconcile(regions, result.regions, () => { throw new Error('Die Flächen-IDs sind nicht eindeutig.') })
    const net = netInventory(result.paths, matching.regions, outlines, boundaryShape)
    return {...snapshot, regions: matching.regions, result, net}
  } catch {
    throw new Error('Die Geometrie der Sicherung konnte nicht eindeutig rekonstruiert werden.')
  }
}

export function readLegacyBackup() {
  return {
    [legacyKey]: localStorage.getItem(legacyKey),
    [legacyKey + '.backup']: localStorage.getItem(legacyKey + '.backup'),
  }
}

export function listProjects() {
  return transact([projectStore], 'readonly', (transaction, done) => {
    const request = transaction.objectStore(projectStore).getAll()
    request.onsuccess = () => done(request.result.sort((a, b) => b.updatedAt - a.updatedAt))
  })
}

export function readProject(id) {
  return transact([projectStore], 'readonly', (transaction, done) => {
    const request = transaction.objectStore(projectStore).get(id)
    request.onsuccess = () => done(request.result ?? null)
  })
}

export function readProjectBackup(id) {
  return transact([backupStore], 'readonly', (transaction, done) => {
    const request = transaction.objectStore(backupStore).get(id)
    request.onsuccess = () => done(request.result ?? null)
  })
}

function requireRevision(current, expectedRevision) {
  if ((current?.revision ?? null) !== expectedRevision) {
    throw new Error('Ein anderer Tab hat diesen Garten geändert. Der aktuelle Entwurf bleibt geöffnet.')
  }
}

function makeRecord(project, revision) {
  return {...project, version: 2, revision, updatedAt: Date.now()}
}

function keepSeason(project, current) {
  return current?.season ? {...project, season: current.season} : project
}

export async function saveProject(project, expectedRevision) {
  return transact([projectStore, backupStore], 'readwrite', (transaction, done, attempt) => {
    const projects = transaction.objectStore(projectStore)
    const checkpoints = transaction.objectStore(backupStore)
    const lookup = projects.get(project.id)
    lookup.onsuccess = () => attempt(() => {
      const current = lookup.result
      requireRevision(current, expectedRevision)
      const record = makeRecord(keepSeason(project, current), (current?.revision ?? 0) + 1)
      verifyProject(record)
      projects.put(record)
      checkpoints.put(current ?? record)
      done(record)
    })
  })
}

export function assignSeasonYear(id, expectedRevision, year) {
  if (!validSeasonYear(year)) throw new Error('Gib ein gültiges Hauptjahr von 1900 bis 9998 ein.')
  return transact([projectStore, backupStore], 'readwrite', (transaction, done, attempt) => {
    const projects = transaction.objectStore(projectStore)
    const checkpoints = transaction.objectStore(backupStore)
    const lookup = projects.get(id)
    lookup.onsuccess = () => attempt(() => {
      const current = lookup.result
      requireRevision(current, expectedRevision)
      if (!current || current.season) throw new Error('Das Hauptjahr kann für diesen Garten nicht neu gesetzt werden.')
      const record = makeRecord({...current, season: {siteId: current.id, year, history: []}}, current.revision + 1)
      verifyProject(record)
      projects.put(record)
      checkpoints.put(current)
      done(record)
    })
  })
}

export function createSeasonProject(id, expectedRevision, {name, year, previousId, previousRevision, copyLayout}) {
  if (!validSeasonYear(year)) throw new Error('Gib ein gültiges Hauptjahr von 1900 bis 9998 ein.')
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) {
    throw new Error('Gib einen Projektnamen mit höchstens 100 Zeichen ein.')
  }
  if (copyLayout && !previousId) throw new Error('Wähle ein Vorjahresprojekt für die Aufteilungskopie aus.')
  return transact([projectStore, backupStore], 'readwrite', (transaction, done, attempt) => {
    const projects = transaction.objectStore(projectStore)
    const checkpoints = transaction.objectStore(backupStore)
    const sourceRequest = projects.get(id)
    const previousRequest = previousId ? projects.get(previousId) : null
    const lastRequest = previousRequest ?? sourceRequest
    lastRequest.onsuccess = () => attempt(() => {
      const source = sourceRequest.result
      requireRevision(source, expectedRevision)
      if (!source) throw new Error('Der gespeicherte Garten ist nicht verfügbar.')
      const previous = previousRequest?.result
      if (previousId) {
        if (!previous || !sameGarden(source, previous) || previous.season?.year !== year - 1) {
          throw new Error('Wähle ein Projekt desselben Gartens aus dem unmittelbar vorherigen Jahr.')
        }
        requireRevision(previous, previousRevision)
        if (previous.season.history.length >= 2) {
          throw new Error('Eine Saisonfolge kann höchstens drei Hauptjahre enthalten.')
        }
      }
      const history = previous ? [...previous.season.history, {
        id: previous.id, name: previous.name, year: previous.season.year, revision: previous.revision,
        snapshot: previous.snapshot, planning: previous.planning,
      }] : []
      const {splits, copied, skipped} = copyLayout
        ? copyMatchingLayouts(previous, source.snapshot) : {splits: {}, copied: 0, skipped: 0}
      const project = makeRecord({
        id: crypto.randomUUID(), name: name.trim(), snapshot: source.snapshot,
        planning: {splits, cultures: {}, archived: [],
          ...(source.planning.fieldNames && {fieldNames: source.planning.fieldNames})}, view: 'iso',
        season: {siteId: source.season?.siteId ?? source.id, year, history},
      }, 1)
      verifyProject(project)
      projects.add(project)
      checkpoints.add(project)
      done({project, copied, skipped})
    })
  })
}

export function restoreProject(id, expectedRevision) {
  return transact([projectStore, backupStore], 'readwrite', (transaction, done, attempt) => {
    const projects = transaction.objectStore(projectStore)
    const checkpoints = transaction.objectStore(backupStore)
    const current = projects.get(id)
    const checkpoint = checkpoints.get(id)
    checkpoint.onsuccess = () => attempt(() => {
      requireRevision(current.result, expectedRevision)
      if (!checkpoint.result) throw new Error('Für diesen Garten fehlt ein Wiederherstellungspunkt.')
      const record = makeRecord(keepSeason(checkpoint.result, current.result),
        Math.max(current.result?.revision ?? 0, checkpoint.result.revision) + 1)
      verifyProject(record)
      projects.put(record)
      if (current.result) checkpoints.put(current.result)
      done(record)
    })
  })
}

export async function importProject(project) {
  if (project?.version !== 2) throw new Error('Wähle eine Sicherung eines integrierten Gartens (v2).')
  verifyProject(project)
  const [snapshot, ...historySnapshots] = await Promise.all([
    verifyImportedSnapshot(project.snapshot),
    ...(project.season?.history ?? []).map(previous => verifyImportedSnapshot(previous.snapshot)),
  ])
  const season = project.season && {...project.season,
    history: project.season.history.map((previous, index) => ({...previous, snapshot: historySnapshots[index]}))}
  return saveProject({...project, snapshot, ...(season && {season}), id: crypto.randomUUID()}, null)
}
