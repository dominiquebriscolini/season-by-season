export const worldBasemaps = {
  street: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    credit: '© OpenStreetMap-Mitwirkende',
    creditUrl: 'https://www.openstreetmap.org/copyright',
    tileSize: 256,
    levels: [19],
  },
  aerial: {
    url: 'https://tiles.versatiles.org/tiles/satellite/{z}/{x}/{y}',
    credit: 'VersaTiles · Satellitenbild und regionale Orthofotos',
    creditUrl: 'https://versatiles.org/sources/',
    tileSize: 512,
    levels: [12, 16, 17, 19],
  },
}

export function createWorldBasemapControl(onChange) {
  const element = document.createElement('div')
  element.className = 'world-basemap-control'
  element.setAttribute('role', 'group')
  element.setAttribute('aria-label', 'Kartenansicht')
  const buttons = Object.entries({street: 'Straßenkarte', aerial: 'Luftbild'}).map(([mode, label]) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = label
    button.onclick = () => {
      if (button.getAttribute('aria-pressed') === 'true') return
      setMode(mode)
      onChange(mode)
    }
    element.append(button)
    return [mode, button]
  })
  function setMode(mode) {
    for (const [value, button] of buttons) button.setAttribute('aria-pressed', String(mode === value))
  }
  setMode('street')
  return {element, setMode}
}
