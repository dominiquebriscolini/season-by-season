const root = document.documentElement
const query = new URLSearchParams(location.search)
const get = id => document.getElementById(id)
const all = selector => [...document.querySelectorAll(selector)]
const begin = 12
const end = 23
const historyDate = 20
const currentDate = 15
const phases = [
  ['◔', 'Zunehmende Sichel'], ['◑', 'Erstes Viertel'], ['◕', 'Zunehmender Mond', 'Zunehmend'],
  ['●', 'Vollmond'], ['◕', 'Abnehmender Mond', 'Abnehmend'], ['◐', 'Letztes Viertel'], ['◔', 'Abnehmende Sichel'],
]
const samples = {
  2027: [0, 1, 2, 2, 2, 2, 2, 2, 3, 4, 4, 4],
  2028: [4, 4, 4, 4, 5, 6, 6, 6, 6, 6, 6, 6],
}
const plot = get('plot')
const detailButton = get('detail-button')
const compass = all('[data-direction]')
let year = 2028
let day = currentDate
let playTimer
let direction = 0
let zoom = 0
let offset = [0, 0]
let drag
const chosenStrip = {2027: 3, 2028: 3}

root.dataset.layout = query.get('layout') === 'b' ? 'b' : 'a'
root.dataset.view = query.get('view') === 'map' ? 'map' : 'iso'
const startsDark = query.has('theme') ? query.get('theme') === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches

function setTheme(dark) {
  root.dataset.theme = dark ? 'dark' : 'light'
  get('theme').setAttribute('aria-pressed', String(dark))
}

function setPanel(open, moveFocus = true) {
  root.dataset.panel = open ? 'open' : 'closed'
  get('details').hidden = !open
  detailButton.setAttribute('aria-expanded', String(open))
  if (moveFocus) (open ? get('detail-title') : detailButton).focus({preventScroll: true})
}

function showView(view) {
  root.dataset.view = view
  const map = view === 'map'
  get('drawing').hidden = map
  get('map-drawing').hidden = !map
  document.querySelector('.map-tools').hidden = !map
  all('button[data-view]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.view === view))
  })
  if (map) setPlaying(false)
}

function focusDialog(trigger, target, onOpen) {
  const dialog = get(target)
  get(trigger).addEventListener('click', () => {
    setPlaying(false)
    onOpen?.()
    dialog.showModal()
  })
  dialog.addEventListener('close', () => get(trigger).focus({preventScroll: true}))
}

function setDay(nextDay) {
  day = Math.min(end, Math.max(begin, nextDay))
  const date = `${year}-05-${day}`
  get('date').value = date
  get('date-readout').dateTime = date
  get('date-readout').textContent = `${day}.05.${year}`
  get('days').value = day
  get('day-back').disabled = day === begin
  get('day-next').disabled = day === end
  const [symbol, phase, shortLabel = phase] = phases[samples[year][day - begin]]
  get('moon-symbol').textContent = symbol
  get('moon-label').textContent = shortLabel
  get('moon').setAttribute('aria-label', `Mondphase: ${phase}`)
  get('days').setAttribute('aria-valuetext', `${day}. Mai ${year}`)
}

function setPlaying(playing) {
  clearInterval(playTimer)
  playTimer = undefined
  const play = get('play')
  play.textContent = playing ? 'Ⅱ' : '▷'
  play.title = playing ? 'Pausieren' : 'Abspielen'
  play.setAttribute('aria-label', play.title)
  play.setAttribute('aria-pressed', String(playing))
  if (playing) {
    if (day === end) setDay(begin)
    playTimer = setInterval(() => {
      setDay(day + 1)
      if (day === end) setPlaying(false)
    }, 650)
  }
}

function updateStrip() {
  const planted = year === 2027 && chosenStrip[year] === 3
  get('crop').textContent = planted ? 'Möhre · Miso SG' : 'Unbelegt'
  get('result-label').textContent = year === 2027 ? 'Ernte' : 'Anbaudaten'
  get('result').textContent = planted ? '1,25 kg' : 'Offen'
  get('harvest-button').hidden = !planted
}

function showYear(nextYear) {
  setPlaying(false)
  year = nextYear
  const historical = year === 2027
  const stripCount = historical ? 5 : 7
  root.dataset.history = String(historical)
  get('project-year').textContent = historical ? 'Rückblick 2027' : 'Saison 2028'
  get('plan').value = historical ? 'history' : 'current'
  get('date').min = `${year}-05-${begin}`
  get('date').max = `${year}-05-${end}`
  get('split-section').hidden = historical
  get('history-details').hidden = !historical
  get('history-season').hidden = !historical
  get('planting-button').hidden = historical
  get('save-example').disabled = historical
  get('garden-name').disabled = historical
  get('strip').replaceChildren(...Array.from({length: stripCount}, (_, index) => {
    const number = index + 1
    return new Option(`Streifen ${number} von ${stripCount}`, number)
  }))
  get('strip').value = chosenStrip[year]
  document.querySelector('.detail-scroll').scrollTop = 0
  all('[data-year]').forEach(button => button.setAttribute('aria-current', String(Number(button.dataset.year) === year)))
  plot.src = `../../evidence/visual-design-audit-01/iso/bagua-plot${historical ? '-2027' : ''}.svg`
  plot.alt = `Isometrische Zeichnung des Jardin Bagua mit ${historical ? 'fünf' : 'sieben'} Kulturstreifen`
  setDay(historical ? historyDate : currentDate)
  updateStrip()
}

function setDirection(next) {
  direction = (next + 4) % 4
  compass.forEach((button, index) => button.setAttribute('aria-pressed', String(index === direction)))
  get('announce').textContent = `Kompass: ${compass[direction].ariaLabel}. Gezeigt wird die feste Beispielzeichnung.`
}

function updateCamera() {
  plot.style.setProperty('--zoom', 1.22 ** zoom)
  plot.style.setProperty('--dx', `${offset[0]}px`)
  plot.style.setProperty('--dy', `${offset[1]}px`)
}

setTheme(startsDark)
setPanel(query.get('panel') === 'open', false)
showView(root.dataset.view)
showYear(query.get('year') === '2027' ? 2027 : 2028)

get('theme').addEventListener('click', () => setTheme(root.dataset.theme !== 'dark'))
all('button[data-view]').forEach(button => button.addEventListener('click', () => showView(button.dataset.view)))
detailButton.addEventListener('click', () => setPanel(root.dataset.panel !== 'open'))
get('close-details').addEventListener('click', () => setPanel(false))
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && root.dataset.panel === 'open' && root.dataset.view === 'iso' && !document.querySelector('dialog[open]')) setPanel(false)
})
focusDialog('project-button', 'project-dialog')
focusDialog('actions-button', 'actions-dialog')
focusDialog('planting-button', 'planting-dialog', () => {
  get('planting-context').textContent = `${get('area').value} · ${get('strip').selectedOptions[0].textContent}`
})
focusDialog('harvest-button', 'harvest-dialog')
focusDialog('map-button', 'map-dialog')
all('[data-year]').forEach(button => button.addEventListener('click', () => {
  showYear(Number(button.dataset.year))
  get('project-dialog').close()
}))
get('save-example').addEventListener('click', () => {
  const label = get('garden-name').value.trim() || 'Jardin Bagua'
  get('project-button').querySelector('strong').textContent = label
  get('project-button').setAttribute('aria-label', `Saisonprojekte · ${label}`)
  get('example-status').textContent = 'Name in dieser Vorschau übernommen.'
})
get('angle-toggle').addEventListener('click', event => {
  const open = get('angle-field').hidden
  get('angle-field').hidden = !open
  event.currentTarget.setAttribute('aria-expanded', String(open))
  event.currentTarget.textContent = open ? 'Winkel fertig' : 'Winkel ändern'
})
get('strip').addEventListener('change', event => {
  chosenStrip[year] = Number(event.target.value)
  updateStrip()
})
get('plan').addEventListener('change', event => showYear(event.target.value === 'history' ? 2027 : 2028))
get('date').addEventListener('change', event => {
  const value = event.target.value
  const prefix = `${year}-05-`
  setDay(value.startsWith(prefix) ? Number(value.slice(-2)) : day)
})
get('days').addEventListener('input', event => setDay(Number(event.target.value)))
get('day-back').addEventListener('click', () => setDay(day - 1))
get('day-next').addEventListener('click', () => setDay(day + 1))
get('play').addEventListener('click', () => setPlaying(!playTimer))
compass.forEach((button, index) => button.addEventListener('click', () => setDirection(index)))
all('[data-turn]').forEach(button => button.addEventListener('click', () => setDirection(direction + Number(button.dataset.turn))))
all('[data-zoom]').forEach(button => button.addEventListener('click', () => {
  zoom = Math.max(-2, Math.min(3, zoom + Number(button.dataset.zoom)))
  updateCamera()
}))
get('pan').addEventListener('click', event => {
  const enabled = root.dataset.pan !== 'true'
  root.dataset.pan = String(enabled)
  event.currentTarget.setAttribute('aria-pressed', String(enabled))
})
plot.addEventListener('pointerdown', event => {
  if (root.dataset.pan !== 'true' || event.button !== 0) return
  plot.setPointerCapture(event.pointerId)
  event.preventDefault()
  drag = {start: [event.clientX, event.clientY], offset, pointer: event.pointerId}
})
plot.addEventListener('pointermove', event => {
  if (!drag || drag.pointer !== event.pointerId) return
  offset = [drag.offset[0] + event.clientX - drag.start[0], drag.offset[1] + event.clientY - drag.start[1]]
  updateCamera()
})
plot.addEventListener('lostpointercapture', () => { drag = undefined })
