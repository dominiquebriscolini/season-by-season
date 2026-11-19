import {seasonBounds} from './season-projects.js'

const number = new Intl.NumberFormat('de-DE', {maximumFractionDigits: 4})
const dateFormat = new Intl.DateTimeFormat('de-DE', {dateStyle: 'medium', timeZone: 'UTC'})
const units = {kg: 'kg', pieces: 'Stück'}
const amountText = (amount, unit) => `${number.format(amount)} ${units[unit]}`
export const formatSeasonDate = date => dateFormat.format(new Date(date + 'T00:00:00Z'))

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

export function createHarvestJournal({year, target, entries, currentDate, onAdd}) {
  const journal = element('section')
  journal.className = 'harvest-journal'
  journal.setAttribute('aria-label', 'Erntejournal')
  const register = Object.assign(element('button', 'Ernte erfassen'), {type: 'button'})
  const form = element('form')
  form.hidden = true
  const {min, max} = seasonBounds({year, history: []})
  const date = Object.assign(element('input'), {type: 'date', required: true, min, max})
  const amount = Object.assign(element('input'), {type: 'number', min: '0', step: 'any', required: true})
  const unit = element('select')
  unit.append(...Object.entries(units).map(([value, text]) => new Option(text, value)))
  const note = Object.assign(element('input'), {type: 'text', maxLength: 500})
  const save = Object.assign(element('button', 'Ernte speichern'), {type: 'submit'})
  const cancel = Object.assign(element('button', 'Abbrechen'), {type: 'button'})
  const status = element('p')
  status.setAttribute('role', 'status')
  const overview = element('div')
  form.append(label('Erntedatum', date), label('Erntemenge', amount), label('Ernteeinheit', unit),
    label('Erntenotiz (optional)', note), save, cancel)
  journal.append(element('h3', 'Erntejournal'))
  if (onAdd && target) journal.append(register, form, status)
  journal.append(overview)
  let selectedDate = currentDate
  let pending = false

  function closeForm() {
    form.hidden = true
    register.disabled = false
    register.focus({preventScroll: true})
  }

  register.onclick = () => {
    form.reset()
    amount.setCustomValidity('')
    date.value = selectedDate && selectedDate >= min && selectedDate <= max ? selectedDate : `${year}-01-01`
    unit.value = target.unit ?? 'kg'
    form.prepend(element('p', `${target.label} · ${target.culture}`))
    form.hidden = false
    register.disabled = true
    status.textContent = ''
    date.focus()
  }
  amount.oninput = () => amount.setCustomValidity('')
  cancel.onclick = () => {
    form.querySelector('p')?.remove()
    closeForm()
  }
  form.onsubmit = async event => {
    event.preventDefault()
    if (!onAdd || pending) return
    if (!(amount.valueAsNumber > 0)) {
      amount.setCustomValidity('Gib eine Menge größer als null ein.')
      amount.reportValidity()
      return
    }
    pending = save.disabled = cancel.disabled = true
    try {
      await onAdd({
        id: crypto.randomUUID(), targetId: target.targetId, fieldId: target.fieldId,
        label: target.label, culture: target.culture, variety: target.variety,
        context: target.context,
        date: date.value, amount: amount.valueAsNumber, unit: unit.value, note: note.value.trim(),
      })
      form.querySelector('p')?.remove()
      closeForm()
      status.textContent = selectedDate && date.value > selectedDate
        ? `Ernte gespeichert. Sichtbar ab ${formatSeasonDate(date.value)}.` : 'Ernte gespeichert.'
      renderDay(selectedDate)
    } catch (error) {
      status.textContent = error.message
    } finally {
      pending = save.disabled = cancel.disabled = false
    }
  }

  function renderDay(day) {
    selectedDate = day
    const visible = entries().filter(entry => !day || entry.date <= day).sort((a, b) => a.date.localeCompare(b.date))
    overview.replaceChildren()
    if (!visible.length) {
      overview.append(element('p', day ? 'Bis zu diesem Tag sind keine Ernten erfasst.' : 'Es sind keine Ernten erfasst.'))
      return
    }
    const selected = target ? visible.filter(entry => entry.targetId === target.targetId &&
      entry.culture === target.culture && entry.variety === target.variety &&
      (entry.context === undefined || entry.context === target.context)) : visible
    const totals = Object.keys(units).flatMap(unit => {
      const sum = selected.filter(entry => entry.unit === unit).reduce((total, entry) => total + entry.amount, 0)
      return sum ? [amountText(sum, unit)] : []
    })
    overview.append(element('p', `${target ? 'Für diese Belegung' : 'Für dieses Projekt'}${day ? ' bis ' + formatSeasonDate(day) : ''} · ${totals.join(' und ') || 'keine Ernten'}`))
    const list = element('ul')
    for (const entry of visible) {
      const item = element('li')
      const lines = [formatSeasonDate(entry.date), entry.label, entry.culture, entry.variety, amountText(entry.amount, entry.unit)]
      item.append(element('span', lines.filter(Boolean).join(' · ')))
      if (entry.note) item.append(element('p', entry.note))
      list.append(item)
    }
    overview.append(list)
  }
  return {journal, renderDay}
}
