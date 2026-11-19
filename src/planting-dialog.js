import {calculatePlanting, validPlantingDetails} from './planting-plan.js'
import {createPlantingFields, readPlantingFields} from './planting-fields.js'
import {createCropProfile} from './crop-profile.js'
import {createVarietyPicker} from './variety-picker.js'
import {retainVarietySources, showAppliedVariety} from './profile-sources.js'

function element(tag, text) {
  const node = document.createElement(tag)
  if (text !== undefined) node.textContent = text
  return node
}

const number = new Intl.NumberFormat('de-DE', {maximumFractionDigits: 2})
const date = new Intl.DateTimeFormat('de-DE', {timeZone: 'UTC'})
const quantity = (value, unit = '') => value == null ? 'Noch offen' : number.format(value) + unit
const day = value => value ? date.format(new Date(value + 'T00:00:00Z')) : 'Noch offen'

export function attachPlantingDialog(container, {title, crop, details, geometry, metric, angle, canOpen, onSave, onSaved, onLibraryChange}) {
  const dialog = element('dialog')
  dialog.className = 'planting-dialog'
  dialog.setAttribute('aria-label', 'Anbaudaten')
  const form = element('form')
  const {inputs, fields} = createPlantingFields({details})
  const {method, start, germinationPct: germination} = fields
  let origin = details?.profileSource ?? null
  function apply(snapshot, values = snapshot.values) {
    if (values.method && values.method !== method.value) start.value = ''
    for (const [key, value] of Object.entries(values)) fields[key].value = value
    origin = retainVarietySources(snapshot, origin)
    refresh()
  }
  const profile = createCropProfile({crop, read, onApply: apply, onSaved: onLibraryChange})
  const library = createVarietyPicker({
    crop, fields, read,
    onLibraryChange() {
      onLibraryChange?.()
      profile.refresh()
    },
    getOrigin: () => origin,
    onApply(name, snapshot, values) {
      fields.variety.value = name
      if (snapshot) apply(snapshot, values)
      else refresh()
    },
  })
  const originDisplay = element('div')
  originDisplay.className = 'variety-profile'
  const result = element('dl')
  result.className = 'planting-results'
  const status = element('p')
  status.setAttribute('role', 'status')
  const save = element('button', 'Anbaudaten speichern')
  save.type = 'submit'
  const cancel = element('button', 'Abbrechen')
  cancel.type = 'button'
  cancel.onclick = () => dialog.close()
  const actions = element('div')
  actions.className = 'tools'
  actions.append(save, cancel)
  form.append(element('h2', 'Anbaudaten'), element('p', `${title} · ${crop}`), profile.panel, library,
    originDisplay, inputs, result, actions, status)
  dialog.append(form, profile.editor)
  const open = element('button', 'Anbaudaten')
  open.type = 'button'
  const initial = read()
  open.onclick = () => {
    if (canOpen()) {
      for (const [key, input] of Object.entries(fields)) input.value = initial[key] ?? ''
      origin = initial.profileSource ?? null
      status.textContent = ''
      refresh()
      dialog.showModal()
      if (profile.panel.open) profile.refresh()
    }
  }
  container.append(open, dialog)

  function read() {
    const values = readPlantingFields(fields)
    if (origin) values.profileSource = origin
    return values
  }
  function refresh() {
    const values = read()
    const sowing = method.value === 'sow'
    start.parentNode.firstChild.textContent = sowing ? 'Aussaatdatum' : 'Pflanzdatum'
    germination.parentNode.hidden = !sowing
    germination.disabled = !sowing
    const reversed = values.daysMin != null && values.daysMax != null && values.daysMin > values.daysMax
    fields.daysMax.setCustomValidity(reversed ? 'Die Höchstdauer muss mindestens der Mindestdauer entsprechen.' : '')
    showAppliedVariety(originDisplay, origin, values)
    const plan = calculatePlanting(geometry, metric, angle, values)
    result.replaceChildren(...[
      ['Reihen', quantity(plan.rowCount)],
      ['Nutzbare Reihenlänge', quantity(plan.rowLengthMetres, ' m')],
      ['Pflanzen', quantity(plan.plants)],
      [sowing ? 'Saatgutbedarf' : 'Jungpflanzenbedarf', quantity(plan.unitsNeeded, sowing ? ' Körner' : ' Stück')],
      ['Erntefenster', plan.harvestStart && plan.harvestEnd ? `${day(plan.harvestStart)} – ${day(plan.harvestEnd)}` : 'Noch offen'],
      ['Erwarteter Ertrag', quantity(plan.expectedYield, values.yieldUnit === 'kg' ? ' kg' : ' Stück')],
    ].flatMap(([label, value]) => [element('dt', label), element('dd', value)]))
  }
  inputs.oninput = refresh
  form.onsubmit = async event => {
    event.preventDefault()
    const values = read()
    if (!validPlantingDetails(values)) {
      status.textContent = 'Prüfe die eingegebenen Anbaudaten.'
      return
    }
    save.disabled = cancel.disabled = true
    try {
      await onSave(values)
      dialog.close()
      onSaved()
    } catch (error) {
      status.textContent = error.message
    } finally {
      save.disabled = cancel.disabled = false
    }
  }
  dialog.oncancel = event => { if (save.disabled) event.preventDefault() }
}
