import {varietyCatalog} from './variety-catalog.js'
import {downloadVarietyBackup, importVarietyBackup, normalizeVariety, profileValues, readOwnVarieties, saveOwnVariety} from './variety-library.js'
import {confirmProfileAdoption, listProfileValues, showAppliedVariety, sourceDisplay, sourceForVariety} from './profile-sources.js'

function element(tag, text) {
  const node = document.createElement(tag)
  if (text !== undefined) node.textContent = text
  return node
}

function label(text, input) {
  const node = element('label', text)
  node.append(input)
  return node
}

function action(text, run) {
  const button = element('button', text)
  button.type = 'button'
  button.onclick = run
  return button
}

export function createVarietyPicker({crop, fields, read, onApply, getOrigin, onLibraryChange}) {
  const panel = element('details')
  panel.className = 'variety-library'
  panel.append(element('summary', 'Sortenbibliothek'))
  const search = element('input')
  search.type = 'search'
  const picker = element('select')
  const profileInfo = element('div')
  profileInfo.className = 'variety-profile'
  const status = element('p')
  status.setAttribute('role', 'status')
  const ownSource = element('input')
  ownSource.maxLength = 250
  let available = []
  let visible = []
  const selected = () => visible.find(profile => profile.id === picker.value)
  const choose = action('Sorte auswählen', () => {
    const profile = selected()
    if (profile) onApply(profile.name)
  })
  const adopt = action('Richtwerte übernehmen', () => {
    const profile = selected()
    if (!profile) return
    if (!confirmProfileAdoption(read(), profile.values)) return
    onApply(profile.name, sourceForVariety(profile), profile.values)
  })
  const actions = element('div')
  actions.className = 'tools'
  actions.append(choose, adopt)
  const save = action('Eigene Sorte speichern', () => {
    const name = fields.variety.value.trim()
    if (!name) {
      status.textContent = 'Gib zuerst einen Sortennamen im Anbauformular ein.'
      fields.variety.focus()
      return
    }
    try {
      const existing = readOwnVarieties().find(profile => normalizeVariety(profile.crop) === normalizeVariety(crop) &&
        normalizeVariety(profile.name) === normalizeVariety(name))
      if (existing && !window.confirm(`Eigene Sorte „${existing.name}“ aktualisieren?`)) return
      const values = profileValues(read())
      const origin = getOrigin()
      const note = ownSource.value.trim()
      const profile = {id: existing?.id ?? crypto.randomUUID(), name, crop, values,
        source: {label: 'Eigene Sorte', ...(note && {note})}, ...(origin && {profileSource: origin})}
      saveOwnVariety(profile)
      search.value = ''
      load(profile.id)
      onApply(name)
      status.textContent = 'Eigene Sorte gespeichert.'
    } catch (error) {
      status.textContent = error.message
    }
  })
  const backup = action('Pflanzenbibliothek sichern', () => {
    try { downloadVarietyBackup() } catch (error) { status.textContent = error.message }
  })
  const importFile = element('input')
  Object.assign(importFile, {type: 'file', accept: '.json,application/json'})
  importFile.onchange = async () => {
    const file = importFile.files[0]
    importFile.value = ''
    if (!file) return
    try {
      const {imported, skipped, importedCrops, skippedCrops, importedProfiles, skippedProfiles} = importVarietyBackup(await file.text())
      load()
      onLibraryChange?.()
      status.textContent = `Kulturen neu übernommen: ${importedCrops}. Übersprungen: ${skippedCrops}. Sorten neu übernommen: ${imported}. Übersprungen: ${skipped}. Kulturprofile neu übernommen: ${importedProfiles}. Übersprungen: ${skippedProfiles}.`
    } catch (error) {
      status.textContent = error.message
    }
  }
  panel.append(label('Sorten suchen', search), label('Sorte aus Bibliothek', picker), profileInfo, actions,
    element('p', 'Eine eigene Sorte übernimmt Name und Anbauwerte aus dem Formular. Das Anbaudatum bleibt beim Beet.'),
    label('Herkunft der eigenen Angaben (optional)', ownSource), save,
    backup, label('Bibliothekssicherung laden', importFile), status)

  function showProfile() {
    const profile = selected()
    profileInfo.replaceChildren()
    choose.disabled = !profile
    adopt.disabled = !profile || !Object.keys(profile.values).length
    if (!profile) return
    const source = element('div', 'Quelle · ')
    sourceDisplay(source, profile.source)
    profileInfo.append(source)
    listProfileValues(profileInfo, profile.values)
    if (profile.profileSource) {
      const provenance = element('div')
      showAppliedVariety(provenance, profile.profileSource, profile.values, 'in der Sorte abweichend')
      profileInfo.append(provenance)
    }
  }

  function filter(id = picker.value) {
    const term = normalizeVariety(search.value)
    visible = available.filter(profile => normalizeVariety(profile.name).includes(term))
    picker.replaceChildren(new Option(visible.length ? 'Sorte wählen' : 'Keine passende Sorte', ''),
      ...visible.map(profile => new Option(profile.name + (profile.source.label === 'Eigene Sorte' ? ' · eigene Sorte' : ''), profile.id)))
    picker.value = visible.some(profile => profile.id === id) ? id : ''
    showProfile()
  }

  function load(id) {
    let own = []
    try { own = readOwnVarieties() } catch (error) { status.textContent = error.message }
    const cropKey = normalizeVariety(crop)
    available = [...varietyCatalog, ...own].filter(profile => normalizeVariety(profile.crop) === cropKey)
      .sort((a, b) => a.name.localeCompare(b.name, 'de'))
    filter(id)
  }
  picker.onchange = showProfile
  search.oninput = () => filter()
  panel.onkeydown = event => {
    if (event.key === 'Enter' && (event.target === search || event.target === ownSource)) event.preventDefault()
  }
  panel.ontoggle = () => { if (panel.open) load() }
  return panel
}
