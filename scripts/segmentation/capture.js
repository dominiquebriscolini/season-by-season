import { fromLonLat } from 'ol/proj.js'

const mode = new URLSearchParams(location.search).get('method')
const fixture = await (await fetch('/evidence/segmentation/fixture.json')).json()
if (!['segment', 'rgb', 'manual'].includes(mode)) throw new Error('Specify method.')
const descriptions = {
  rgb: 'Je Paar zwei Beetecken und zwei Achspunkte des Wegs setzen. Die Achse von oben nach unten zeichnen und die Halbbreite in Bildpixeln eingeben.',
  segment: 'Objekttyp wählen, zwei gegenüberliegende Fensterecken und einen Vordergrundpunkt setzen.',
  manual: 'Objekttyp wählen und die sichtbare Außenkontur abfahren.',
}
const get = id => document.getElementById(id)
const canvas = document.querySelector('canvas')
const context = canvas.getContext('2d')
const image = new Image()
image.src = fixture.image.url
await image.decode()
canvas.width = image.naturalWidth
canvas.height = image.naturalHeight
const [west, south, east, north] = fixture.image.projectedExtent
const boundary = fixture.suggestedBoundary.map(point => {
  const [x, y] = fromLonLat(point)
  return [canvas.width * (x - west) / (east - west), canvas.height * (north - y) / (north - south)]
})
get('heading').textContent = fixture.name
get('instructions').textContent = descriptions[mode]
get('object-buttons').hidden = mode === 'rgb'
get('rgb-buttons').hidden = mode !== 'rgb'
const events = []
const objects = []
let started
let completed
let active
function record(action, data) {
  const now = performance.now()
  started ??= now
  events.push({ action, ms: Math.round(now - started), ...data })
}
function drawLine(points, close, color) {
  if (!points.length) return
  context.strokeStyle = color
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(...points[0])
  for (const p of points.slice(1)) context.lineTo(...p)
  if (close) context.closePath()
  context.stroke()
  for (const [x, y] of points) context.fillRect(x - 2, y - 2, 4, 4)
}
function update() {
  const points = active?.points ?? []
  const count = mode === 'manual' ? points.length >= 3 : points.length === (mode === 'rgb' ? 4 : 3)
  const validWidth = get('width').value !== '' && get('width').checkValidity()
  get('finish').disabled = !count || (mode === 'rgb' && !validWidth)
  get('undo').disabled = !points.length
  get('export').disabled = !!active || !objects.length
  get('width-row').hidden = mode !== 'rgb' || !active
  get('status').textContent = active ? points.length + ' Punkte gesetzt' : objects.length + ' abgeschlossen'
  context.drawImage(image, 0, 0)
  context.fillStyle = '#fff5a4'
  drawLine(boundary, false, '#fff5a4')
  if (active) drawLine(points, false, '#17d6f2')
}
function start(kind) {
  if (active) return
  record('select', { kind })
  active = { kind, points: [] }
  get('width').value = ''
  update()
}
function finish(via) {
  if (get('finish').disabled) return
  if (mode === 'rgb') active.halfWidth = Number(get('width').value)
  record('finish', { via })
  objects.push(active)
  active = undefined
  completed = events.at(-1).ms
  update()
}
get('bed').onclick = () => start('bed')
get('path').onclick = () => start('path')
get('pair').onclick = () => start('pair')
get('width').onchange = () => {
  record('width', { value: Number(get('width').value) })
  update()
}
get('width').oninput = update
get('finish').onclick = () => finish('button')
get('undo').onclick = () => {
  active.points.pop()
  record('undo')
  update()
}
canvas.onclick = event => {
  if (!active || (mode !== 'manual' && active.points.length >= (mode === 'rgb' ? 4 : 3))) return
  const box = canvas.getBoundingClientRect()
  const point = [
    Math.round((event.clientX - box.left) * canvas.width / box.width),
    Math.round((event.clientY - box.top) * canvas.height / box.height),
  ]
  active.points.push(point)
  record('point', { point })
  update()
}
document.addEventListener('keydown', event => {
  if (event.key === 'Enter' && document.activeElement === canvas) {
    event.preventDefault()
    finish('enter')
  }
})
window.benchmarkInput = () => ({ method: mode, objects, events, elapsedMs: completed })
get('export').onclick = () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(window.benchmarkInput(), null, 2) + '\n'], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `${mode}-input.json`
  link.click()
  URL.revokeObjectURL(url)
}
update()
