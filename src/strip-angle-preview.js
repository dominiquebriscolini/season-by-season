import Polygon from 'ol/geom/Polygon.js'
import {normalizeAngle, splitField} from './strip-layout.js'

const namespace = 'http://www.w3.org/2000/svg'
const radians = Math.PI / 180
const pivotRadius = 52

function svgNode(tag, attributes) {
  const node = document.createElementNS(namespace, tag)
  setAttributes(node, attributes)
  return node
}

function setAttributes(node, attributes) {
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value)
}

function interiorPoint(geometry) {
  let best
  for (const polygon of geometry) {
    const coordinates = new Polygon(polygon).getInteriorPoint().getCoordinates()
    if (!best || coordinates[2] > best[2]) best = coordinates
  }
  return best.slice(0, 2)
}

function outline(geometry, projectPoint) {
  return geometry.flatMap(polygon => polygon.map(ring =>
    'M ' + ring.map(point => projectPoint(point).join(',')).join(' ') + ' Z')).join(' ')
}

export function mountStripAnglePreview({svg, world = svg, projectPoint, field, metric, readLayout, onAngle, isAngleActive = () => true}) {
  const pivot = interiorPoint(field.usable)
  const [cx, cy] = projectPoint(pivot)
  const [mx, my] = metric
  const [x, y] = pivot
  const derivative = (before, after) => {
    const projectedBefore = projectPoint(before)
    return projectPoint(after).map((value, index) => (value - projectedBefore[index]) / 2)
  }
  const east = derivative([x - 1 / mx, y], [x + 1 / mx, y])
  const north = derivative([x, y + 1 / my], [x, y - 1 / my])
  const determinant = east[0] * north[1] - east[1] * north[0]

  const strips = svgNode('g', {'data-strip-preview': '', 'aria-hidden': 'true'})
  const foreground = world.querySelector('.iso-building, .iso-vegetation, .iso-shell, .iso-boundary')
  world.insertBefore(strips, foreground)
  const current = [...world.querySelectorAll('[data-field-id]')].filter(item => item.dataset.fieldId === field.id)

  const badge = svgNode('text', {class: 'iso-strip-preview-label', x: 24, y: 32})
  badge.textContent = 'Streifenvorschau'
  svg.append(badge)

  const arrow = svgNode('g', {class: 'iso-strip-angle', 'aria-hidden': 'true'})
  const line = svgNode('path', {class: 'iso-strip-angle-line'})
  const marker = svgNode('circle', {cx, cy, r: 3.7, 'data-strip-angle-pivot': '', class: 'iso-strip-angle-pivot'})
  arrow.append(line, marker)
  const handle = svgNode('circle', {
    r: 10,
    class: 'iso-strip-angle-handle',
    'data-strip-angle-handle': '',
    role: 'slider',
    tabindex: 0,
    'aria-label': 'Streifenrichtung drehen',
    'aria-valuemin': 0,
    'aria-valuemax': 360,
    'aria-keyshortcuts': 'ArrowLeft ArrowRight ArrowUp ArrowDown Home End',
  })
  const tooltip = svgNode('title', {})
  tooltip.textContent = 'Ziehen zum Drehen · Shift rastet in 15°-Schritten ein'
  handle.append(tooltip)
  world.append(arrow, handle)

  let angle = 0
  let pointerId = null

  function refresh() {
    const active = isAngleActive()
    arrow.classList.toggle('iso-strip-preview-hidden', !active)
    handle.classList.toggle('iso-strip-preview-hidden', !active)
    handle.setAttribute('aria-hidden', String(!active))
    handle.setAttribute('tabindex', active ? '0' : '-1')
    const layout = readLayout()
    if (layout) angle = normalizeAngle(layout.angle)
    const direction = angle * radians
    const vector = east.map((value, index) => value * Math.sin(direction) + north[index] * Math.cos(direction))
    const length = Math.hypot(...vector)
    const [ux, uy] = vector.map(value => value / length)
    const hx = cx + ux * pivotRadius
    const hy = cy + uy * pivotRadius
    const arrowBase = [hx - ux * 30, hy - uy * 30]
    const arrowPoint = [hx - ux * 19, hy - uy * 19]
    setAttributes(line, {d: `M ${cx},${cy} L ${hx},${hy} M ${arrowBase[0] + uy * 5},${arrowBase[1] - ux * 5} L ${arrowPoint.join(',')} L ${arrowBase[0] - uy * 5},${arrowBase[1] + ux * 5}`})
    setAttributes(handle, {cx: hx, cy: hy, 'aria-valuenow': angle, 'aria-valuetext': `${angle.toLocaleString('de-DE')} Grad`})

    let paths = []
    if (layout?.preview) {
      try {
        const geometry = layout.count === 1 ? [field.usable] :
          splitField(field, field.usable, layout, metric).map(strip => strip.geometry)
        paths = geometry.filter(polygon => polygon.length).map((polygon, index) =>
          svgNode('path', {d: outline(polygon, projectPoint), 'fill-rule': 'evenodd', 'data-preview-strip': index + 1}))
      } catch {
        // Keep the saved geometry visible if an intermediate layout cannot be drawn.
      }
    }
    strips.replaceChildren(...paths)
    const show = paths.length > 0
    for (const group of current) group.classList.toggle('iso-preview-replaced', show)
    badge.classList.toggle('iso-strip-preview-hidden', !show)
    if (show) {
      strips.dataset.angle = angle
      strips.dataset.count = layout.count
    } else {
      delete strips.dataset.angle
      delete strips.dataset.count
    }
  }

  function updateFromPointer(event) {
    if (!isAngleActive() || event.pointerId !== pointerId) return
    const matrix = world.getScreenCTM()
    if (!matrix) return
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
    const dx = point.x - cx
    const dy = point.y - cy
    if (Math.hypot(dx, dy) < 2) return
    const easting = (north[1] * dx - north[0] * dy) / determinant
    const northing = (east[0] * dy - east[1] * dx) / determinant
    const rawAngle = normalizeAngle(Math.atan2(easting, northing) / radians)
    onAngle(event.shiftKey ? normalizeAngle(Math.round(rawAngle / 15) * 15) : rawAngle)
  }

  handle.addEventListener('pointerdown', event => {
    if (!isAngleActive() || event.button !== 0 || pointerId !== null) return
    event.preventDefault()
    handle.focus({preventScroll: true})
    pointerId = event.pointerId
    handle.setPointerCapture(pointerId)
  })
  handle.addEventListener('pointermove', updateFromPointer)
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    handle.addEventListener(type, event => {
      if (event.pointerId === pointerId) pointerId = null
    })
  }
  handle.addEventListener('keydown', event => {
    if (!isAngleActive()) return
    const step = {ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1}[event.key]
    if (!step && event.key !== 'Home' && event.key !== 'End') return
    event.preventDefault()
    const changed = event.shiftKey ? (Math.round(angle / 15) + step) * 15 : angle + step
    onAngle(normalizeAngle(event.key === 'Home' ? 0 : event.key === 'End' ? 359 : changed))
  })
  refresh()
  return {refresh}
}
