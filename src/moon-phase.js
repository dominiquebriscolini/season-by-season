import {NextMoonQuarter, SearchMoonQuarter} from 'astronomy-engine'

const phases = [
  {key: 'new', label: 'Neumond'},
  {key: 'waxing-crescent', label: 'Zunehmende Sichel'},
  {key: 'first-quarter', label: 'Erstes Viertel'},
  {key: 'waxing-gibbous', label: 'Zunehmender Mond'},
  {key: 'full', label: 'Vollmond'},
  {key: 'waning-gibbous', label: 'Abnehmender Mond'},
  {key: 'last-quarter', label: 'Letztes Viertel'},
  {key: 'waning-crescent', label: 'Abnehmende Sichel'},
]

export function createMoonCalendar(timeZone) {
  const format = new Intl.DateTimeFormat('en-CA', {
    timeZone, calendar: 'iso8601', numberingSystem: 'latn', year: 'numeric', month: '2-digit', day: '2-digit',
  })
  function localDay(instant) {
    const parts = Object.fromEntries(format.formatToParts(instant).map(({type, value}) => [type, value]))
    return `${parts.year.padStart(4, '0')}-${parts.month}-${parts.day}`
  }
  function phaseForDay(day) {
    // The preceding UTC midnight is before the selected civil day in every time zone.
    const searchStart = Date.parse(`${day}T00:00:00Z`) - 86_400_000
    let next = SearchMoonQuarter(new Date(searchStart))
    if (localDay(next.time.date) < day) next = NextMoonQuarter(next)
    const principal = next.quarter * 2
    const index = localDay(next.time.date) === day ? principal : (principal + 7) % 8
    return phases[index]
  }
  return {localDay, phaseForDay}
}
