async page => {
  const check = (condition, message) => { if (!condition) throw new Error(message) }
  const button = name => page.getByRole('button', {name, exact: true})
  const combo = name => page.getByRole('combobox', {name, exact: true})
  const focused = control => control.evaluate(element => document.activeElement === element)
  const dialog = page.getByRole('dialog', {name: 'Gespeicherte Gärten'})
  const point = async coordinates => page.mouse.click(...await page.locator('#map').evaluate((map, [x, y]) => {
    const screen = new DOMPoint(x, y).matrixTransform(map.getScreenCTM())
    return [screen.x, screen.y]
  }, coordinates))

  await page.setViewportSize({width: 1440, height: 900})
  await page.goto('http://127.0.0.1:5173/')
  await page.locator('#garden').selectOption('bagua')
  await page.getByText('Vorlagen', {exact: true}).click()
  await button('Sichtbares Bagua-Netz laden').click()
  await button('Fläche auswählen').click()
  await point([475, 270])
  const fieldId = await page.locator('#regions legend').textContent()
  await page.getByLabel('Objekttyp im Bestand').selectOption('bed')
  const name = 'Bagua Zyklus 02 ' + Date.now()
  await page.getByLabel('Gartenname').fill(name)
  await button('Beetplan').click()

  const fields = combo('Grundfläche')
  await fields.focus()
  for (let index = 1; index <= 2; index++) {
    await page.keyboard.press('ArrowDown')
    check(await focused(fields), 'Grundfläche verlor den Fokus')
    check(await fields.evaluate(element => element.selectedIndex) === index, 'Grundflächenwahl sprang')
  }
  await fields.selectOption(fieldId)
  await page.getByLabel('Unterteilungen').fill('7')
  await button('Unterteilung übernehmen').click()
  const strips = combo('Streifen')
  await strips.focus()
  for (let index = 1; index <= 2; index++) {
    await page.keyboard.press('ArrowDown')
    check(await focused(strips), 'Streifenauswahl verlor den Fokus')
    check(await strips.evaluate(element => element.selectedIndex) === index, 'Streifenauswahl sprang')
  }
  await page.keyboard.press('Tab')
  check(await focused(combo('Kultur')), 'Tab führte nicht zur Kultur')
  await combo('Kultur').selectOption('Möhre')

  const secondName = name + ' · zweiter Garten'
  const before = await page.evaluate(async ({name, secondName}) => {
    const {listProjects, saveProject} = await import('/src/integrated-storage.js')
    const garden = (await listProjects()).find(record => record.name === name)
    await saveProject({...garden, id: crypto.randomUUID(), name: secondName}, null)
    return garden
  }, {name, secondName})
  const confirmCount = () => page.evaluate(() => window.cycleConfirmCount)
  await page.evaluate(() => {
    window.cycleConfirmCount = 0
    window.confirm = () => { window.cycleConfirmCount++; return false }
  })
  await button('Gespeicherte Gärten').click()
  await dialog.waitFor()
  await page.keyboard.press('Escape')
  await dialog.waitFor({state: 'hidden'})
  check(await focused(button('Gespeicherte Gärten')), 'Escape gab den Fokus nicht zurück')
  check(await strips.inputValue() === fieldId + ':strip:2' && await combo('Kultur').inputValue() === 'Möhre',
    'ISO-Auswahl oder Formularwert ging verloren')
  check(await confirmCount() === 0, 'Ansicht der gespeicherten Gärten fragte nach Verwerfen')
  await button('Gespeicherte Gärten').click()
  await button(secondName).click()
  check(await confirmCount() === 1 && await dialog.isVisible(), 'Ungespeicherter ISO-Wert löste keine Verwerfen-Rückfrage aus')
  await button('Zurück zum Garten').click()
  check(await combo('Kultur').inputValue() === 'Möhre', 'Abgebrochener Wechsel verwarf den ISO-Wert')

  await button('Karte').click()
  await button('Wegachse zeichnen').click()
  await point([457, 253])
  await point([469, 255])
  const draft = await page.locator('#overlays polyline').last().getAttribute('points')
  await button('Gespeicherte Gärten').click()
  await button(secondName).click()
  check(await confirmCount() === 2 && await dialog.isVisible(), 'Wechselabbruch verließ die Bibliothek')
  await page.keyboard.press('Escape')
  await dialog.waitFor({state: 'hidden'})
  check(await page.locator('#overlays polyline').last().getAttribute('points') === draft, 'Escape verwarf den Kartenentwurf')
  const after = await page.evaluate(async id => (await (await import('/src/integrated-storage.js')).readProject(id)), before.id)
  check(JSON.stringify(before) === JSON.stringify(after), 'Bibliothek änderte den gespeicherten Garten')

  await button('Gespeicherte Gärten').click()
  await page.evaluate(() => { window.confirm = () => true })
  await button(secondName).click()
  await dialog.waitFor({state: 'hidden'})
  check(await page.getByLabel('Gartenname').inputValue() === secondName, 'Bestätigter Wechsel öffnete den Garten nicht')
  return {keyboardFieldAndStrip: true, isoFormRetained: true, draftRetained: true, unchangedRevision: before.revision}
}
