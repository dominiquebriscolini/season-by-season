async page => {
  const check = (condition, message) => { if (!condition) throw new Error(message) }
  const button = (name, root = page) => root.getByRole('button', {name, exact: true})
  const dialog = page.getByRole('dialog', {name: 'Anbaudaten'})
  const library = dialog.locator('.variety-library').filter({hasText: 'Sortenbibliothek'})
  const field = name => dialog.getByLabel(name, {exact: true})
  const combo = (name, root = page) => root.getByRole('combobox', {name, exact: true})
  const picker = combo('Sorte aus Bibliothek', dialog)
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.setDefaultTimeout(10_000)
  await page.setViewportSize({width: 1440, height: 900})
  await page.goto('http://127.0.0.1:5173/')

  async function createBagua(title) {
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
    await page.getByLabel('Unterteilungen', {exact: true}).fill('7')
    await button('Unterteilung übernehmen').click()
    const strip = id + ':strip:3'
    await combo('Streifen').selectOption(strip)
    await combo('Kultur').selectOption('Möhre')
    await button('Belegung speichern').click()
    await button('Anbaudaten').click()
    await library.locator('summary').click()
    return {id, strip}
  }

  const title = 'Bagua Sortenprüfung ' + Date.now()
  const {id, strip} = await createBagua(title)
  await field('Sorten suchen').fill('mÍsO')
  await picker.locator('option').filter({hasText: /^Miso SG$/}).waitFor({state: 'attached'})
  check(await picker.locator('option').count() === 2, 'Akzentunabhängige Suche fehlgeschlagen')
  await picker.selectOption({label: 'Miso SG'})
  const source = await library.getByRole('link', {name: /Sativa · Miso SG/}).getAttribute('href')
  check(source === 'https://www.sativa.bio/de/miso-sg-karotte-ka16', 'Quellenlink falsch')
  check((await library.textContent()).includes('25–35 cm') && (await library.textContent()).includes('1,5 cm'), 'Richtwert ohne Kontext')
  await button('Sorte auswählen', library).click()
  check(await field('Sorte').inputValue() === 'Miso SG' && await field('Reihenabstand (cm)').inputValue() === '', 'Namenswahl änderte Anbauwerte')

  await field('Reihenabstand (cm)').fill('42')
  await field('Keimrate (%)').fill('80')
  await field('Aussaatdatum').fill('2028-04-01')
  let warning
  page.once('dialog', async prompt => { warning = prompt.message(); await prompt.dismiss() })
  await button('Richtwerte übernehmen', library).click()
  check(warning?.includes('abweichende Angaben') && await field('Reihenabstand (cm)').inputValue() === '42', 'Abbruch der Übernahme veränderte Eingaben')
  page.once('dialog', prompt => prompt.accept())
  await button('Richtwerte übernehmen', library).click()
  check(await field('Reihenabstand (cm)').inputValue() === '30' &&
    await field('Abstand in der Reihe (cm)').inputValue() === '1.5' &&
    await field('Kulturdauer mindestens (Tage)').inputValue() === '100' &&
    await field('Kulturdauer höchstens (Tage)').inputValue() === '100' &&
    await field('Keimrate (%)').inputValue() === '80' &&
    await field('Aussaatdatum').inputValue() === '2028-04-01', 'Übernahme überschreibt unbelegte Felder oder liefert falsche Werte')
  await field('Reihenabstand (cm)').fill('32')
  await dialog.getByText('Reihenabstand · 30 cm · abweichend im Formular', {exact: true}).waitFor()
  await button('Anbaudaten speichern', dialog).click()
  await page.getByText('Anbaudaten gespeichert.', {exact: true}).waitFor()
  await button('Garten schließen').click()
  await page.reload()
  await button('Gespeicherte Gärten').click()
  await button(title).click()
  await page.getByText('Gespeicherten Garten geöffnet.', {exact: true}).waitFor()
  await combo('Grundfläche').selectOption(id)
  await combo('Streifen').selectOption(strip)
  await button('Anbaudaten').click()
  await dialog.getByText('Übernommene Richtwerte · Miso SG', {exact: true}).waitFor()
  check(await field('Sorte').inputValue() === 'Miso SG' && await field('Reihenabstand (cm)').inputValue() === '32', 'Wiederöffnung verlor Sorte oder eigene Änderung')

  const ownName = 'Gartenmöhre ' + Date.now()
  await field('Sorte').fill(ownName)
  await library.locator('summary').click()
  await field('Herkunft der eigenen Angaben (optional)').fill('Saatguttüte aus dem Testgarten')
  await button('Eigene Sorte speichern', library).click()
  await library.getByText('Eigene Sorte gespeichert.', {exact: true}).waitFor()
  check((await picker.locator('option:checked').textContent()).startsWith(ownName), 'Eigene Sorte ist nicht ausgewählt')
  const pendingBackup = page.waitForEvent('download')
  await button('Pflanzenbibliothek sichern', library).click()
  const backup = await pendingBackup
  const chunks = []
  for await (const chunk of await backup.createReadStream()) chunks.push(chunk)
  const bytes = Buffer.concat(chunks)
  const profile = JSON.parse(bytes.toString('utf8')).entries.find(entry => entry.name === ownName)
  check(profile.values.rowSpacingCm === 32 && !Object.hasOwn(profile.values, 'start'), 'Sortensicherung enthält falsche Werte oder ein Beetdatum')
  await button('Abbrechen', dialog).click()
  await button('Anbaudaten').click()
  check(await field('Sorte').inputValue() === 'Miso SG', 'Eigene Sorte veränderte ungefragt die gespeicherten Anbaudaten')
  await button('Abbrechen', dialog).click()
  await button('Garten schließen').click()

  await page.reload()
  await createBagua('Bagua Sortennutzung ' + Date.now())
  await field('Sorten suchen').fill(ownName)
  const ownOption = {label: ownName + ' · eigene Sorte'}
  await picker.selectOption(ownOption)
  await library.getByText(/Saatguttüte aus dem Testgarten/).waitFor()
  await button('Richtwerte übernehmen', library).click()
  check(await field('Sorte').inputValue() === ownName && await field('Reihenabstand (cm)').inputValue() === '32' &&
    await field('Aussaatdatum').inputValue() === '', 'Eigene Sorte ließ sich im zweiten Garten nicht korrekt übernehmen')
  await field('Bibliothekssicherung laden').setInputFiles({name: backup.suggestedFilename(), mimeType: 'application/json', buffer: bytes})
  await library.getByText(/Sorten neu übernommen: 0\. Übersprungen: \d+\./).waitFor()
  await button('Abbrechen', dialog).click()
  await button('Anbaudaten').click()
  await field('Sorten suchen').fill('miso')
  await picker.selectOption({label: 'Miso SG'})
  await dialog.evaluate(element => { element.scrollTop = 0 })
  check(errors.length === 0, errors.join(' / '))
  return {strip, source, rowSpacingCm: 32, ownName, backup: backup.suggestedFilename(), errors}
}
