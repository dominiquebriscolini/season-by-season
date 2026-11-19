const directions = [
  ['N', 'Norden'], ['O', 'Osten'], ['S', 'Süden'], ['W', 'Westen'],
]
const root3 = Math.sqrt(3)
const zoomStep = 1.25
const minZoom = 1 / (zoomStep ** 2)
const maxZoom = zoomStep ** 6

function wrap(angle) {
  return (angle % 360 + 360) % 360
}

function orientation(angle) {
  const radians = angle * Math.PI / 180
  const sin = Math.sin(radians)
  const cos = Math.cos(radians)
  return {cos: Math.abs(cos) < 1e-14 ? 0 : cos, sin: Math.abs(sin) < 1e-14 ? 0 : sin}
}

function control(label, text, action) {
  const button = document.createElement('button')
  button.type = 'button'
  button.setAttribute('aria-label', label)
  button.title = label
  button.textContent = text
  button.addEventListener('click', action)
  return button
}

function controlGroup(label) {
  const group = document.createElement('div')
  group.className = 'iso-camera-controls'
  group.setAttribute('role', 'group')
  group.setAttribute('aria-label', label)
  return group
}

export function createIsoCamera({state, onChange} = {}) {
  const valid = Number.isInteger(state?.direction) && state.direction >= 0 && state.direction < directions.length &&
    Number.isFinite(state.zoom) && state.zoom >= minZoom && state.zoom <= maxZoom &&
    Array.isArray(state.focus) && state.focus.length === 2 &&
    state.focus.every(value => Number.isFinite(value) && Math.abs(value) <= 1e6)
  let direction = valid ? state.direction : 0
  let angle = direction * 90
  let zoom = valid ? state.zoom : 1
  let focus = valid ? [...state.focus] : undefined
  let pan = false
  let animation = 0
  const views = new Map()

  function remember() {
    onChange?.({direction, zoom, focus: [...focus]})
  }

  function paint() {
    if (!views.size) return
    const {cos, sin} = orientation(angle)
    const a = zoom * cos
    const b = -zoom * sin / root3
    const c = zoom * sin * root3
    const d = zoom * cos
    for (const {svg, world, center, onViewChange} of views.values()) {
      const e = center[0] - a * focus[0] - c * focus[1]
      const f = center[1] - b * focus[0] - d * focus[1]
      world.setAttribute('transform', `matrix(${a} ${b} ${c} ${d} ${e} ${f})`)
      svg.dataset.cameraAngle = wrap(angle)
      svg.dataset.cameraZoom = zoom
      svg.dataset.cameraFocusX = focus[0]
      svg.dataset.cameraFocusY = focus[1]
      svg.dataset.cameraRotating = Boolean(animation)
      onViewChange?.({angle: wrap(angle), zoom})
    }
  }

  function syncControls() {
    for (const view of views.values()) view.sync()
  }

  function turn(nextDirection, bias = 0) {
    if (direction !== nextDirection) {
      direction = nextDirection
      remember()
    }
    syncControls()
    const from = angle
    const destination = direction * 90
    const shortest = wrap(destination - from + 180) - 180
    const delta = shortest === -180 && bias >= 0 ? 180 : shortest
    cancelAnimationFrame(animation)
    if (!delta || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      animation = 0
      angle = destination
      paint()
      return
    }
    const duration = Math.abs(delta) * 500 / 90
    const start = performance.now()
    function frame(now) {
      const progress = Math.max(0, Math.min(1, (now - start) / duration))
      const eased = progress * progress * (3 - 2 * progress)
      angle = progress === 1 ? destination : from + delta * eased
      animation = progress < 1 ? requestAnimationFrame(frame) : 0
      paint()
    }
    animation = requestAnimationFrame(frame)
    paint()
  }

  function shiftFocus(dx, dy, origin) {
    const {cos, sin} = orientation(angle)
    focus = [origin[0] - (cos * dx - root3 * sin * dy) / zoom,
      origin[1] - (sin / root3 * dx + cos * dy) / zoom]
  }

  function mount({svg, world, center, onViewChange, viewId = 'current'}) {
    focus ??= [...center]
    let drag
    const toolbar = document.createElement('div')
    toolbar.className = 'iso-camera'
    toolbar.setAttribute('role', 'group')
    toolbar.setAttribute('aria-label', 'ISO-Kamera')
    const compass = controlGroup('Blickrichtung')
    const directionButtons = directions.map(([letter, label], index) => control(label, letter, () => turn(index)))
    compass.append(...directionButtons)
    const turns = controlGroup('Vierteldrehung')
    turns.append(control('Nach links drehen', '↶', () => turn((direction + 3) % 4, -1)),
      control('Nach rechts drehen', '↷', () => turn((direction + 1) % 4, 1)))
    const framing = controlGroup('Bildausschnitt')
    function zoomBy(factor, anchor) {
      const previousZoom = zoom
      zoom = Math.max(minZoom, Math.min(maxZoom, previousZoom * factor))
      if (zoom === previousZoom) return
      if (anchor) {
        const offset = 1 - zoom / previousZoom
        shiftFocus((anchor.x - center[0]) * offset, (anchor.y - center[1]) * offset, focus)
      }
      remember()
      syncControls()
      paint()
    }
    function togglePan(enabled) {
      pan = enabled
      syncControls()
    }
    const zoomOut = control('Verkleinern', '−', () => zoomBy(1 / zoomStep))
    const zoomIn = control('Vergrößern', '+', () => zoomBy(zoomStep))
    const panButton = control('Verschieben', 'Verschieben', () => togglePan(!pan))
    function sync() {
      directionButtons.forEach((button, index) => button.setAttribute('aria-pressed', String(index === direction)))
      zoomOut.disabled = zoom <= minZoom
      zoomIn.disabled = zoom >= maxZoom
      panButton.setAttribute('aria-pressed', String(pan))
      svg.dataset.cameraPan = String(pan)
    }
    framing.append(zoomOut, zoomIn, panButton)
    toolbar.append(compass, turns, framing)
    svg.setAttribute('tabindex', '0')

    function point(event) {
      const matrix = svg.getScreenCTM()
      return matrix && new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
    }
    svg.addEventListener('wheel', event => {
      if (event.ctrlKey || event.metaKey || drag || !event.deltaY) return
      const anchor = point(event)
      if (!anchor) return
      event.preventDefault()
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? svg.clientHeight : 1)
      zoomBy(Math.exp(-Math.max(-0.65, Math.min(0.65, delta * 0.002))), anchor)
    }, {passive: false})
    svg.addEventListener('pointerdown', event => {
      if (!pan || drag || event.button !== 0) return
      const start = point(event)
      if (!start) return
      event.preventDefault()
      event.stopImmediatePropagation()
      svg.focus({preventScroll: true})
      svg.setPointerCapture(event.pointerId)
      drag = {id: event.pointerId, start, focus: [...focus]}
      svg.dataset.cameraDragging = 'true'
    }, true)
    svg.addEventListener('pointermove', event => {
      if (event.pointerId !== drag?.id) return
      const current = point(event)
      if (!current) return
      shiftFocus(current.x - drag.start.x, current.y - drag.start.y, drag.focus)
      paint()
    })
    for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      svg.addEventListener(eventName, event => {
        if (event.pointerId !== drag?.id) return
        const moved = focus.some((value, index) => value !== drag.focus[index])
        drag = null
        delete svg.dataset.cameraDragging
        if (moved) remember()
      })
    }
    svg.addEventListener('click', event => {
      if (pan) event.stopImmediatePropagation()
    }, true)
    svg.addEventListener('keydown', event => {
      if (!pan || event.target !== svg) return
      if (event.key === 'Escape') {
        event.preventDefault()
        togglePan(false)
        panButton.focus()
        return
      }
      const offset = {ArrowLeft: [24, 0], ArrowRight: [-24, 0], ArrowUp: [0, 24], ArrowDown: [0, -24]}[event.key]
      if (!offset) return
      event.preventDefault()
      shiftFocus(...offset, focus)
      paint()
      remember()
    })

    views.set(viewId, {svg, world, center, onViewChange, sync})
    sync()
    paint()
    return toolbar
  }

  function suspend() {
    cancelAnimationFrame(animation)
    animation = 0
    angle = direction * 90
    paint()
    views.clear()
  }

  function unmount(viewId) {
    views.delete(viewId)
  }

  return {mount, unmount, suspend}
}
