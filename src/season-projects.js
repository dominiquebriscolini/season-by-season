import {savedFieldGeometry} from './iso-session-draft.js'

export function validSeasonYear(year) {
  return Number.isInteger(year) && year >= 1900 && year <= 9998
}

export function sameGarden(a, b) {
  const site = a?.season?.siteId ?? a?.id
  return Boolean(site && site === (b?.season?.siteId ?? b?.id))
}

export function seasonBounds({year, history}) {
  return {min: `${(history[0]?.year ?? year) - 1}-07-01`, max: `${year + 1}-06-30`}
}

export function validHarvestDate(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date.startsWith('0000')) return false
  const parsed = new Date(`${date}T00:00:00.000Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date
}

export function validHarvests(harvests) {
  if (harvests === undefined) return true
  if (!Array.isArray(harvests)) return false
  const ids = new Set()
  for (const entry of harvests) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return false
    const {id, targetId, fieldId, label, culture, variety, date, amount, unit, note, context} = entry
    if (![id, targetId, fieldId, label, culture].every(value => typeof value === 'string' && value.trim()) ||
        (targetId !== fieldId && !targetId.startsWith(`${fieldId}:strip:`)) ||
        typeof variety !== 'string' || typeof note !== 'string' ||
        (context !== undefined && typeof context !== 'string') ||
        !validHarvestDate(date) || !Number.isFinite(amount) || amount <= 0 ||
        (unit !== 'kg' && unit !== 'pieces') || ids.has(id)) return false
    ids.add(id)
  }
  return true
}

function plantableField(snapshot, id) {
  return snapshot.regions.find(field => field.id === id && (field.kind === 'bed' || field.kind === 'growing')) &&
    snapshot.net.regions.find(field => field.id === id && field.geometry.length > 0)
}

export function copyMatchingLayouts(source, destinationSnapshot) {
  const layouts = Object.entries(source.planning.splits)
  const matching = layouts.filter(([id]) =>
    plantableField(source.snapshot, id) && plantableField(destinationSnapshot, id) &&
    savedFieldGeometry(source.snapshot, id) === savedFieldGeometry(destinationSnapshot, id))
  return {splits: Object.fromEntries(matching), copied: matching.length, skipped: layouts.length - matching.length}
}
