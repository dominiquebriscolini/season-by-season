import {gardens} from './integrated-gardens.js'
import {luxembourgAerial} from './luxembourg-aerial.js'
import {worldBasemaps} from './world-basemaps.js'
import {renderWorldTiles, validWorldGeoreference} from './world-geography.js'

const svgNamespace = 'http://www.w3.org/2000/svg'

function svgNode(name, attributes) {
  const node = document.createElementNS(svgNamespace, name)
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value)
  return node
}

export function isoAerialSource({garden, georeference, boundary}, lonLat) {
  const image = gardens[garden]?.fixture.image
  if (image?.schematic) return
  const local = image?.projection === georeference.projection &&
    String(image.projectedExtent) === String(georeference.projectedExtent) && String(image.size) === String(georeference.size)
  if (!(garden === 'world' ? validWorldGeoreference(georeference) : local)) return
  const [width] = georeference.size
  const xs = boundary.map(([x]) => x)
  const ys = boundary.map(([, y]) => y)
  const top = Math.min(...ys)
  const bottom = Math.max(...ys)
  if (!(bottom > top)) return
  // The latitude conversion is slightly curved. Fit the raster over the visible plot's span.
  const anchors = [[0, top], [width, top], [0, bottom]].map(lonLat)
  return {georeference, image, anchors, top, bottom, left: Math.min(...xs), right: Math.max(...xs)}
}

export function mountIsoAerial({svg, world, defs, ground, clipId, projectRing, source, onChange}) {
  const {georeference, image, anchors, top, bottom} = source
  const [width, height] = georeference.size
  const [[x, y], [rightX, rightY], [bottomX, bottomY]] = projectRing(anchors)
  const dyX = (bottomX - x) / (bottom - top)
  const dyY = (bottomY - y) / (bottom - top)
  const clip = svgNode('clipPath', {id: clipId})
  clip.append(svgNode('polygon', {points: ground}))
  defs.append(clip)
  const underlay = svgNode('g', {'data-iso-aerial': '', 'clip-path': `url(#${clipId})`, 'aria-hidden': 'true', 'pointer-events': 'none'})
  const raster = svgNode('g', {transform: `matrix(${(rightX - x) / width} ${(rightY - y) / width} ${dyX} ${dyY} ${x - top * dyX} ${y - top * dyY})`})
  underlay.append(raster)
  world.append(underlay)

  const controls = document.createElement('div')
  controls.className = 'iso-underlay-controls'
  controls.setAttribute('role', 'group')
  controls.setAttribute('aria-label', 'Untergrund')
  const status = document.createElement('span')
  status.setAttribute('role', 'status')
  const credits = document.createElement('div')
  credits.className = 'iso-underlay-credits'
  const bar = document.createElement('div')
  bar.className = 'iso-underlay-bar'
  bar.append(controls, status, credits)

  const makeChoice = (label, aerial) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = label
    button.onclick = () => onChange(aerial)
    controls.append(button)
    return button
  }
  const drawing = makeChoice('Schraffuren/Grün', false)
  const photo = makeChoice('Luftbild', true)
  function creditLink(text, href) {
    const link = document.createElement('a')
    link.textContent = text
    link.href = href
    link.target = '_blank'
    link.rel = 'noopener'
    credits.append(link)
    return link
  }
  const base = worldBasemaps.aerial
  const primaryCredit = image ? creditLink(image.attribution.text, image.attribution.url) : creditLink(base.credit, base.creditUrl)
  const regionalCredit = image ? null : creditLink(luxembourgAerial.credit, luxembourgAerial.creditUrl)
  let enabled = false
  let ready = false
  let unavailable = false
  let regionalReady = false
  let updateViewport
  let frame = 0
  let layer

  function sync() {
    const showing = enabled && (ready || regionalReady)
    svg.dataset.isoBackground = showing ? 'aerial' : 'drawing'
    underlay.setAttribute('visibility', showing ? 'visible' : 'hidden')
    primaryCredit.hidden = !(enabled && ready)
    if (regionalCredit) regionalCredit.hidden = !(enabled && regionalReady)
    status.textContent = !enabled || showing ? '' : unavailable
      ? 'Luftbild nicht verfügbar. Schraffuren werden angezeigt.' : 'Luftbild lädt …'
    drawing.setAttribute('aria-pressed', String(!enabled))
    photo.setAttribute('aria-pressed', String(enabled))
  }

  function refresh() {
    if (!enabled || !updateViewport || frame || svg.dataset.cameraRotating === 'true') return
    frame = requestAnimationFrame(() => {
      frame = 0
      if (!enabled || !svg.isConnected) return
      const {left, top, right, bottom, width, height} = svg.getBoundingClientRect()
      const matrix = raster.getScreenCTM()
      if (!(matrix && width && height)) return
      const inverse = matrix.inverse()
      const corners = [[left, top], [right, top], [right, bottom], [left, bottom]]
        .map(([x, y]) => new DOMPoint(x, y).matrixTransform(inverse))
      const x = Math.max(source.left, Math.min(...corners.map(point => point.x)))
      const y = Math.max(source.top, Math.min(...corners.map(point => point.y)))
      const east = Math.min(source.right, Math.max(...corners.map(point => point.x)))
      const south = Math.min(source.bottom, Math.max(...corners.map(point => point.y)))
      const units = 1 / Math.max(Math.hypot(matrix.a, matrix.b), Math.hypot(matrix.c, matrix.d))
      if (east > x && south > y) updateViewport(units, {x, y, width: east - x, height: south - y})
    })
  }

  function setEnabled(value) {
    enabled = value
    if (value && (!layer || (unavailable && !ready && !regionalReady))) {
      layer?.remove()
      unavailable = false
      const loaded = () => { ready = true; sync() }
      const failed = () => { unavailable = true; sync() }
      if (image) {
        layer = svgNode('image', {href: image.url, x: 0, y: 0, width, height, preserveAspectRatio: 'none'})
        layer.addEventListener('load', loaded, {once: true})
        layer.addEventListener('error', failed, {once: true})
      } else {
        const tiles = renderWorldTiles(svg, georeference, 'aerial', {
          onAvailable: loaded, onUnavailable: failed,
          onRegionalAvailability(value) { regionalReady = value; sync() },
        })
        layer = tiles.group
        updateViewport = tiles.updateViewport
      }
      raster.append(layer)
    }
    sync()
    refresh()
  }

  return {bar, setEnabled, refresh}
}
