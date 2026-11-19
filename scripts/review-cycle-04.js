async page => {
  const check = (test, message) => { if (!test) throw new Error(message) }
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const button = name => page.getByRole('button', {name, exact: true})
  const combo = name => page.getByRole('combobox', {name, exact: true})
  const count = page.getByLabel('Unterteilungen')
  const status = text => page.locator('#project-status').filter({hasText: text}).waitFor()
  const name = 'Bagua Zyklus 04 ' + Date.now()
  await page.setViewportSize({width: 1440, height: 900})
  await page.goto('http://127.0.0.1:5173/')
  await page.locator('#garden').selectOption('bagua')
  await page.getByText('Vorlagen', {exact: true}).click()
  await button('Sichtbares Bagua-Netz laden').click()
  await button('Fläche auswählen').click()
  const screen = await page.locator('#map').evaluate(map => {
    const point = new DOMPoint(475, 270).matrixTransform(map.getScreenCTM())
    return [point.x, point.y]
  })
  await page.mouse.click(...screen)
  const id = await page.locator('#regions legend').textContent()
  await page.getByLabel('Objekttyp im Bestand').selectOption('bed')
  await page.getByLabel('Gartenname').fill(name)
  await button('Beetplan').click()
  await combo('Grundfläche').selectOption(id)
  await count.fill('7')
  await button('Unterteilung übernehmen').click()
  await combo('Streifen').selectOption(id + ':strip:2')
  const records = () => page.evaluate(async name => {
    const {listProjects, readProjectBackup} = await import('/src/integrated-storage.js')
    const project = (await listProjects()).find(project => project.name === name)
    return [project, await readProjectBackup(project.id)]
  }, name)
  const before = await records()
  await count.fill('8')
  await button('Winkel ändern').click()
  await page.getByLabel('Winkel (°)', {exact: true}).fill('90')
  await combo('Kultur').selectOption('Bohne')
  const restore = async () => {
    await page.reload()
    await status('ISO-Entwurf wiederhergestellt.')
    check(await combo('Grundfläche').inputValue() === id && await combo('Streifen').inputValue() === id + ':strip:2',
      'Falsches Ziel nach Neuladen')
    check(await count.inputValue() === '8' && await page.getByLabel('Winkel (°)', {exact: true}).inputValue() === '90' &&
      await combo('Kultur').inputValue() === 'Bohne', 'ISO-Entwurf nach Neuladen unvollständig')
  }
  await restore()
  await button('Karte').click()
  await restore()
  check(JSON.stringify(await records()) === JSON.stringify(before), 'Neuladen schrieb Garten oder Sicherung')

  await button('Belegung speichern').click()
  await page.getByText('Gespeichert · Bohne', {exact: true}).waitFor()
  const partiallySaved = await records()
  check(partiallySaved[0].revision === before[0].revision + 1, 'Explizite Speicherung fehlt')
  await restore()
  await button('Karte').click()
  await page.evaluate(() => { window.confirm = () => true })
  await button('Garten schließen').click()
  await page.getByRole('dialog', {name: 'Gespeicherte Gärten'}).waitFor()
  await page.reload()
  await page.locator('#garden').waitFor()
  check(await page.locator('#map-page').isVisible() && !await page.locator('#iso-page').isVisible(),
    'Verworfener Entwurf wurde nochmals geöffnet')
  check(JSON.stringify(await records()) === JSON.stringify(partiallySaved), 'Verwerfen schrieb Garten oder Sicherung')

  await button('Gespeicherte Gärten').click()
  await button(name).click()
  await combo('Grundfläche').selectOption(id)
  await combo('Streifen').selectOption(id + ':strip:2')
  await combo('Kultur').selectOption('Tomate')
  const other = await page.context().newPage()
  await other.goto(page.url())
  check(await other.locator('#map-page').isVisible(), 'Unabhängiger Tab öffnete den Entwurf')
  await other.evaluate(async ({projectId, stripId}) => {
    const {readProject, saveProject} = await import('/src/integrated-storage.js')
    const project = await readProject(projectId)
    project.planning.cultures[stripId] = 'Radieschen'
    await saveProject(project, project.revision)
  }, {projectId: before[0].id, stripId: id + ':strip:2'})
  await other.close()
  const concurrent = await records()
  await page.reload()
  await page.getByText('bleibt zur Prüfung sichtbar.', {exact: false}).waitFor()
  check(await page.getByRole('table', {name: 'Vergleich des ISO-Entwurfs'}).getByRole('cell', {name: 'Tomate', exact: true}).isVisible() &&
    !await button('Belegung speichern').isVisible(), 'Älterer Entwurf wurde ohne Vergleich in den normalen Editor übernommen')
  check(JSON.stringify(await records()) === JSON.stringify(concurrent), 'Konflikt schrieb Garten oder Sicherung')
  check(errors.length === 0, errors.join(' / '))
  return {preservedRevision: before[0].revision, partialSaveRevision: partiallySaved[0].revision,
    discardedDraftGone: true, concurrentRevision: concurrent[0].revision}
}
