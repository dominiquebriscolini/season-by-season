async page => {
  const check = (condition, message) => { if (!condition) throw new Error(message) }
  const button = (name, root = page) => root.getByRole('button', {name, exact: true})
  const combo = name => page.getByRole('combobox', {name, exact: true})
  const addCrop = page.getByText('Eigene Kultur hinzufügen', {exact: true})
  const cropName = page.getByRole('textbox', {name: 'Kulturname', exact: true})
  const dialog = page.getByRole('dialog', {name: 'Anbaudaten'})
  const field = name => dialog.getByLabel(name, {exact: true})
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.setDefaultTimeout(10_000)
  await page.setViewportSize({width: 1440, height: 960})
  await page.goto('http://127.0.0.1:5173/')

  async function createGarden(title) {
    await page.locator('#garden').selectOption('bagua')
    if (!await button('Sichtbares Bagua-Netz laden').isVisible()) {
      await page.getByText('Vorlagen', {exact: true}).click()
    }
    await button('Sichtbares Bagua-Netz laden').click()
    await button('Fläche auswählen').click()
    const position = await page.locator('#map').evaluate(map => {
      const point = new DOMPoint(475, 270).matrixTransform(map.getScreenCTM())
      return [point.x, point.y]
    })
    await page.mouse.click(...position)
    const id = await page.locator('#regions legend').textContent()
    await page.getByLabel('Objekttyp im Bestand').selectOption('bed')
    await page.getByLabel('Gartenname').fill(title)
    await button('Beetplan').click()
    await combo('Grundfläche').selectOption(id)
    await page.getByLabel('Unterteilungen', {exact: true}).fill('7')
    await button('Unterteilung übernehmen').click()
    const strip = id + ':strip:3'
    await combo('Streifen').selectOption(strip)
    return {id, strip}
  }

  async function savedGarden(title) {
    return page.evaluate(async name => {
      const {listProjects} = await import('/src/integrated-storage.js')
      return (await listProjects()).find(project => project.name === name)
    }, title)
  }

  async function createCrop(name) {
    if (!await cropName.isVisible()) await addCrop.click()
    await cropName.fill(name)
    await cropName.press('Enter')
  }

  const title = 'Bagua Kulturprüfung ' + Date.now()
  const {id, strip} = await createGarden(title)
  const cropSuffix = await combo('Kultur').locator('option[value="Roter Mangold"]').count() ? ` ${Date.now()}` : ''
  const crop = 'Roter Mangold' + cropSuffix
  await combo('Kultur').selectOption('Möhre')
  await button('Belegung speichern').click()
  await page.getByText('Gespeichert · Möhre', {exact: true}).waitFor()
  const before = await savedGarden(title)
  const cropCount = await combo('Kultur').locator('option').count()

  await createCrop('   ')
  await page.getByText(/Gib einen Kulturnamen/).waitFor()
  check(await combo('Kultur').locator('option').count() === cropCount, 'Leerraum erzeugte eine Kultur')
  await createCrop(' MOHRE ')
  await page.getByText('„Möhre“ ist bereits in der Bibliothek und wurde ausgewählt.', {exact: true}).waitFor()
  check(await combo('Kultur').locator('option').count() === cropCount, 'Katalogduplikat erzeugt')
  await createCrop(`  Roter   Mangold${cropSuffix}  `)
  check(await combo('Kultur').inputValue() === crop, 'Eigene Kultur wurde nicht sofort ausgewählt')
  check(JSON.stringify(await savedGarden(title)) === JSON.stringify(before), 'Das Anlegen änderte den Gartenstand')
  await createCrop('rOTER MÁNGOLD' + cropSuffix)
  await page.getByText(`„${crop}“ ist bereits in der Bibliothek und wurde ausgewählt.`, {exact: true}).waitFor()
  check(await combo('Kultur').locator('option').count() === cropCount + 1, 'Eigenes Duplikat erzeugt')

  await page.reload()
  await page.getByText('ISO-Entwurf wiederhergestellt.', {exact: true}).waitFor()
  check(await combo('Kultur').inputValue() === crop && await combo('Streifen').inputValue() === strip,
    'Eigene Kultur fehlt im wiederhergestellten Entwurf')
  await button('Belegung speichern').click()
  await page.getByText(`Gespeichert · ${crop}`, {exact: true}).waitFor()
  const saved = await savedGarden(title)
  check(saved.revision === before.revision + 1 && saved.planning.cultures[strip] === crop &&
    JSON.stringify(saved.snapshot) === JSON.stringify(before.snapshot), 'Belegung änderte Geometrie oder blieb ungespeichert')

  await button('Anbaudaten').click()
  check(await field('Reihenabstand (cm)').inputValue() === '' && await field('Keimrate (%)').inputValue() === '' &&
    await field('Ertrag je Pflanze').inputValue() === '', 'Eigene Kultur hat unbelegte Anbauwerte')
  await field('Sorte').fill('Rotstielige Gartensorte')
  await dialog.getByText('Sortenbibliothek', {exact: true}).click()
  await button('Eigene Sorte speichern', dialog).click()
  await dialog.getByText('Eigene Sorte gespeichert.', {exact: true}).waitFor()
  const downloading = page.waitForEvent('download')
  await button('Pflanzenbibliothek sichern', dialog).click()
  const backup = await downloading
  const chunks = []
  for await (const chunk of await backup.createReadStream()) chunks.push(chunk)
  const library = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  check(library.crops.includes(crop) && library.entries.some(entry => entry.crop === crop &&
    entry.name === 'Rotstielige Gartensorte'), 'Bibliothekssicherung enthält Kultur oder Sorte nicht')
  await button('Anbaudaten speichern', dialog).click()
  await page.getByText('Anbaudaten gespeichert.', {exact: true}).waitFor()
  const printing = page.waitForEvent('popup')
  await button('Anbauplan drucken').click()
  const plan = await printing
  const printRow = plan.getByRole('row').filter({hasText: `${id} · Streifen 3`})
  await printRow.getByRole('cell', {name: crop, exact: true}).waitFor()
  await printRow.getByRole('cell', {name: 'Rotstielige Gartensorte', exact: true}).waitFor()
  await plan.close()

  await button('Garten schließen').click()
  await button(title).click()
  await combo('Grundfläche').selectOption(id)
  await combo('Streifen').selectOption(strip)
  check(await combo('Kultur').inputValue() === crop, 'Gespeicherte eigene Kultur fehlt nach Wiederöffnung')
  await button('Garten schließen').click()
  await button('Neuen Garten zeichnen').click()
  const second = 'Bagua Kulturwiederverwendung ' + Date.now()
  await createGarden(second)
  await combo('Kultur').selectOption(crop)
  await button('Belegung speichern').click()
  await page.getByText(`Gespeichert · ${crop}`, {exact: true}).waitFor()
  check(Object.values((await savedGarden(second)).planning.cultures).includes(crop), 'Kultur fehlt im zweiten Garten')
  await addCrop.click()
  await cropName.waitFor()
  check(errors.length === 0, errors.join(' / '))
  return {crop, strip, firstRevision: saved.revision, second, backup: backup.suggestedFilename()}
}
