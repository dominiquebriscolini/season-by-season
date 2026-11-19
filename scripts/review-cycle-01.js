async page => {
  const check = (condition, message) => { if (!condition) throw new Error(message) }
  const button = name => page.getByRole('button', {name, exact: true})
  const combo = name => page.getByRole('combobox', {name, exact: true})
  const status = text => page.locator('#project-status').filter({hasText: text}).waitFor()
  const saveState = text => page.locator('#save-state').filter({hasText: text}).waitFor()
  const point = async coordinates => page.mouse.click(...await page.locator('#map').evaluate((map, [x, y]) => {
    const screen = new DOMPoint(x, y).matrixTransform(map.getScreenCTM())
    return [screen.x, screen.y]
  }, coordinates))
  const name = 'Bagua Zyklus 01 ' + Date.now()
  const records = () => page.evaluate(async name => {
    const {listProjects, readProjectBackup} = await import('/src/integrated-storage.js')
    const head = (await listProjects()).find(project => project.name === name)
    return {head, backup: await readProjectBackup(head.id)}
  }, name)

  await page.setViewportSize({width: 1440, height: 900})
  await page.goto('http://127.0.0.1:5173/')
  await page.locator('#garden').selectOption('bagua')
  await page.getByText('Vorlagen', {exact: true}).click()
  await button('Sichtbares Bagua-Netz laden').click()
  await button('Fläche auswählen').click()
  await point([475, 270])
  const fieldId = await page.locator('#regions legend').textContent()
  await page.getByLabel('Objekttyp im Bestand').selectOption('bed')
  await page.getByLabel('Gartenname').fill(name)
  await button('Beetplan').click()
  await combo('Grundfläche').selectOption(fieldId)
  await page.getByLabel('Unterteilungen').fill('7')
  await button('Unterteilung übernehmen').click()
  await combo('Streifen').selectOption({label: 'Streifen 1'})
  for (const culture of ['Möhre', 'Bohne']) {
    await combo('Kultur').selectOption(culture)
    await button('Belegung speichern').click()
    await page.getByText('Gespeichert · ' + culture, {exact: true}).waitFor()
  }
  const before = await records()
  const stripId = fieldId + ':strip:1'
  check(before.backup.planning.cultures[stripId] === 'Möhre', 'Vorherige Kultur fehlt im Checkpoint')
  await button('Karte').click()
  await button('Beetplan').click()
  await combo('Grundfläche').waitFor()
  await button('Garten speichern').click()
  await status('Keine Änderungen zu speichern.')
  const after = await records()
  check(after.head.revision === before.head.revision && JSON.stringify(before.backup) === JSON.stringify(after.backup),
    'Navigation oder identisches Speichern hat den Checkpoint überschrieben')
  await button('Karte').click()
  await page.getByLabel('Gartenname').fill('Neuer Name im Entwurf')
  await saveState('Ungespeicherte Änderungen')
  await page.screenshot({path: 'evidence/cycle-01/after-save-status.png'})
  await page.getByLabel('Gartenname').fill(name)
  await saveState('Gespeicherter Stand')

  await page.evaluate(() => { window.confirm = () => true })
  await button('Garten schließen').click()
  await page.locator('.project-row').filter({has: button(name)}).getByRole('button', {name: 'Sicherung wiederherstellen'}).click()
  await combo('Grundfläche').selectOption(fieldId)
  await combo('Streifen').selectOption({label: 'Streifen 1'})
  check(await combo('Kultur').inputValue() === 'Möhre', 'Wiederherstellung konnte Möhre nicht öffnen')

  await button('Garten schließen').click()
  await button('Neuen Garten zeichnen').click()
  await page.locator('#garden').selectOption('tandel')
  await button('Grenze zeichnen').click()
  for (const xy of [[220, 220], [420, 220], [420, 420], [220, 420]]) await point(xy)
  await button('Zeichnung abschließen').click()
  await button('Wegachse zeichnen').click()
  await point([260, 320])
  await point([390, 320])
  const draft = await page.locator('#overlays polyline').last().getAttribute('points')
  for (const action of ['Wegachse zeichnen', 'Wegenetz zeichnen']) await button(action).click()
  await page.evaluate(() => { window.confirm = () => false })
  await button('Fläche auswählen').click()
  check(await page.locator('#overlays polyline').last().getAttribute('points') === draft, 'Kartenentwurf ging beim Abbruch verloren')
  await button('Garten speichern').click()
  await status('Schließe die aktive Zeichnung')
  await button('Zeichnung abschließen').click()
  check((await page.locator('#stats').textContent()).includes('2 Restflächen'), 'Entwurf war nach Abbruch nicht abschließbar')

  const dimensions = []
  for (const height of [600, 844]) {
    await page.setViewportSize({width: 390, height})
    const size = await page.evaluate(() => ({
      map: document.getElementById('map').clientHeight,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      settings: document.querySelector('#map-page aside').getBoundingClientRect().height,
    }))
    check(size.map >= 280 && size.overflow === 0 && size.settings >= 240, 'Kartenarbeitsplatz auf schmalem Bildschirm')
    dimensions.push(size)
    if (height === 600) {
      await button('Grundstück einpassen').click()
      await page.screenshot({path: 'evidence/cycle-01/after-compact.png'})
    }
  }
  return {unchangedRevision: after.head.revision, restored: 'Möhre', draftPreserved: true, dimensions}
}
