async page => {
  const assert = (ok, message) => { if (!ok) throw new Error(message) }
  const button = (name, root = page) => root.getByRole('button', {name, exact: true})
  const dialog = page.getByRole('dialog', {name: 'Weltkarte', exact: true})
  const search = dialog.getByRole('searchbox', {name: 'Ort oder Adresse', exact: true})
  const moon = page.locator('.season-moon')
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.setViewportSize({width: 1440, height: 960})
  page.setDefaultTimeout(15_000)
  await page.goto('http://127.0.0.1:5173/')
  await button('Weltkarte').click()
  await search.fill('Tokio')
  const searching = page.waitForResponse(response => response.url().startsWith('https://photon.komoot.io/api/'))
  await button('Suchen', dialog).click()
  const response = await searching
  assert(response.ok(), 'Der Ortssuchdienst antwortete nicht erfolgreich')
  await dialog.getByRole('button', {name: /^Tokio, Japan$/i}).click()
  await dialog.getByRole('region', {name: 'Navigierbare Weltkarte'}).locator('canvas').first().waitFor()
  assert(await dialog.getByRole('link', {name: /OpenStreetMap/}).isVisible(), 'OSM-Quellenangabe fehlt')
  await button('Ausschnitt übernehmen', dialog).click()
  await page.getByText('Ausschnitt übernommen. Zeichne die Grundstücksgrenze.', {exact: true}).waitFor()
  assert(await page.locator('#garden').inputValue() === 'world' &&
    await page.getByRole('link', {name: '© OpenStreetMap-Mitwirkende', exact: true}).isVisible(),
  'Kartenabschnitt oder OSM-Quellenangabe fehlt')
  const svg = page.locator('#map')
  async function point(x, y) {
    const position = await svg.evaluate((node, coordinates) => {
      const point = new DOMPoint(...coordinates).matrixTransform(node.getScreenCTM())
      return [point.x, point.y]
    }, [x, y])
    await page.mouse.click(...position)
  }
  await button('Grenze zeichnen').click()
  for (const corner of [[165, 165], [455, 165], [455, 455], [165, 455]]) await point(...corner)
  await svg.press('Enter')
  await button('Wegachse zeichnen').click()
  await point(205, 310)
  await point(415, 310)
  await svg.press('Enter')
  await button('Fläche auswählen').click()
  await point(230, 225)
  const field = await page.locator('#regions legend').textContent()
  await page.getByLabel('Objekttyp im Bestand').selectOption('bed')
  const title = 'Tokio Weltkarte ' + Date.now()
  await page.getByLabel('Gartenname').fill(title)
  await button('Beetplan').click()
  const areas = page.getByRole('combobox', {name: 'Grundfläche', exact: true})
  await areas.selectOption(field)
  await page.getByRole('combobox', {name: 'Kultur', exact: true}).selectOption('Tomate')
  await button('Belegung speichern').click()
  await page.getByText('Gespeichert · Tomate', {exact: true}).waitFor()
  await button('Saisonprojekte').click()
  const season = page.getByRole('dialog', {name: 'Saisonprojekte'})
  await season.getByLabel('Hauptjahr', {exact: true}).fill('2027')
  await button('Hauptjahr speichern', season).click()
  const day = page.getByLabel('Saisondatum', {exact: true})
  await day.fill('2027-01-07')
  await moon.getByText('Abnehmende Sichel', {exact: true}).waitFor()
  await page.getByRole('slider', {name: 'Saisonregler'}).press('ArrowRight')
  assert(await day.inputValue() === '2027-01-08', 'Datum wechselte nicht auf den 8. Januar')
  await moon.getByText('Neumond', {exact: true}).waitFor()
  assert((await moon.getAttribute('title')).includes('Asia/Tokyo'), 'Die Zeitzone des Polygons fehlt')
  const saved = () => page.evaluate(async name => {
    const {listProjects} = await import('/src/integrated-storage.js')
    return (await listProjects()).find(project => project.name === name)
  }, title)
  const before = await saved()
  assert(before.snapshot.garden === 'world' && before.snapshot.mapSection.name === 'Tokio' &&
    before.snapshot.net.regions.length === 2 && before.planning.cultures[field] === 'Tomate',
  'Weltkartenausschnitt, Fläche oder Kultur fehlt im Gartenstand')

  await button('Garten schließen').click()
  const library = page.getByRole('dialog', {name: 'Gespeicherte Gärten'})
  const row = library.locator('.project-row').filter({hasText: title})
  const downloaded = page.waitForEvent('download')
  await button('Sicherung herunterladen', row).click()
  const file = await downloaded
  await button(title, row).click()
  await day.fill('2027-01-08')
  await moon.getByText('Neumond', {exact: true}).waitFor()
  await areas.selectOption(field)
  assert(await page.getByRole('combobox', {name: 'Kultur', exact: true}).inputValue() === 'Tomate', 'Belegung fehlt nach Wiederöffnung')
  await button('Karte').click()
  await button('Weltkarte').click()
  const failingSearch = url => url.hostname === 'photon.komoot.io' && url.searchParams.get('q') === 'Ausfallprobe'
  await page.route(failingSearch, route => route.abort())
  await search.fill('Ausfallprobe')
  await button('Suchen', dialog).click()
  await dialog.getByText('Die Ortssuche ist derzeit nicht erreichbar. Die Karte bleibt verfügbar.', {exact: true}).waitFor()
  await button('Abbrechen', dialog).click()
  await page.unroute(failingSearch)
  assert(JSON.stringify(await saved()) === JSON.stringify(before), 'Kartendialog änderte den Gartenstand')
  assert(await page.locator('#garden').inputValue() === 'world', 'Abbruch wechselte die Karte')
  assert(errors.length === 0, errors.join(' / '))
  return {garden: title, field, geo: before.snapshot.georeference, timeZone: 'Asia/Tokyo',
    backup: file.suggestedFilename(), photonStatus: response.status()}
}
