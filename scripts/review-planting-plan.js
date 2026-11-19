async page => {
  const check = (ok, message) => { if (!ok) throw new Error(message) }
  const button = (name, root = page) => root.getByRole('button', {name, exact: true})
  const combo = (name, root = page) => root.getByRole('combobox', {name, exact: true})
  const dialog = page.getByRole('dialog', {name: 'Anbaudaten'})
  const title = 'Bagua Anbau ' + Date.now()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.setViewportSize({width: 1440, height: 900})
  await page.goto('http://127.0.0.1:5173/')
  await page.locator('#garden').selectOption('bagua')
  await page.getByText('Vorlagen', {exact: true}).click()
  await button('Sichtbares Bagua-Netz laden').click()
  await button('Fläche auswählen').click()
  const point = await page.locator('#map').evaluate(map => {
    const p = new DOMPoint(475, 270).matrixTransform(map.getScreenCTM())
    return [p.x, p.y]
  })
  await page.mouse.click(...point)
  const id = await page.locator('#regions legend').textContent()
  await page.getByLabel('Objekttyp im Bestand').selectOption('bed')
  await page.getByLabel('Gartenname').fill(title)
  await button('Beetplan').click()
  await combo('Grundfläche').selectOption(id)
  await page.getByLabel('Unterteilungen', {exact:true}).fill('7')
  await button('Unterteilung übernehmen').click()
  const strip = id + ':strip:3'
  await combo('Streifen').selectOption(strip)
  await combo('Kultur').selectOption('Möhre')
  await button('Belegung speichern').click()
  await button('Anbaudaten').click()
  const fill = (label, value) => dialog.getByLabel(label, {exact: true}).fill(value)
  await fill('Sorte', 'Testmöhre')
  await fill('Aussaatdatum', '2028-04-01')
  await fill('Reihenabstand (cm)', '25')
  await fill('Abstand in der Reihe (cm)', '10')
  await fill('Kulturdauer mindestens (Tage)', '90')
  await fill('Kulturdauer höchstens (Tage)', '110')
  await fill('Keimrate (%)', '80')
  const result = label => dialog.getByText(label, {exact: true}).locator('xpath=following-sibling::dd[1]').textContent()
  check(await result('Erwarteter Ertrag') === 'Noch offen', 'Fehlender Ertrag nicht kenntlich')
  const plants = value => Number(value.replace(/\./g, ''))
  const initial = plants(await result('Pflanzen'))
  await fill('Abstand in der Reihe (cm)', '12.5')
  check(plants(await result('Pflanzen')) < initial, 'Pflanzenzahl reagierte nicht auf Abstand')
  await fill('Abstand in der Reihe (cm)', '10')
  await fill('Ertrag je Pflanze', '0.02')
  check((await result('Erntefenster')).includes('30.6.2028') && (await result('Erntefenster')).includes('20.7.2028'), 'Erntefenster falsch')
  check(plants((await result('Saatgutbedarf')).split(' ')[0]) === Math.ceil(initial / .8), 'Saatgutbedarf falsch')
  const expectedYield = await result('Erwarteter Ertrag')
  await button('Anbaudaten speichern', dialog).click()
  await page.getByText('Anbaudaten gespeichert.', {exact: true}).waitFor()
  await button('Garten schließen').click()
  await button(title).click()
  await combo('Grundfläche').selectOption(id)
  await combo('Streifen').selectOption(strip)
  await button('Anbaudaten').click()
  check(await dialog.getByLabel('Sorte', {exact: true}).inputValue() === 'Testmöhre' &&
    plants(await result('Pflanzen')) === initial && await result('Erwarteter Ertrag') === expectedYield, 'Wiederöffnung verlor Anbaudaten')
  await button('Abbrechen', dialog).click()

  const previewing = page.waitForEvent('popup')
  await button('Anbauplan drucken').click()
  const popup = await previewing
  await popup.getByRole('heading', {name: 'Anbauübersicht'}).waitFor()
  const label = id + ' · Streifen 3'
  const printRow = popup.getByRole('row').filter({hasText: label})
  check((await printRow.textContent()).includes('Testmöhre'), 'Druck enthält die Sorte nicht')
  check(await printRow.getByRole('cell', {name: expectedYield, exact: true}).isVisible(), 'Druck und Beet zeigen anderen Ertrag')
  await popup.close()

  const downloading = page.waitForEvent('download')
  await button('Excel herunterladen').click()
  const download = await downloading
  const chunks = []
  for await (const chunk of await download.createReadStream()) chunks.push(chunk)
  const parsed = await page.evaluate(async (bytes) => {
    const resource = performance.getEntriesByType('resource').find(entry => /exceljs(?:\.js)/.test(entry.name))
    const {default: ExcelJS} = await import(resource.name)
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(Uint8Array.from(bytes))
    const sheet = workbook.getWorksheet('Anbau')
    return {table: Boolean(sheet.getTable('Anbaudaten')), strip: sheet.getCell('A5').value,
      variety: sheet.getCell('C5').value, plants: sheet.getCell('L5').value,
      seeds: workbook.getWorksheet('Einkauf').getCell('C5').value,
      image: workbook.getWorksheet('Plan').getImages().length}
  }, Array.from(Buffer.concat(chunks)))
  check(parsed.table && parsed.strip === label && parsed.variety === 'Testmöhre' && parsed.plants === initial &&
    parsed.seeds === Math.ceil(initial / .8) && parsed.image === 1, 'XLSX weicht vom Anbauplan ab')

  page.once('dialog', prompt => prompt.dismiss())
  await button('Belegung entfernen').click()
  check(await combo('Kultur').inputValue() === 'Möhre', 'Abbruch entfernte die Belegung')
  page.once('dialog', prompt => prompt.accept())
  await button('Belegung entfernen').click()
  await page.getByText('Belegung entfernt. Frühere Angaben stehen in der Prüfliste.', {exact: true}).waitFor()
  check(await combo('Kultur').inputValue() === '' && await page.getByText(/Testmöhre · Direktsaat/).isVisible(),
    'Belegung wurde nicht geleert oder die früheren Anbaudaten gingen verloren')
  await button('Garten schließen').click()
  await button(title).click()
  await combo('Grundfläche').selectOption(id)
  await combo('Streifen').selectOption(strip)
  check(await combo('Kultur').inputValue() === '' && await page.getByText(/Testmöhre · Direktsaat/).isVisible(),
    'Leerer Streifen oder archivierte Anbaudaten fehlen nach Wiederöffnung')
  check(errors.length === 0, errors.join(' / '))
  return {strip, plants: initial, seeds: parsed.seeds, expectedYield, xlsx: download.suggestedFilename()}
}
