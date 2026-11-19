import {sameGarden, seasonBounds, validSeasonYear} from './season-projects.js'
import {createMoonCalendar} from './moon-phase.js'
import {gardens} from './integrated-gardens.js'
import {worldGardenTimeZone} from './garden-time-zone.js'

const dayMilliseconds = 86_400_000
const playbackInterval = 650
const dateFormat = new Intl.DateTimeFormat('de-DE', {dateStyle: 'long', timeZone: 'UTC'})
const byName = (a, b) => a.name.localeCompare(b.name, 'de')

function element(tag, text) {
  const node = document.createElement(tag)
  if (text !== undefined) node.textContent = text
  return node
}

function button(text, activate) {
  const control = element('button', text)
  control.type = 'button'
  control.onclick = activate
  return control
}

function label(text, field) {
  const wrapper = element('label')
  wrapper.append(text, field)
  return wrapper
}

function yearField(value) {
  return Object.assign(element('input'), {type: 'number', required: true, min: 1900, max: 9998, step: 1, value})
}

const utc = date => Date.parse(`${date}T00:00:00Z`)
const iso = milliseconds => new Date(milliseconds).toISOString().slice(0, 10)

function mountCalendar(toolbar, project, onView, viewState) {
  const {season} = project
  const calendars = new Map()
  const worldZones = new WeakMap()
  function moonCalendar(snapshot) {
    const key = snapshot?.garden
    if (key === 'world' && !worldZones.has(snapshot)) worldZones.set(snapshot, worldGardenTimeZone(snapshot))
    const timeZone = key === 'world' ? worldZones.get(snapshot)
      : Object.hasOwn(gardens, key) ? gardens[key].timeZone : undefined
    if (!timeZone) return null
    if (!calendars.has(timeZone)) {
      try {
        calendars.set(timeZone, createMoonCalendar(timeZone))
      } catch (error) {
        if (!(error instanceof RangeError)) throw error
        calendars.set(timeZone, null)
      }
    }
    const calendar = calendars.get(timeZone)
    return calendar ? {timeZone, calendar} : null
  }
  const {min, max} = seasonBounds(season)
  const firstDay = utc(min)
  const lastOffset = Math.round((utc(max) - firstDay) / dayMilliseconds)
  const now = moonCalendar(project.snapshot)?.calendar.localDay(new Date())
  const defaultDate = now?.startsWith(`${season.year}-`) ? now : `${season.year}-01-01`
  const initialDate = viewState?.date >= min && viewState.date <= max ? viewState.date : defaultDate
  let timer
  const date = Object.assign(element('input'), {type: 'date', min, max, required: true, value: initialDate})
  const range = Object.assign(element('input'), {type: 'range', min: 0, max: lastOffset, step: 1})
  range.setAttribute('aria-label', 'Saisonregler')
  const plan = element('select')
  const historyByChoice = new Map(season.history.map(record => [`history:${record.id}`, record]))
  plan.append(new Option('Zum Datum passender Plan', 'auto'), new Option(`Aktuelles Projekt · ${season.year}`, 'current'),
    ...Array.from(historyByChoice, ([key, record]) => new Option(`${record.name} · ${record.year} (schreibgeschützt)`, key)))
  if (viewState?.plan === 'current' || historyByChoice.has(viewState?.plan)) plan.value = viewState.plan
  const currentView = element('p')
  currentView.className = 'season-view'
  currentView.setAttribute('role', 'status')
  const caption = element('span')
  caption.className = 'season-caption'
  const readOnlyLabel = element('span')
  readOnlyLabel.className = 'season-read-only'
  currentView.append(caption, readOnlyLabel)
  const moon = element('p')
  moon.className = 'season-moon'
  const moonIcon = element('span')
  moonIcon.className = 'season-moon-icon'
  moonIcon.setAttribute('aria-hidden', 'true')
  const moonReadout = element('span', 'Mondphase · ')
  moonReadout.className = 'season-moon-text'
  const moonLabel = element('span')
  moonReadout.append(moonLabel)
  moon.append(moonIcon, moonReadout)
  const previous = button('‹', () => step(-1))
  previous.className = 'season-step season-previous'
  previous.setAttribute('aria-label', 'Einen Tag zurück')
  const next = button('›', () => step(1))
  next.className = 'season-step season-next'
  next.setAttribute('aria-label', 'Einen Tag weiter')
  const play = button('Abspielen', () => {
    if (timer) {
      stop()
      return
    }
    timer = setInterval(() => {
      const offset = range.valueAsNumber + 1
      if (offset >= lastOffset) stop()
      showDate(iso(firstDay + Math.min(offset, lastOffset) * dayMilliseconds))
    }, playbackInterval)
    play.textContent = 'Pause'
  })
  play.className = 'season-play'

  function stop() {
    clearInterval(timer)
    timer = undefined
    play.textContent = 'Abspielen'
  }
  function showDate(selected) {
    const midnight = utc(selected)
    const offset = Math.round((midnight - firstDay) / dayMilliseconds)
    range.value = String(offset)
    date.value = selected
    range.setAttribute('aria-valuetext', dateFormat.format(midnight))
    previous.disabled = offset <= 0
    next.disabled = play.disabled = offset >= lastOffset
    const year = Number(selected.slice(0, 4))
    const history = (plan.value === 'auto' ? season.history.find(record => record.year === year)
      : historyByChoice.get(plan.value)) ?? null
    const site = moonCalendar(history?.snapshot ?? project.snapshot)
    const phase = site?.calendar.phaseForDay(selected)
    const phaseText = phase?.label ?? 'Zeitzone des Gartens unbekannt'
    const moonTitle = site ? `Ortsdatum des Gartens (${site.timeZone})` : ''
    if (moon.title !== moonTitle) moon.title = moonTitle
    if (moonLabel.textContent !== phaseText) {
      moonIcon.hidden = !phase
      moonIcon.dataset.phase = phase?.key ?? ''
      moonLabel.textContent = phaseText
    }
    const captionText = history?.name ?? `Aktuelles Projekt · Hauptjahr ${season.year}`
    const statusText = history ? ` · ${history.year} · schreibgeschützt` : ''
    if (caption.textContent !== captionText) caption.textContent = captionText
    if (readOnlyLabel.textContent !== statusText) readOnlyLabel.textContent = statusText
    readOnlyLabel.hidden = !history
    onView({date: selected, history})
  }
  function step(amount) {
    stop()
    showDate(iso(firstDay + (range.valueAsNumber + amount) * dayMilliseconds))
  }

  date.oninput = () => {
    stop()
    if (date.validity.valid) showDate(date.value)
  }
  date.onchange = () => {
    if (!date.validity.valid) showDate(iso(firstDay + range.valueAsNumber * dayMilliseconds))
  }
  range.oninput = () => {
    stop()
    showDate(iso(firstDay + range.valueAsNumber * dayMilliseconds))
  }
  plan.onchange = () => {
    stop()
    showDate(iso(firstDay + range.valueAsNumber * dayMilliseconds))
  }
  const navigation = element('div')
  navigation.className = 'season-calendar'
  const dateLabel = label(element('span', 'Saisondatum'), date)
  dateLabel.className = 'season-date'
  date.setAttribute('aria-label', 'Saisondatum')
  const planLabel = label(element('span', 'Planansicht'), plan)
  planLabel.className = 'season-plan'
  plan.setAttribute('aria-label', 'Planansicht')
  navigation.append(dateLabel, previous, next, play, range)
  if (season.history.length) navigation.append(planLabel)
  const readouts = element('div')
  readouts.className = 'season-readouts'
  readouts.append(currentView, moon)
  toolbar.append(navigation, readouts)
  showDate(initialDate)
  return {stop, getView: () => ({date: iso(firstDay + range.valueAsNumber * dayMilliseconds), plan: plan.value})}
}

export function mountSeasonToolbar(host, {project, listProjects, onAssignYear, onCreate, onOpen, onView, projectMenuHost, viewState}) {
  const toolbar = element('section')
  toolbar.className = 'season-toolbar'
  toolbar.setAttribute('aria-label', 'Saisonplanung')
  const dialog = element('dialog')
  dialog.className = 'season-project-dialog'
  dialog.setAttribute('aria-label', 'Saisonprojekte')
  const status = element('p')
  status.className = 'season-project-status'
  status.setAttribute('role', 'status')
  const close = button('Schließen', () => dialog.close())
  const heading = element('div')
  heading.className = 'library-heading'
  heading.append(element('h2', 'Saisonprojekte'), close)
  const content = element('div')
  const open = button('Saisonprojekte', () => openDialog(open))
  open.setAttribute('aria-haspopup', 'dialog')
  const openingYear = new Date().getFullYear()
  let busy = false
  let alive = true
  let requestNumber = 0
  let opener
  let calendar
  dialog.append(heading, content, status)
  projectMenuHost.replaceChildren(open)
  host.replaceChildren(toolbar, dialog)
  if (project.season) calendar = mountCalendar(toolbar, project, onView, viewState)
  else {
    const setup = element('div')
    setup.className = 'season-setup'
    const assign = button('Hauptjahr einrichten', () => openDialog(assign, true))
    assign.setAttribute('aria-haspopup', 'dialog')
    setup.append(element('p', 'Ein Hauptjahr schaltet Saisonregler, Mondphase und Erntejournal frei.'), assign)
    toolbar.append(setup)
  }

  async function openDialog(trigger, focusYear = false) {
    const request = ++requestNumber
    opener = trigger
    calendar?.stop()
    status.textContent = 'Saisonprojekte werden geladen …'
    content.replaceChildren()
    dialog.showModal()
    try {
      const records = (await listProjects()).filter(record => sameGarden(project, record))
        .sort((a, b) => (a.season?.year ?? 0) - (b.season?.year ?? 0) || byName(a, b))
      if (!alive || !dialog.open || request !== requestNumber) return
      status.textContent = ''
      renderProjects(records, focusYear)
    } catch (error) {
      if (alive && dialog.open && request === requestNumber) status.textContent = error.message
    }
  }

  async function run(action) {
    if (busy) return
    busy = close.disabled = content.inert = true
    status.textContent = 'Saisonprojekt wird gespeichert …'
    try {
      const result = await action()
      if (result !== false && dialog.open) dialog.close()
      status.textContent = ''
    } catch (error) {
      status.textContent = error.message
    } finally {
      busy = close.disabled = content.inert = false
    }
  }
  dialog.oncancel = event => { if (busy) event.preventDefault() }
  dialog.onclose = () => { if (alive && !dialog.open) opener?.focus({preventScroll: true}) }

  function renderProjects(records, focusYear) {
    const list = element('ul')
    list.className = 'season-project-list'
    for (const record of records) {
      const row = element('li')
      const isCurrent = record.id === project.id
      const select = isCurrent
        ? element('strong', record.name)
        : button(record.name, () => run(() => onOpen(record.id)))
      if (isCurrent) select.setAttribute('aria-current', 'true')
      const subtitle = record.season ? `Hauptjahr ${record.season.year}` : 'Ohne Hauptjahr'
      row.append(select, element('span', subtitle + (isCurrent ? ' · geöffnet' : '')))
      list.append(row)
    }
    content.append(list)

    if (!project.season) {
      const year = yearField(openingYear)
      const assign = element('form')
      assign.className = 'season-project-form'
      assign.append(element('h3', 'Hauptjahr einrichten'), label('Hauptjahr', year),
        element('button', 'Hauptjahr speichern'))
      assign.onsubmit = event => {
        event.preventDefault()
        if (validSeasonYear(year.valueAsNumber)) run(() => onAssignYear(year.valueAsNumber))
      }
      content.append(assign)
      if (focusYear) year.focus()
    }

    const create = element('form')
    create.className = 'season-project-form'
    create.hidden = true
    const name = Object.assign(element('input'), {type: 'text', required: true, maxLength: 100})
    const year = yearField(Math.min((project.season?.year ?? openingYear - 1) + 1, 9998))
    const predecessor = element('select')
    const copy = Object.assign(element('input'), {type: 'checkbox', disabled: true})
    const choices = new Map()
    function updateCopy() {
      copy.disabled = !predecessor.value
      if (copy.disabled) copy.checked = false
    }
    function updatePredecessors() {
      const selected = predecessor.value
      choices.clear()
      predecessor.replaceChildren(new Option('Kein Vorjahresprojekt', ''))
      for (const record of records) {
        if (record.season?.year !== year.valueAsNumber - 1) continue
        const fullChain = record.season.history.length >= 2
        const option = new Option(`${record.name} · ${record.season.year}${fullChain ? ' (bereits drei Hauptjahre)' : ''}`, record.id)
        option.disabled = fullChain
        predecessor.append(option)
        if (!fullChain) choices.set(record.id, record)
      }
      predecessor.value = choices.has(selected) ? selected : ''
      updateCopy()
    }
    year.oninput = updatePredecessors
    predecessor.onchange = updateCopy
    name.oninput = () => name.setCustomValidity('')
    create.onsubmit = event => {
      event.preventDefault()
      if (!name.value.trim()) {
        name.setCustomValidity('Gib einen Namen für das Saisonprojekt ein.')
        name.reportValidity()
        return
      }
      const selected = choices.get(predecessor.value)
      if (validSeasonYear(year.valueAsNumber)) run(() => onCreate({
        name: name.value.trim(),
        year: year.valueAsNumber,
        previousId: selected?.id,
        previousRevision: selected?.revision,
        copyLayout: copy.checked,
      }))
    }
    const newProject = button('Neues Saisonprojekt', () => {
      create.hidden = false
      newProject.hidden = true
      name.focus()
    })
    create.append(label('Name des Saisonprojekts', name), label('Hauptjahr des Saisonprojekts', year),
      label('Vorjahresprojekt', predecessor), label('Aufteilung des Vorjahrs kopieren', copy),
      element('button', 'Saisonprojekt anlegen'))
    content.append(newProject, create)
    updatePredecessors()
  }

  return {
    stop() { calendar?.stop() },
    getView() { return calendar?.getView() },
    destroy() {
      alive = false
      calendar?.stop()
      if (dialog.open) dialog.close()
      open.remove()
      host.replaceChildren()
    },
  }
}
