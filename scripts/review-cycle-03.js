async page => {
  const check = (test, message) => { if (!test) throw new Error(message) }
  const button = name => page.getByRole('button', {name, exact: true})
  const combo = name => page.getByRole('combobox', {name, exact: true})
  const field = combo('Grundfläche')
  const strip = combo('Streifen')
  const culture = combo('Kultur')
  const count = page.getByLabel('Unterteilungen')
  const direction = page.getByLabel('Winkel (°)', {exact: true})
  const fillAngle = async value => {
    if (!await direction.isEditable()) await button('Winkel ändern').click()
    await direction.fill(value)
  }
  const point = async xy => page.mouse.click(...await page.locator('#map').evaluate((map, point) => {
    const screen = new DOMPoint(...point).matrixTransform(map.getScreenCTM())
    return [screen.x, screen.y]
  }, xy))
  const roundTrip = async () => {
    await button('Karte').click()
    await button('Beetplan').click()
    await field.waitFor()
  }
  await page.setViewportSize({width: 1440, height: 900})
  await page.goto('http://127.0.0.1:5173/')
  await page.locator('#garden').selectOption('bagua')
  await page.getByText('Vorlagen', {exact: true}).click()
  await button('Sichtbares Bagua-Netz laden').click()
  await button('Fläche auswählen').click()
  await point([475, 270])
  const id = await page.locator('#regions legend').textContent()
  const type = page.getByLabel('Objekttyp im Bestand')
  await type.selectOption('bed')
  const name = 'Bagua Zyklus 03 ' + Date.now()
  await page.getByLabel('Gartenname').fill(name)
  await button('Beetplan').click()
  await field.selectOption(id)
  await fillAngle('90')
  await roundTrip()
  check(await direction.inputValue() === '90' && await count.inputValue() === '1', 'Richtung bei einem Streifen verloren')
  await fillAngle('0')
  await count.fill('7')
  await button('Unterteilung übernehmen').click()
  await strip.selectOption(id + ':strip:2')

  const data = () => page.evaluate(async name => {
    const {listProjects, readProjectBackup} = await import('/src/integrated-storage.js')
    const project = (await listProjects()).find(project => project.name === name)
    return [project, await readProjectBackup(project.id)]
  }, name)
  const stored = await data()
  await page.evaluate(() => {
    window.confirmations = 0
    window.confirm = () => { window.confirmations++; return false }
  })
  const confirmations = () => page.evaluate(() => window.confirmations)
  await count.fill('8')
  await fillAngle('90')
  await culture.selectOption('Bohne')
  await roundTrip()
  await roundTrip()
  const valuesRetained = async () => (await field.inputValue()) === id &&
    (await strip.inputValue()) === id + ':strip:2' && (await count.inputValue()) === '8' &&
    (await direction.inputValue()) === '90' && (await culture.inputValue()) === 'Bohne'
  check(await valuesRetained(), 'Karte ↔ Beetplan verlor Eingaben oder Auswahl')
  check(JSON.stringify(stored) === JSON.stringify(await data()) && await confirmations() === 0,
    'Ansichtswechsel speicherte Daten oder löste eine Rückfrage aus')

  await strip.focus()
  await page.keyboard.press('ArrowDown')
  check(await valuesRetained() && await strip.evaluate(element => document.activeElement === element),
    'Abbruch verlor Streifen, Fokus oder Eingaben')
  // Vorschaupolygone bieten keine Auswahl. Für den Skizzentest ist die bestätigte Teilung sichtbar.
  await count.fill('7')
  await fillAngle('0')
  await button(id + ' · Streifen 2').press('Enter')
  check(await confirmations() === 1, 'Erneute Auswahl desselben Streifens fragte nach')
  await button(id + ' · Streifen 3').press('Enter')
  check(await strip.inputValue() === id + ':strip:2' && await culture.inputValue() === 'Bohne',
    'Abgebrochene Skizzenauswahl verlor die offene Kultur')
  await count.fill('8')
  await fillAngle('90')
  const other = await field.locator('option').evaluateAll((options, id) => options.find(option => option.value && option.value !== id).value, id)
  await field.selectOption(other)
  check(await confirmations() === 3 && await valuesRetained(), 'Abbruch in Skizze oder Grundflächenliste verlor den Entwurf')
  await button('Karte').click()
  await button('Garten schließen').click()
  check(await confirmations() === 4 && await page.locator('#map-page').isVisible(), 'Kartenansicht schützte den ISO-Entwurf beim Schließen nicht')

  await button('Fläche auswählen').click()
  await point([475, 270])
  await type.selectOption('free')
  await button('Beetplan').click()
  await page.getByText('Der Entwurf für ' + id + ' kann auf der aktuellen Geometrie nicht angewendet werden.').waitFor()
  check(await page.getByText('Kultur · Bohne', {exact: true}).isVisible(), 'Nicht verfügbarer Entwurf nicht angezeigt')
  await button('Karte').click()
  await button('Fläche auswählen').click()
  await point([475, 270])
  await type.selectOption('bed')
  await button('Beetplan').click()
  check(await valuesRetained(), 'Wieder verfügbare Fläche verlor den Entwurf')

  await page.evaluate(() => { window.confirm = () => { window.confirmations++; return true } })
  await strip.selectOption(id + ':strip:3')
  check(await strip.inputValue() === id + ':strip:3' && await count.inputValue() === '7' &&
    await culture.inputValue() === '', 'Bestätigter Wechsel verwarf den vorherigen Entwurf nicht')
  return {roundTrips: 3, selectionProtected: true, unavailableTargetRecovered: true, originalRevision: stored[0].revision}
}
