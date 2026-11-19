import {maxCultivationDays, validPlantingDetails, validProfileSource} from './planting-plan.js'
import {varietyCatalog} from './variety-catalog.js'

const starterCrops = ['Bohne', 'Kopfsalat', 'Möhre', 'Radieschen', 'Tomate', 'Zucchini']
export const builtInCrops = Object.freeze([
  ...starterCrops,
  'Artischocke', 'Aubergine', 'Blumenkohl', 'Brokkoli', 'Chicorée', 'Chinakohl', 'Endivie', 'Erbse',
  'Feldsalat', 'Fenchel', 'Frühlingszwiebel', 'Grünkohl', 'Gurke', 'Kartoffel', 'Knoblauch',
  'Knollensellerie', 'Kohlrabi', 'Kürbis', 'Lauch', 'Mais', 'Mangold', 'Meerrettich', 'Okra', 'Pak Choi',
  'Paprika', 'Pastinake', 'Petersilienwurzel', 'Rettich', 'Rhabarber', 'Rosenkohl', 'Rote Bete',
  'Rotkohl', 'Rucola', 'Schalotte', 'Schwarzwurzel', 'Spargel', 'Spinat', 'Staudensellerie', 'Steckrübe',
  'Süßkartoffel', 'Topinambur', 'Weißkohl', 'Wirsing', 'Zwiebel',
])
export const maxCropNameLength = 100

export const varietyLibraryKey = 'season-by-season.variety-library.v1'
const backupKey = `${varietyLibraryKey}.backup`
const maxEntries = 250
const maxCrops = 250
const maxCropProfiles = maxCrops + builtInCrops.length
const maxBackupLength = 2_500_000
const builtInCropNames = new Set(builtInCrops.map(normalizeVariety))
const starterCropNames = new Set(starterCrops.map(normalizeVariety))
const catalogIds = new Set(varietyCatalog.map(profile => profile.id))
const reusableFields = ['method', 'rowSpacingCm', 'plantSpacingCm', 'daysMin', 'daysMax',
  'germinationPct', 'yieldEach', 'yieldUnit']

const isRecord = value => value && typeof value === 'object' && !Array.isArray(value)
const validText = (value, maxLength) => typeof value === 'string' &&
  value.trim().length > 0 && value.length <= maxLength

export function normalizeVariety(value) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('de-DE')
    .replace(/ß/g, 'ss').trim().replace(/\s+/g, ' ')
}

function checkCropName(value) {
  const name = typeof value === 'string' ? value.trim().replace(/\s+/gu, ' ') : ''
  if (!validText(name, maxCropNameLength) || !normalizeVariety(name)) {
    throw new Error(`Gib einen Kulturnamen mit höchstens ${maxCropNameLength} Zeichen ein.`)
  }
  return name
}

export function profileValues(details) {
  return Object.fromEntries(reusableFields.filter(field => details?.[field] != null &&
    (field !== 'yieldUnit' || details.yieldEach != null)).map(field => [field, details[field]]))
}

function validSourceUrl(value) {
  if (!validText(value, 1000) || !/^https?:\/\//i.test(value.trim())) return false
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password
  } catch {
    return false
  }
}

export function validVarietySource(source) {
  return isRecord(source) && validText(source.label, 160) &&
    (source.note == null || typeof source.note === 'string' && source.note.length <= 600) &&
    (source.url == null || validSourceUrl(source.url))
}

function cleanSource(source) {
  return {
    label: source.label.trim(),
    ...(source.url && {url: source.url.trim()}),
    ...(source.note && {note: source.note.trim()}),
  }
}

function checkProfileValues(values, scope) {
  if (!isRecord(values) || !Object.keys(values).every(field => reusableFields.includes(field)) ||
      !validPlantingDetails(values) || (values.yieldEach != null && values.yieldUnit == null)) {
    throw new Error(`Prüfe die Anbauwerte ${scope} und die Ertragseinheit.`)
  }
  if (values.daysMin > maxCultivationDays || values.daysMax > maxCultivationDays) {
    throw new Error(`Die Kulturdauer darf höchstens ${maxCultivationDays} Tage betragen.`)
  }
  return profileValues(values)
}

function checkProfileSource(profileSource) {
  if (!validProfileSource(profileSource)) throw new Error('Die übernommenen Richtwerte der Sorte sind ungültig.')
  const [first, ...earlier] = [profileSource, ...(profileSource.earlier ?? [])].map(({name, source, values}) => {
    if (!validVarietySource(source)) throw new Error('Die Quelle der übernommenen Richtwerte ist ungültig.')
    return {name, source: cleanSource(source), values: profileValues(values)}
  })
  return {...first, ...(earlier.length && {earlier})}
}

function checkProfile(profile) {
  if (!isRecord(profile)) throw new Error('Die Sorte ist ungültig.')
  const {id, crop, name, source, values, profileSource} = profile
  if (!validText(id, 100) || id !== id.trim() || catalogIds.has(id) ||
      !validText(crop, 100) || !normalizeVariety(crop) || !validText(name, 100) || !normalizeVariety(name)) {
    throw new Error('Die Sorte braucht einen gültigen Namen und eine Kultur (je höchstens 100 Zeichen).')
  }
  if (!validVarietySource(source)) throw new Error('Die Herkunftsangabe der Sorte ist ungültig.')
  return {id, crop: crop.trim(), name: name.trim(), source: cleanSource(source),
    values: checkProfileValues(values, 'der Sorte'),
    ...(profileSource != null && {profileSource: checkProfileSource(profileSource)})}
}

function checkCropProfile(profile) {
  if (!isRecord(profile)) throw new Error('Das Kulturprofil ist ungültig.')
  const crop = checkCropName(profile.crop)
  const {source} = profile
  if (!validVarietySource(source)) throw new Error('Gib eine Quellenbezeichnung und bei Bedarf einen gültigen Link an.')
  const values = checkProfileValues(profile.values, 'des Kulturprofils')
  if (!Object.keys(values).length) throw new Error('Gib mindestens einen Anbauwert für das Kulturprofil ein.')
  return {crop, source: cleanSource(source), values}
}

function profileKey(profile) {
  return JSON.stringify([normalizeVariety(profile.crop), normalizeVariety(profile.name)])
}

function parseBackup(text) {
  if (typeof text !== 'string' || text.length > maxBackupLength) throw new Error('Die Bibliothekssicherung ist zu groß.')
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Die Bibliothekssicherung enthält ungültiges JSON.')
  }
  if (data?.version !== 1 || !Array.isArray(data.entries) || data.entries.length > maxEntries) {
    throw new Error('Die Datei ist keine unterstützte Bibliothekssicherung.')
  }
  const crops = data.crops === undefined ? [] : data.crops
  if (!Array.isArray(crops) || crops.length > maxCrops) {
    throw new Error('Die Bibliothekssicherung enthält keine gültige Liste eigener Kulturen.')
  }
  const cropProfiles = data.cropProfiles === undefined ? [] : data.cropProfiles
  if (!Array.isArray(cropProfiles) || cropProfiles.length > maxCropProfiles) {
    throw new Error('Die Bibliothekssicherung enthält keine gültige Liste von Kulturprofilen.')
  }
  return {entries: data.entries.map(checkProfile), crops: crops.map(checkCropName),
    cropProfiles: cropProfiles.map(checkCropProfile)}
}

function readSnapshot(storageKey) {
  let text
  try {
    text = localStorage.getItem(storageKey)
  } catch {
    throw new Error('Auf die lokale Pflanzenbibliothek kann nicht zugegriffen werden.')
  }
  if (text === null) return undefined
  try {
    const library = parseBackup(text)
    const {entries, crops, cropProfiles} = library
    const ownNames = new Set(crops.map(normalizeVariety))
    const cropNames = new Set([...builtInCropNames, ...ownNames])
    const profileNames = new Set(cropProfiles.map(profile => normalizeVariety(profile.crop)))
    return new Set(entries.map(profile => profile.id)).size === entries.length &&
      new Set(entries.map(profileKey)).size === entries.length &&
      ownNames.size === crops.length &&
      profileNames.size === cropProfiles.length && [...profileNames].every(name => cropNames.has(name))
      ? library : null
  } catch {
    return null
  }
}

const emptyLibrary = () => ({entries: [], crops: [], cropProfiles: []})

function loadLibrary() {
  const current = readSnapshot(varietyLibraryKey)
  if (current) return current
  const previous = readSnapshot(backupKey)
  if (previous) return previous
  return current === undefined && previous === undefined ? emptyLibrary() : null
}

function readLibrary() {
  const library = loadLibrary()
  if (!library) throw new Error('Die gespeicherte Pflanzenbibliothek ist beschädigt. Lade eine Bibliothekssicherung.')
  return library
}

export function readOwnVarieties() {
  return readLibrary().entries
}

export function readOwnCrops() {
  return readLibrary().crops
}

export function readCropProfile(crop) {
  const name = normalizeVariety(crop)
  return readLibrary().cropProfiles.find(profile => normalizeVariety(profile.crop) === name) ?? null
}

const encodeBackup = library => JSON.stringify({version: 1, ...library})

function writeLibrary(library, previous) {
  if (library.entries.length > maxEntries) throw new Error(`Die Pflanzenbibliothek fasst höchstens ${maxEntries} eigene Sorten.`)
  if (library.crops.length > maxCrops) throw new Error(`Die Pflanzenbibliothek fasst höchstens ${maxCrops} eigene Kulturen.`)
  const encoded = encodeBackup(library)
  if (encoded.length > maxBackupLength) throw new Error('Die Pflanzenbibliothek ist zu groß.')
  try {
    localStorage.setItem(backupKey, encodeBackup(previous))
    localStorage.setItem(varietyLibraryKey, encoded)
  } catch {
    throw new Error('Die Pflanzenbibliothek konnte lokal nicht gespeichert werden.')
  }
}

export function saveOwnCrop(value) {
  const name = checkCropName(value)
  const cropKey = normalizeVariety(name)
  const previous = readLibrary()
  const existing = [...previous.crops, ...builtInCrops].find(crop => normalizeVariety(crop) === cropKey)
  if (existing) return {name: existing, created: false}
  writeLibrary({...previous, crops: [...previous.crops, name]}, previous)
  return {name, created: true}
}

export function saveCropProfile(profile) {
  const entry = checkCropProfile(profile)
  const cropKey = normalizeVariety(entry.crop)
  const previous = readLibrary()
  const crop = [...previous.crops, ...builtInCrops].find(name => normalizeVariety(name) === cropKey)
  const crops = crop ? previous.crops : [...previous.crops, entry.crop]
  if (crop) entry.crop = crop
  const index = previous.cropProfiles.findIndex(item => normalizeVariety(item.crop) === cropKey)
  const cropProfiles = index >= 0 ? previous.cropProfiles.with(index, entry) : [...previous.cropProfiles, entry]
  writeLibrary({...previous, crops, cropProfiles}, previous)
  return entry
}

export function saveOwnVariety(profile) {
  const entry = checkProfile(profile)
  const previous = readLibrary()
  if (previous.entries.some(other => other.id !== entry.id && profileKey(other) === profileKey(entry))) {
    throw new Error('Eine eigene Sorte dieser Kultur mit diesem Namen ist bereits gespeichert.')
  }
  const index = previous.entries.findIndex(other => other.id === entry.id)
  const entries = index >= 0 ? previous.entries.with(index, entry) : [...previous.entries, entry]
  writeLibrary({...previous, entries}, previous)
  return entry
}

export function importVarietyBackup(text) {
  const imported = parseBackup(text)
  const stored = loadLibrary()
  const previous = stored ?? emptyLibrary()
  const entries = [...previous.entries]
  const crops = [...previous.crops]
  const cropProfiles = [...previous.cropProfiles]
  const knownIds = new Set(entries.map(profile => profile.id))
  const knownNames = new Set(entries.map(profileKey))
  let added = 0
  for (const entry of imported.entries) {
    const name = profileKey(entry)
    if (knownIds.has(entry.id) || knownNames.has(name)) continue
    entries.push(entry)
    knownIds.add(entry.id)
    knownNames.add(name)
    added += 1
  }
  const knownCrops = new Map([...builtInCrops, ...crops].map(crop => [normalizeVariety(crop), crop]))
  // New catalog names can already belong to a user's older personal library.
  const savedCropNames = new Set([...starterCropNames, ...crops.map(normalizeVariety)])
  let skippedCrops = 0
  for (const crop of imported.crops) {
    const name = normalizeVariety(crop)
    if (savedCropNames.has(name)) {
      skippedCrops += 1
      continue
    }
    crops.push(crop)
    savedCropNames.add(name)
    knownCrops.set(name, crop)
  }
  const knownProfiles = new Set(cropProfiles.map(profile => normalizeVariety(profile.crop)))
  for (const profile of imported.cropProfiles) {
    const name = normalizeVariety(profile.crop)
    if (knownProfiles.has(name)) continue
    if (!knownCrops.has(name)) {
      crops.push(profile.crop)
      knownCrops.set(name, profile.crop)
    }
    cropProfiles.push({...profile, crop: knownCrops.get(name)})
    knownProfiles.add(name)
  }
  const importedCrops = crops.length - previous.crops.length
  const importedProfiles = cropProfiles.length - previous.cropProfiles.length
  if (added || importedCrops || importedProfiles || !stored) writeLibrary({entries, crops, cropProfiles}, previous)
  return {imported: added, skipped: imported.entries.length - added, importedCrops, skippedCrops,
    importedProfiles, skippedProfiles: imported.cropProfiles.length - importedProfiles}
}

export function downloadVarietyBackup() {
  const url = URL.createObjectURL(new Blob([encodeBackup(readLibrary())], {type: 'application/json'}))
  const link = document.createElement('a')
  link.href = url
  link.download = 'season-by-season-pflanzenbibliothek.json'
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
