const labels = {
  rowSpacingCm: ['Reihenabstand', ' cm'], plantSpacingCm: ['Abstand in der Reihe', ' cm'],
  daysMin: ['Mindestdauer', ' Tage'], daysMax: ['Höchstdauer', ' Tage'], germinationPct: ['Keimrate', ' %'],
  yieldEach: ['Ertrag je Pflanze', ''], method: ['Anbauweise', ''],
}
const methodNames = {sow: 'Direktsaat', transplant: 'Auspflanzen'}
const number = new Intl.NumberFormat('de-DE', {maximumFractionDigits: 4})
const yieldFields = ['yieldEach', 'yieldUnit']

function element(tag, text) {
  const node = document.createElement(tag)
  if (text !== undefined) node.textContent = text
  return node
}

export function sourceDisplay(parent, source) {
  if (source.url && /^https?:\/\//i.test(source.url)) {
    const own = source.label === 'Eigene Sorte'
    if (own) parent.append('Eigene Sorte · ')
    const link = element('a', own ? 'Quelle des Ausgangsprofils' : source.label)
    link.href = source.url
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    parent.append(link)
  } else parent.append(source.label)
  if (source.note) parent.append(element('p', source.note))
}

export function formatProfileField(key, values) {
  if (values[key] == null || !Object.hasOwn(labels, key)) return ''
  const [label, unit] = labels[key]
  const value = key === 'method' ? methodNames[values[key]] : number.format(values[key]) + unit
  const yieldUnit = key === 'yieldEach' ? (values.yieldUnit === 'pieces' ? ' Stück' : ' kg') : ''
  return `${label} · ${value}${yieldUnit}`
}

export function listProfileValues(container, values, current, difference) {
  const list = element('ul')
  for (const key of Object.keys(labels)) {
    const text = formatProfileField(key, values)
    if (!text) continue
    const sameMethod = !values.method || current?.method === values.method
    const sameYieldUnit = key !== 'yieldEach' || current?.yieldUnit === values.yieldUnit
    const changed = current && (current[key] !== values[key] || !sameMethod || !sameYieldUnit)
    list.append(element('li', changed ? `${text} · ${difference}` : text))
  }
  container.append(list.childElementCount ? list : element('p', 'Für diese Sorte sind keine Richtwerte hinterlegt.'))
}

const groups = snapshot => snapshot ? [snapshot, ...(snapshot.earlier ?? [])] : []

export function retainVarietySources(snapshot, previous) {
  if (!previous) return snapshot
  const replaced = new Set(groups(snapshot).flatMap(item => Object.keys(item.values)))
  if (yieldFields.some(key => replaced.has(key))) yieldFields.forEach(key => replaced.add(key))
  const retained = groups(previous).flatMap(({name, source, values}) => {
    const remaining = Object.fromEntries(Object.entries(values).filter(([key]) => !replaced.has(key)))
    return Object.keys(remaining).length ? [{name, source, values: remaining}] : []
  })
  const earlier = [...(snapshot.earlier ?? []), ...retained]
  return earlier.length ? {...snapshot, earlier} : snapshot
}

export function sourceForVariety({name, source, values, profileSource}) {
  const own = {name, source, values: {...values}}
  const inherited = []
  for (const prior of groups(profileSource)) {
    if (prior.values.method && prior.values.method !== values.method) continue
    const matching = {}
    for (const [key, value] of Object.entries(prior.values)) {
      const keys = yieldFields.includes(key) ? yieldFields : [key]
      if (own.values[key] !== value || keys.some(field => prior.values[field] !== values[field])) continue
      matching[key] = value
      delete own.values[key]
    }
    if (Object.keys(matching).length) inherited.push({name: prior.name, source: prior.source, values: matching})
  }
  const [primary, ...earlier] = Object.keys(own.values).length || inherited.length === 0 ? [own, ...inherited] : inherited
  return earlier.length ? {...primary, earlier} : primary
}

export function showAppliedVariety(container, snapshot, current, difference = 'abweichend im Formular') {
  container.replaceChildren()
  container.hidden = !snapshot
  if (!snapshot) return
  for (const [index, part] of groups(snapshot).entries()) {
    const heading = index ? 'Beibehaltene Richtwerte' : 'Übernommene Richtwerte'
    const source = element('div')
    container.append(element('strong', `${heading} · ${part.name}`), source)
    sourceDisplay(source, part.source)
    listProfileValues(container, part.values, current, difference)
  }
}

export function confirmProfileAdoption(current, values) {
  const methodChanges = values.method && values.method !== current.method
  const changes = Object.entries(values).some(([key, value]) =>
    (key !== 'yieldUnit' || current.yieldEach != null) &&
    current[key] != null && current[key] !== '' && current[key] !== value)
  if (!(changes || methodChanges)) return true
  return window.confirm(methodChanges
    ? 'Richtwerte übernehmen und Anbauweise ändern?' + (current.start ? ' Das bisherige Anbaudatum wird geleert.' : '')
    : 'Richtwerte übernehmen und abweichende Angaben ersetzen?')
}
