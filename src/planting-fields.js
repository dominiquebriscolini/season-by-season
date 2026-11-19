import {maxCultivationDays} from './planting-plan.js'

function element(tag, text) {
  const node = document.createElement(tag)
  if (text !== undefined) node.textContent = text
  return node
}

export function createPlantingFields({details, profile = false} = {}) {
  const inputs = element('div')
  inputs.className = 'planting-inputs'
  const fields = {}
  function add(key, label, input, initial = '') {
    input.value = details?.[key] ?? initial
    fields[key] = input
    const control = element('label', label)
    control.append(input)
    inputs.append(control)
  }
  function field(key, label, type, attributes = {}) {
    add(key, label, Object.assign(element('input'), {type, ...attributes}))
  }
  function choice(key, label, options, initial) {
    const input = element('select')
    input.append(...options.map(([value, text]) => new Option(text, value)))
    add(key, label, input, initial)
  }
  const positive = {min: '1', step: 'any'}
  const durationLimits = {min: '0', max: String(maxCultivationDays)}
  const methods = [['sow', 'Direktsaat'], ['transplant', 'Auspflanzen']]
  if (!profile) field('variety', 'Sorte', 'text', {maxLength: 100})
  choice('method', 'Anbauweise', profile ? [['', 'Offen'], ...methods] : methods, profile ? '' : 'sow')
  if (!profile) field('start', 'Aussaatdatum', 'date')
  field('rowSpacingCm', 'Reihenabstand (cm)', 'number', positive)
  field('plantSpacingCm', 'Abstand in der Reihe (cm)', 'number', positive)
  field('daysMin', 'Kulturdauer mindestens (Tage)', 'number', durationLimits)
  field('daysMax', 'Kulturdauer höchstens (Tage)', 'number', durationLimits)
  field('germinationPct', 'Keimrate (%)', 'number', {min: '.01', max: '100', step: 'any'})
  field('yieldEach', 'Ertrag je Pflanze', 'number', {min: '0', step: 'any'})
  choice('yieldUnit', 'Ertragseinheit', [['kg', 'kg'], ['pieces', 'Stück']], 'kg')
  return {inputs, fields}
}

export function readPlantingFields(fields) {
  return Object.fromEntries(Object.entries(fields).map(([key, input]) => {
    const value = input.type === 'number'
      ? (Number.isFinite(input.valueAsNumber) ? input.valueAsNumber : null)
      : (key === 'method' && !input.value ? null : input.value.trim())
    return [key, value]
  }))
}
