import Polygon from 'ol/geom/Polygon.js'

const svgNamespace = 'http://www.w3.org/2000/svg'
const planWidth = 1000
const planHeight = 580
const formatNumber = new Intl.NumberFormat('de-DE', {maximumFractionDigits: 2})
const formatDate = new Intl.DateTimeFormat('de-DE', {dateStyle: 'medium', timeZone: 'UTC'})
const methodNames = {sow: 'Direktsaat', transplant: 'Auspflanzen'}
const yieldUnits = {kg: 'kg', pieces: 'Stück'}

function html(doc, tag, content) {
  const element = doc.createElement(tag)
  if (content !== undefined) element.textContent = content
  return element
}

function svg(doc, tag, attributes, content) {
  const element = doc.createElementNS(svgNamespace, tag)
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value)
  if (content !== undefined) element.textContent = content
  return element
}

function identifier(id) {
  const match = /^Fläche-(\d+)(?::strip:(\d+))?$/.exec(id)
  if (!match) return id
  return match[2] ? `Fläche-${match[1]} · Streifen ${match[2]}` : `Fläche-${match[1]}`
}

function interiorPoint(geometry) {
  let largest
  for (const polygon of geometry) {
    const point = new Polygon(polygon).getInteriorPoint().getCoordinates()
    if (Number.isFinite(point[0]) && Number.isFinite(point[1]) && (!largest || point[2] > largest[2])) largest = point
  }
  return largest
}

function planSvg(doc, {boundary, paths, unplanted = [], rows}) {
  const xs = boundary.map(([x]) => x)
  const ys = boundary.map(([, y]) => y)
  const west = Math.min(...xs)
  const east = Math.max(...xs)
  const north = Math.min(...ys)
  const south = Math.max(...ys)
  const scale = Math.min((planWidth - 76) / (east - west), (planHeight - 64) / (south - north))
  const point = ([x, y]) => [
    planWidth / 2 + (x - (west + east) / 2) * scale,
    planHeight / 2 + (y - (north + south) / 2) * scale,
  ]
  const draw = polygons => polygons.flatMap(polygon => polygon.map(ring =>
    'M ' + ring.map(vertex => point(vertex).map(value => value.toFixed(2)).join(',')).join(' L ') + ' Z',
  )).join(' ')
  const root = svg(doc, 'svg', {viewBox: `0 0 ${planWidth} ${planHeight}`, width: planWidth, height: planHeight,
    role: 'img', 'aria-label': 'Draufsicht mit Beet- und Streifenkennungen'})
  root.append(
    svg(doc, 'rect', {width: planWidth, height: planHeight, fill: '#fff'}),
    svg(doc, 'path', {d: draw([[boundary]]), fill: '#f3f3e9', stroke: '#4c584b', 'stroke-width': 1.6}),
  )
  if (paths?.length) root.append(svg(doc, 'path', {d: draw(paths), fill: '#eadbbf', 'fill-rule': 'evenodd'}))
  for (const geometry of unplanted) {
    root.append(svg(doc, 'path', {class: 'plan-unplanted-area', d: draw(geometry), fill: 'none',
      stroke: '#879082', 'stroke-width': 0.8}))
  }
  const colors = ['#d9e9bd', '#dbe9d9', '#f0edc9']
  for (const [index, row] of rows.entries()) {
    if (!row.geometry?.length) continue
    root.append(svg(doc, 'path', {d: draw(row.geometry), fill: colors[index % colors.length],
      'fill-rule': 'evenodd', stroke: '#556c50', 'stroke-width': 1.2}))
  }
  for (const row of rows) {
    const center = row.geometry?.length && interiorPoint(row.geometry)
    if (!center) continue
    const [x, y] = point(center)
    root.append(svg(doc, 'text', {x, y, 'text-anchor': 'middle', 'dominant-baseline': 'central',
      'font-size': 15, 'font-family': 'system-ui, sans-serif', 'font-weight': 650, fill: '#162b1b',
      stroke: '#fff', 'stroke-width': 2.5, 'paint-order': 'stroke'}, identifier(row.id)))
  }
  root.append(svg(doc, 'path', {d: 'M 28 52 v -23 l -6 8 m 6 -8 l 6 8', fill: 'none', stroke: '#273a2c', 'stroke-width': 1.4}),
    svg(doc, 'text', {x: 28, y: 21, 'text-anchor': 'middle', 'font-size': 13, 'font-family': 'sans-serif'}, 'N'))
  return root
}

const date = value => value ? new Date(`${value}T00:00:00Z`) : null
const number = value => Number.isFinite(value) ? value : null
function rowValues({id, culture, details = {}, result = {}}) {
  const {variety, method, start, rowSpacingCm, plantSpacingCm, yieldUnit} = details ?? {}
  const {rowCount, rowLengthMetres, plants, unitsNeeded, harvestStart, harvestEnd, expectedYield} = result ?? {}
  const completeWindow = harvestStart && harvestEnd
  return [
    identifier(id), culture, variety || null, methodNames[method] ?? null,
    date(start), date(completeWindow ? harvestStart : null), date(completeWindow ? harvestEnd : null), number(rowCount), number(rowLengthMetres),
    number(rowSpacingCm), number(plantSpacingCm), number(plants),
    method === 'sow' ? number(unitsNeeded) : null, method === 'transplant' ? number(unitsNeeded) : null,
    number(expectedYield), Number.isFinite(expectedYield) ? yieldUnits[yieldUnit] ?? null : null,
  ]
}

function purchaseRows(rows) {
  const totals = new Map()
  for (const {culture, details, result} of rows) {
    const variety = details?.variety || null
    const key = JSON.stringify([culture, variety])
    const total = totals.get(key) ?? {culture, variety, seeds: null, starts: null, open: 0}
    const needed = number(result?.unitsNeeded)
    if (needed !== null && details?.method === 'sow') total.seeds += needed
    else if (needed !== null && details?.method === 'transplant') total.starts += needed
    else total.open++
    totals.set(key, total)
  }
  return [...totals.values()].sort((a, b) => a.culture.localeCompare(b.culture, 'de') ||
    (a.variety || '').localeCompare(b.variety || '', 'de'))
    .map(({culture, variety, seeds, starts, open}) => [culture, variety, seeds, starts, open])
}

function format(value) {
  if (value == null) return 'Noch offen'
  if (value instanceof Date) return formatDate.format(value)
  return typeof value === 'number' ? formatNumber.format(value) : value
}

const formatInput = value => value == null ? 'Noch offen' : String(value).replace('.', ',')

function appendTable(doc, parent, headers, rows) {
  const table = html(doc, 'table')
  const header = table.createTHead().insertRow()
  for (const name of headers) {
    const cell = html(doc, 'th', name)
    cell.scope = 'col'
    header.append(cell)
  }
  const body = table.createTBody()
  for (const values of rows) {
    const row = body.insertRow()
    for (const value of values) row.insertCell().textContent = format(value)
  }
  parent.append(table)
}

const purchaseColumns = ['Kultur', 'Sorte', 'Saatkörner', 'Jungpflanzen', 'Offene Belegungen']

export function printPlantingPlan(plan) {
  const preview = window.open('', '_blank')
  if (!preview) throw new Error('Die Druckansicht konnte nicht geöffnet werden. Erlaube Pop-ups für den Planer.')
  preview.opener = null
  const doc = preview.document
  doc.documentElement.lang = 'de'
  doc.title = `${plan.name} · Anbauplan`
  const style = html(doc, 'style', `
    @page { size: A4 landscape; margin: 11mm; }
    body { max-width: 1150px; margin: 24px auto; padding: 0 12px; color: #1b2b20; font: 14px/1.4 system-ui,sans-serif; }
    h1 { margin: 6px 0 3px; font-size: 22px; }
    h2 { margin: 14px 0 6px; font-size: 16px; break-after: avoid; }
    svg { width: 100%; height: auto; max-height: 110mm; display: block; break-inside: avoid; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 12px; font-size: 11px; }
    th, td { border: 1px solid #a9b3a9; text-align: left; vertical-align: top; padding: 4px; overflow-wrap: anywhere; }
    th { background: #e9eee6; }
    tr { break-inside: avoid; }
    button { padding: 7px 12px; font: inherit; }
    @media print {
      body { max-width: none; margin: 0; padding: 0; }
      button { display: none; }
      thead { display: table-header-group; }
      svg, th { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  `)
  const button = html(doc, 'button', 'Drucken / PDF speichern')
  button.type = 'button'
  button.onclick = () => preview.print()
  doc.head.append(style)
  doc.body.append(button, html(doc, 'h1', plan.name), planSvg(doc, plan), html(doc, 'h2', 'Anbauübersicht'))
  const rows = plan.rows.map(rowValues).map(([id, crop, variety, method, start, early, late, rows, length,
    rowSpacing, plantSpacing, plants, seeds, starts, amount, unit]) => [
    id, crop, variety, method, start, early || late ? `${format(early)} – ${format(late)}` : null,
    rows, length, rowSpacing != null || plantSpacing != null ? `${formatInput(rowSpacing)} / ${formatInput(plantSpacing)}` : null,
    plants, seeds != null ? `${format(seeds)} Saatkörner` : starts != null ? `${format(starts)} Jungpflanzen` : null,
    amount != null ? `${format(amount)}${unit ? ` ${unit}` : ''}` : null,
  ])
  if (!rows.length) doc.body.append(html(doc, 'p', 'Für diesen Garten sind keine Kulturen ausgewählt.'))
  else {
    appendTable(doc, doc.body, ['Kennung', 'Kultur', 'Sorte', 'Anbauweise', 'Beginn', 'Erntefenster', 'Reihen',
      'Reihenlänge (m)', 'Abstände Reihe / Pflanze (cm)', 'Pflanzen', 'Bedarf', 'Erwarteter Ertrag'], rows)
    doc.body.append(html(doc, 'h2', 'Einkauf'))
    appendTable(doc, doc.body, purchaseColumns, purchaseRows(plan.rows))
  }
}

async function planPng(plan) {
  const drawing = planSvg(document, plan)
  const svgText = new XMLSerializer().serializeToString(drawing)
  const url = URL.createObjectURL(new Blob([svgText], {type: 'image/svg+xml;charset=utf-8'}))
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = planWidth * 2
    canvas.height = planHeight * 2
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Die Draufsicht konnte nicht gerendert werden.')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/png')
  } finally {
    URL.revokeObjectURL(url)
  }
}

function sheetTable(sheet, name, heading, headers, rows, widths) {
  sheet.getCell('A1').value = heading
  sheet.getCell('A1').font = {bold: true, size: 15}
  sheet.getCell('A2').value = 'Leere Zellen bedeuten „Noch offen“.'
  if (!rows.length) {
    sheet.getCell('A4').value = 'Keine Belegungen vorhanden.'
    return
  }
  sheet.addTable({name, ref: 'A4', columns: headers.map(name => ({name, filterButton: true})),
    headerRow: true, totalsRow: false, style: {theme: 'TableStyleMedium4', showRowStripes: true}, rows})
  sheet.views = [{state: 'frozen', ySplit: 4}]
  for (const [index, width] of widths.entries()) sheet.getColumn(index + 1).width = width
}

export async function downloadPlantingPlan(plan) {
  const [{default: ExcelJS}, png] = await Promise.all([import('exceljs'), planPng(plan)])
  const workbook = new ExcelJS.Workbook()
  const planSheet = workbook.addWorksheet('Plan')
  planSheet.getCell('A1').value = plan.name
  planSheet.getCell('A1').font = {bold: true, size: 15}
  const imageId = workbook.addImage({base64: png, extension: 'png'})
  planSheet.addImage(imageId, {tl: {col: 0, row: 2}, ext: {width: planWidth, height: planHeight}})
  const sheet = workbook.addWorksheet('Anbau')
  sheetTable(sheet, 'Anbaudaten', `${plan.name} · Anbauübersicht`,
    ['Kennung', 'Kultur', 'Sorte', 'Anbauweise', 'Beginn', 'Ernte ab', 'Ernte bis', 'Reihen', 'Reihenlänge (m)',
      'Reihenabstand (cm)', 'Pflanzenabstand (cm)', 'Pflanzen', 'Saatkörner', 'Jungpflanzen', 'Erwarteter Ertrag', 'Ertragseinheit'],
    plan.rows.map(rowValues), [28, 19, 24, 17, 15, 15, 15, 13, 18, 21, 22, 14, 15, 16, 21, 16])
  for (const column of [5, 6, 7]) sheet.getColumn(column).numFmt = 'dd.mm.yyyy'
  for (const column of [9, 15]) sheet.getColumn(column).numFmt = '#,##0.##'
  const purchase = workbook.addWorksheet('Einkauf')
  sheetTable(purchase, 'BedarfJeSorte', 'Bedarf je Kultur und Sorte', purchaseColumns,
    purchaseRows(plan.rows), [21, 26, 17, 17, 22])
  const buffer = await workbook.xlsx.writeBuffer()
  const url = URL.createObjectURL(new Blob([buffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}))
  const link = document.createElement('a')
  const filename = plan.name.replace(/[<>:"/\\|?*]/g, '-').trim() || 'Garten'
  link.href = url
  link.download = `${filename} - Anbauplan.xlsx`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
