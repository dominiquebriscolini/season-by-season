export function setupViewport(map, repaint) {
  let center = [312, 312]
  let units = 1
  let size = [1, 1]
  let drag
  let pan = false
  let space = false
  let suppressClick = false
  const panButton = document.getElementById('pan')
  const interactive = event => event.target.closest('button, input, select, summary, a')

  function render() {
    const [width, height] = size.map(value => value * units)
    map.setAttribute('viewBox', [center[0] - width / 2, center[1] - height / 2, width, height].join(' '))
    repaint()
  }

  function position(clientX, clientY) {
    const box = map.getBoundingClientRect()
    return [clientX - box.left - box.width / 2, clientY - box.top - box.height / 2]
  }

  function zoom(factor, anchor = [0, 0]) {
    const next = Math.max(0.035, Math.min(5, units * factor))
    center = center.map((value, i) => value + anchor[i] * (units - next))
    units = next
    render()
  }

  function fit(points = []) {
    const box = map.getBoundingClientRect()
    size = [Math.max(box.width, 1), Math.max(box.height, 1)]
    const bounds = points.length ? [[0, 1].map(i => Math.min(...points.map(p => p[i]))),
      [0, 1].map(i => Math.max(...points.map(p => p[i])))] : [[0, 0], [624, 624]]
    center = bounds[0].map((value, i) => (value + bounds[1][i]) / 2)
    units = Math.max(0.035, ...size.map((value, i) =>
      (bounds[1][i] - bounds[0][i]) / Math.max(value - Math.min(100, value * 0.25), 1)))
    render()
  }

  new ResizeObserver(() => {
    const box = map.getBoundingClientRect()
    size = [Math.max(box.width, 1), Math.max(box.height, 1)]
    render()
  }).observe(map)

  map.addEventListener('wheel', event => {
    event.preventDefault()
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? size[1] : 1)
    zoom(Math.exp(Math.max(-0.65, Math.min(0.65, delta * 0.002))), position(event.clientX, event.clientY))
  }, {passive: false})

  function showPan() {
    map.dataset.pan = pan || space
    panButton.setAttribute('aria-pressed', pan)
  }

  panButton.onclick = () => { pan = !pan; showPan() }
  document.getElementById('zoom-in').onclick = () => zoom(0.75)
  document.getElementById('zoom-out').onclick = () => zoom(1 / 0.75)
  window.addEventListener('keydown', event => {
    if (event.code !== 'Space' || interactive(event) || document.activeElement !== map) return
    event.preventDefault()
    space = true
    showPan()
  })
  function releaseSpace() { space = false; showPan() }
  window.addEventListener('keyup', event => { if (event.code === 'Space') releaseSpace() })
  window.addEventListener('blur', releaseSpace)

  map.addEventListener('pointerdown', event => {
    suppressClick = false
    if (event.button !== 1 && !(event.button === 0 && (pan || space))) return
    event.preventDefault()
    drag = {id: event.pointerId, start: [event.clientX, event.clientY], center}
    map.dataset.drag = true
    map.setPointerCapture(drag.id)
  })
  map.addEventListener('pointermove', event => {
    if (drag?.id !== event.pointerId) return
    center = drag.center.map((value, i) =>
      value + (drag.start[i] - [event.clientX, event.clientY][i]) * units)
    render()
  })
  function end(event) {
    if (drag?.id !== event.pointerId) return
    drag = null
    suppressClick = true
    map.dataset.drag = false
  }
  map.addEventListener('pointerup', end)
  map.addEventListener('pointercancel', end)
  map.addEventListener('lostpointercapture', end)
  map.addEventListener('auxclick', event => { if (event.button === 1) event.preventDefault() })
  map.addEventListener('click', event => {
    if (pan || space || suppressClick) event.stopImmediatePropagation()
    suppressClick = false
  }, {capture: true})

  return {fit, units: () => units, stopPanning() { pan = false; showPan() }}
}
