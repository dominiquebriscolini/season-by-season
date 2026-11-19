const key = 'season-by-season.garden.v1'
const backupKey = key + '.backup'

function isRing(ring) {
  return Array.isArray(ring) && ring.length >= 4 &&
    ring.every(point => Array.isArray(point) && point.length === 2 &&
      point.every(Number.isFinite)) &&
    ring[0][0] === ring.at(-1)[0] && ring[0][1] === ring.at(-1)[1]
}

function read(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key))
    if (data?.version !== 1 || typeof data.fixtureName !== 'string' ||
        !isRing(data.boundary) || !Array.isArray(data.objects) ||
        !data.objects.every(object => typeof object?.id === 'string' &&
          typeof object.label === 'string' && ['bed', 'path'].includes(object.kind) &&
          ['detected', 'reference', 'manual'].includes(object.source) && isRing(object.ring)) ||
        !Array.isArray(data.comparisons) || !data.cultures ||
        typeof data.cultures !== 'object' || Array.isArray(data.cultures) ||
        !Object.values(data.cultures).every(culture => typeof culture === 'string')) {
      return null
    }
    return data
  } catch {
    return null
  }
}

export function readGarden(fixtureName) {
  const latest = read(key)
  if (latest?.fixtureName === fixtureName) {
    return { garden: latest, recovered: false }
  }

  const backup = read(backupKey)
  if (backup?.fixtureName === fixtureName) {
    return { garden: backup, recovered: true }
  }
  return { garden: null, recovered: false }
}

export function saveGarden(garden) {
  const snapshot = JSON.stringify({ ...garden, version: 1 })
  localStorage.setItem(key, snapshot)
  // Keep one complete, independently readable checkpoint of the latest save.
  try {
    localStorage.setItem(backupKey, snapshot)
  } catch {
    return { backedUp: false }
  }
  return { backedUp: true }
}
