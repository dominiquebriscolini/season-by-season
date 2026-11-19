import {readCropProfile, saveCropProfile} from './variety-library.js'
import {createPlantingFields, readPlantingFields} from './planting-fields.js'
import {confirmProfileAdoption, formatProfileField, sourceDisplay} from './profile-sources.js'

const valueGroups = [
  ['method'], ['rowSpacingCm'], ['plantSpacingCm'], ['daysMin', 'daysMax'],
  ['germinationPct'], ['yieldEach', 'yieldUnit'],
]

function element(tag, text) {
  const node = document.createElement(tag)
  if (text !== undefined) node.textContent = text
  return node
}

function label(text, input) {
  const control = element('label')
  control.append(text, input)
  return control
}

function durationLabel({daysMin, daysMax}) {
  if (daysMin == null) return `Kulturdauer · bis ${daysMax} Tage`
  if (daysMax == null) return `Kulturdauer · ab ${daysMin} Tagen`
  return `Kulturdauer · ${daysMin === daysMax ? daysMin : `${daysMin}–${daysMax}`} Tage`
}

export function createCropProfile({crop, read, onApply, onSaved}) {
  const panel = element('details')
  panel.className = 'variety-library crop-profile'
  const edit = Object.assign(element('button', 'Profil bearbeiten'), {type: 'button'})
  const origin = element('div')
  origin.className = 'variety-profile'
  const choices = element('fieldset')
  choices.className = 'crop-profile-choices'
  const adopt = Object.assign(element('button', 'Ausgewählte Richtwerte übernehmen'), {type: 'button', disabled: true})
  const status = element('p')
  status.setAttribute('role', 'status')
  panel.append(element('summary', 'Kulturprofil'), origin, choices, adopt, edit, status)
  let profile
  let available = []

  function refresh() {
    status.textContent = ''
    try {
      profile = readCropProfile(crop)
    } catch (error) {
      profile = null
      status.textContent = error.message
    }
    origin.replaceChildren()
    choices.replaceChildren(element('legend', 'Richtwerte auswählen'))
    choices.hidden = adopt.hidden = !profile
    adopt.disabled = true
    available = []
    if (!profile) {
      origin.textContent = 'Für diese Kultur sind noch keine Richtwerte hinterlegt.'
      return
    }
    origin.append('Quelle · ')
    sourceDisplay(origin, profile.source)
    available = valueGroups.flatMap(keys => {
      const values = Object.fromEntries(keys.filter(key => profile.values[key] != null)
        .map(key => [key, profile.values[key]]))
      if (!Object.keys(values).length) return []
      const checkbox = Object.assign(element('input'), {type: 'checkbox'})
      const key = keys[0]
      const text = key === 'daysMin' ? durationLabel(values) : formatProfileField(key, values)
      const control = element('label')
      control.append(checkbox, text)
      choices.append(control)
      return [{checkbox, values}]
    })
  }

  panel.ontoggle = () => { if (panel.open) refresh() }
  choices.onchange = () => {
    adopt.disabled = !available.some(({checkbox}) => checkbox.checked)
    status.textContent = ''
  }
  adopt.onclick = () => {
    const values = Object.assign({}, ...available.filter(({checkbox}) => checkbox.checked).map(entry => entry.values))
    const current = read()
    const {daysMin, daysMax} = {...current, ...values}
    if (daysMin != null && daysMax != null && daysMin > daysMax) {
      status.textContent = 'Mindest- und Höchstdauer widersprechen sich. Prüfe die Kulturdauer im Anbauformular.'
      return
    }
    if (!confirmProfileAdoption(current, values)) return
    onApply({name: profile.crop, source: profile.source, values})
    for (const {checkbox} of available) checkbox.checked = false
    adopt.disabled = true
    status.textContent = 'Ausgewählte Richtwerte wurden ins Anbauformular übernommen.'
  }

  const editor = element('dialog')
  editor.className = 'planting-dialog crop-profile-editor'
  editor.setAttribute('aria-label', 'Kulturprofil bearbeiten')
  function closeEditor() {
    editor.close()
    editor.replaceChildren()
  }
  editor.oncancel = event => {
    event.preventDefault()
    closeEditor()
  }
  edit.onclick = () => {
    let previous
    try {
      previous = readCropProfile(crop)
    } catch (error) {
      status.textContent = error.message
      return
    }
    const {inputs, fields} = createPlantingFields({details: previous?.values, profile: true})
    const sourceName = Object.assign(element('input'), {type: 'text', required: true, maxLength: 160,
      value: previous?.source.label ?? '', autofocus: true})
    const sourceUrl = Object.assign(element('input'), {type: 'url', maxLength: 1000, value: previous?.source.url ?? ''})
    const sourceFields = element('div')
    sourceFields.className = 'planting-inputs'
    sourceFields.append(label('Quelle des Kulturprofils', sourceName), label('Quellenlink (optional)', sourceUrl))
    const save = Object.assign(element('button', 'Kulturprofil speichern'), {type: 'submit'})
    const cancel = Object.assign(element('button', 'Abbrechen'), {type: 'button'})
    cancel.onclick = closeEditor
    const actions = element('div')
    actions.className = 'tools'
    actions.append(save, cancel)
    const editStatus = element('p')
    editStatus.setAttribute('role', 'status')
    const form = element('form')
    form.append(element('h2', 'Kulturprofil bearbeiten'), element('p', crop), sourceFields, inputs, actions, editStatus)
    form.oninput = () => { editStatus.textContent = '' }
    form.onsubmit = event => {
      event.preventDefault()
      const values = readPlantingFields(fields)
      if (!values.method) delete values.method
      if (values.yieldEach == null) delete values.yieldUnit
      const source = {label: sourceName.value.trim()}
      if (sourceUrl.value.trim()) source.url = sourceUrl.value.trim()
      if (previous?.source.note && source.label === previous.source.label && source.url === previous.source.url) {
        source.note = previous.source.note
      }
      try {
        saveCropProfile({crop, source, values})
      } catch (error) {
        editStatus.textContent = error.message
        return
      }
      closeEditor()
      refresh()
      status.textContent = 'Kulturprofil gespeichert.'
      onSaved?.()
    }
    editor.replaceChildren(form)
    editor.showModal()
  }

  return {panel, editor, refresh}
}
