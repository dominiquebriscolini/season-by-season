async page => {
  const check = (ok, message) => { if (!ok) throw new Error(message) }
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const button = (name, tab = page) => tab.getByRole('button', {name, exact: true})
  const combo = (name, tab = page) => tab.getByRole('combobox', {name, exact: true})
  const title = 'Bagua Zyklus 06 ' + Date.now()
  const targetChoice = combo('Zielstreifen')
  const open = async tab => {
    await button('Gespeicherte Gärten', tab).click()
    await button(title, tab).click()
    await tab.locator('#project-status').filter({hasText: 'Gespeicherten Garten geöffnet.'}).waitFor()
  }
  await page.setViewportSize({width: 1440, height: 900})
  await page.goto('http://127.0.0.1:5173/')
  await page.locator('#garden').selectOption('bagua')
  await page.getByText('Vorlagen', {exact: true}).click()
  await button('Sichtbares Bagua-Netz laden').click()
  await button('Fläche auswählen').click()
  const xy = await page.locator('#map').evaluate(map => {
    const point = new DOMPoint(475, 270).matrixTransform(map.getScreenCTM())
    return [point.x, point.y]
  })
  await page.mouse.click(...xy)
  const field = await page.locator('#regions legend').textContent()
  const strip = index => field + ':strip:' + index
  const item = index => field + ' · Streifen ' + index
  await page.getByLabel('Objekttyp im Bestand').selectOption('bed')
  await page.getByLabel('Gartenname').fill(title)
  await button('Beetplan').click()
  await combo('Grundfläche').selectOption(field)
  await page.getByLabel('Unterteilungen').fill('7')
  await button('Unterteilung übernehmen').click()
  await combo('Streifen').selectOption(strip(1))
  await combo('Kultur').selectOption('Bohne')
  await page.getByLabel('Unterteilungen').fill('8')

  const other = await page.context().newPage()
  await other.goto(page.url())
  await open(other)
  await button('Karte', other).click()
  const width = other.getByLabel('Standardbreite (cm)')
  await width.fill('95')
  await width.press('Tab')
  await button('Beetplan', other).click()
  await combo('Grundfläche', other).selectOption(field)
  await combo('Streifen', other).selectOption(strip(2))
  await combo('Kultur', other).selectOption('Radieschen')
  await button('Belegung speichern', other).click()
  await other.getByText('Gespeichert · Radieschen', {exact: true}).waitFor()

  const records = () => page.evaluate(async name => {
    const {listProjects, readProjectBackup} = await import('/src/integrated-storage.js')
    const project = (await listProjects()).find(project => project.name === name)
    return [project, await readProjectBackup(project.id)]
  }, title)
  const before = await records()
  await page.reload()
  await targetChoice.waitFor()
  check(await targetChoice.inputValue() === '' && await button('Zuordnung übernehmen').isDisabled(),
    'Die Zuordnung hatte ein vorausgewähltes Ziel')
  check(await button('Kultur übernehmen').isDisabled(), 'Automatische Übernahme blieb freigegeben')
  await targetChoice.selectOption(strip(2))
  check(await button(item(2)).getAttribute('aria-pressed') === 'true', 'Zielstreifen fehlt in der Skizze')
  await page.evaluate(() => {
    window.confirm = message => { window.cycle06Prompt = message; return false }
  })
  await button('Zuordnung übernehmen').click()
  const prompt = await page.evaluate(() => window.cycle06Prompt)
  check(['Bohne', field, 'Streifen 2', 'Radieschen'].every(text => prompt.includes(text)),
    'Bestätigung nennt Kultur, Ziel oder bisherige Belegung nicht')
  check(await targetChoice.inputValue() === strip(2) && JSON.stringify(await records()) === JSON.stringify(before),
    'Abbruch veränderte Zielwahl, Garten oder Sicherung')
  await button(item(3)).press('Enter')
  check(await targetChoice.inputValue() === strip(3), 'Streifenwahl in der Skizze blieb wirkungslos')
  await button(item(2)).press('Enter')
  await page.evaluate(() => { window.confirm = () => true })
  await button('Zuordnung übernehmen').click()
  await page.getByText('Kultur zugeordnet.', {exact: true}).waitFor()

  const [after, backup] = await records()
  check(after.revision === before[0].revision + 1 && after.planning.cultures[strip(2)] === 'Bohne',
    'Bestätigte Kultur fehlt am Zielstreifen')
  const expectedPlanning = structuredClone(before[0].planning)
  expectedPlanning.cultures[strip(2)] = 'Bohne'
  check(JSON.stringify(after.planning) === JSON.stringify(expectedPlanning) &&
    JSON.stringify(after.snapshot) === JSON.stringify(before[0].snapshot) &&
    JSON.stringify(backup) === JSON.stringify(before[0]), 'Übernahme änderte mehr als die Zielbelegung')
  await page.reload()
  await page.getByRole('rowheader', {name: 'Unterteilung', exact: true}).waitFor()
  check(await page.getByRole('rowheader', {name: 'Kultur', exact: true}).count() === 0, 'Teilübernahme verlor den Restentwurf')
  await other.close()
  check(errors.length === 0, errors.join(' / '))
  return {source: strip(1), target: strip(2), revisionBefore: before[0].revision, revisionAfter: after.revision}
}
