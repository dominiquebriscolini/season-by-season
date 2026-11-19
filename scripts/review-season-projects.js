async page => {
  const check = (condition, message) => { if (!condition) throw new Error(message) }
  const button = (name, root = page) => root.getByRole('button', {name, exact: true})
  const combo = (name, root = page) => root.getByRole('combobox', {name, exact: true})
  const field = (name, root = page) => root.getByLabel(name, {exact: true})
  const count = field('Unterteilungen')
  const day = field('Saisondatum')
  const slider = page.getByRole('slider', {name: 'Saisonregler'})
  const moon = page.locator('.season-moon')
  const scene = page.getByRole('group', {name: 'Isometrischer Gartenplan'})
  const projects = page.getByRole('dialog', {name: 'Saisonprojekte'})
  const journal = page.getByRole('region', {name: 'Erntejournal'})
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.setDefaultTimeout(10_000)
  await page.setViewportSize({width: 1440, height: 960})
  await page.emulateMedia({reducedMotion: 'reduce'})
  await page.goto('http://127.0.0.1:5173/')
  const previous = 'Bagua Saison 2027'
  const current = 'Bagua Saison 2028'
  await page.locator('#garden').selectOption('bagua')
  await page.getByText('Vorlagen', {exact: true}).click()
  await button('Sichtbares Bagua-Netz laden').click()
  await button('Fläche auswählen').click()
  const position = await page.locator('#map').evaluate(map => {
    const point = new DOMPoint(475, 270).matrixTransform(map.getScreenCTM())
    return [point.x, point.y]
  })
  await page.mouse.click(...position)
  const id = await page.locator('#regions legend').textContent()
  const strip = id + ':strip:3'
  await page.getByLabel('Objekttyp im Bestand').selectOption('bed')
  await field('Gartenname').fill(previous)
  await button('Beetplan').click()
  await combo('Grundfläche').selectOption(id)
  await count.fill('5')
  await button('Unterteilung übernehmen').click()
  await page.getByText('Unterteilung gespeichert.', {exact: true}).waitFor()
  await combo('Streifen').selectOption(strip)
  await combo('Kultur').selectOption('Tomate')
  await button('Belegung speichern').click()
  await page.getByText('Gespeichert · Tomate', {exact: true}).waitFor()
  const planting = page.getByRole('dialog', {name: 'Anbaudaten'})
  await button('Anbaudaten').click()
  await field('Sorte', planting).fill('Bagua-Tomate')
  await combo('Anbauweise', planting).selectOption('transplant')
  await field('Pflanzdatum', planting).fill('2027-04-01')
  await field('Kulturdauer mindestens (Tage)', planting).fill('40')
  await field('Kulturdauer höchstens (Tage)', planting).fill('70')
  await button('Anbaudaten speichern', planting).click()
  await page.getByText('Anbaudaten gespeichert.', {exact: true}).waitFor()
  await button('Saisonprojekte').click()
  await field('Hauptjahr', projects).fill('2027')
  await button('Hauptjahr speichern', projects).click()
  await page.getByText('Hauptjahr 2027 gespeichert.', {exact: true}).waitFor()
  check(await day.getAttribute('min') === '2026-07-01' && await day.getAttribute('max') === '2028-06-30',
    'Falsche Grenzen für ein Hauptjahr')
  await day.fill('2027-03-30')
  await page.getByText('Vor Anbaubeginn', {exact: true}).waitFor()
  check(await page.locator(`[data-bed-id="${strip}"]`).evaluate(node => node.classList.contains('iso-before-start')),
    'Pflanzen vor geplantem Beginn sichtbar')
  await day.fill('2027-05-15')
  check(!await page.locator(`[data-bed-id="${strip}"]`).evaluate(node => node.classList.contains('iso-before-start')),
    'Pflanzen erscheinen nach geplantem Beginn nicht')

  async function book(date, amount, note) {
    await button('Ernte erfassen', journal).click()
    await field('Erntedatum', journal).fill(date)
    await field('Erntemenge', journal).fill(amount)
    await combo('Ernteeinheit', journal).selectOption('kg')
    await field('Erntenotiz (optional)', journal).fill(note)
    await button('Ernte speichern', journal).click()
    await journal.getByText(note, {exact: true}).waitFor()
  }
  await book('2027-05-10', '1.25', 'Erster Pflückgang')
  await book('2027-05-15', '0.75', 'Zweiter Pflückgang')
  await journal.getByText(/Für diese Belegung.*2 kg/).waitFor()

  const records = () => page.evaluate(async names => {
    const {listProjects} = await import('/src/integrated-storage.js')
    return (await listProjects()).filter(project => names.includes(project.name))
  }, [previous, current])
  const old = (await records()).find(record => record.name === previous)
  await button('Saisonprojekte').click()
  await button('Neues Saisonprojekt', projects).click()
  await field('Name des Saisonprojekts', projects).fill(current)
  await field('Hauptjahr des Saisonprojekts', projects).fill('2028')
  await combo('Vorjahresprojekt', projects).selectOption(old.id)
  await field('Aufteilung des Vorjahrs kopieren', projects).check()
  await button('Saisonprojekt anlegen', projects).click()
  await page.getByText(/Aufteilungen kopiert: 1\. Ausgelassen: 0\./).waitFor()
  check(await day.getAttribute('min') === '2026-07-01' && await day.getAttribute('max') === '2029-06-30',
    'Falsche Grenzen für zwei Hauptjahre')
  await combo('Grundfläche').selectOption(id)
  check(await count.inputValue() === '5', 'Aufteilung wurde im Folgeprojekt nicht übernommen')
  await count.fill('7')
  await button('Unterteilung übernehmen').click()
  await page.getByText('Unterteilung gespeichert.', {exact: true}).waitFor()
  await combo('Streifen').selectOption(strip)
  check(await combo('Kultur').inputValue() === '', 'Kultur wurde ins Folgeprojekt kopiert')
  const after = (await records()).find(record => record.name === current)
  check(Object.keys(after.planning.cultures).length === 0 && (after.planning.harvests?.length ?? 0) === 0 &&
    JSON.stringify(after.snapshot) === JSON.stringify(old.snapshot), 'Kopie hat falsche aktive Planung oder Geometrie')

  const camera = () => scene.evaluate(svg => {
    const {cameraZoom, cameraFocusX, cameraFocusY, cameraAngle} = svg.dataset
    const {width, height} = svg.getBoundingClientRect()
    return JSON.stringify({cameraZoom, cameraFocusX, cameraFocusY, cameraAngle, width, height,
      transform: svg.querySelector('[data-iso-world]').getAttribute('transform')})
  })
  async function moveCamera(direction, zoom, key) {
    await button(direction).click()
    await button(zoom).click()
    await button('Verschieben').click()
    await scene.press(key)
    await button('Verschieben').click()
  }
  const initialCamera = await camera()
  await moveCamera('Osten', 'Vergrößern', 'ArrowRight')
  await count.fill('8')
  const currentCamera = await camera()
  check(currentCamera !== initialCamera, 'Kameratest hat die Ansicht nicht verändert')
  await day.fill('2027-05-15')
  await page.getByRole('heading', {name: 'Anbaugeschichte'}).waitFor()
  check(await camera() === currentCamera, 'Kamera sprang beim Wechsel in den Rückblick')
  check(await button('Garten speichern').isDisabled() && !await button('Belegung speichern').isVisible() &&
    !await button('Ernte erfassen').isVisible(), 'Vorjahr war bearbeitbar')
  check(await combo('Streifen').locator('option').count() === 6, 'Alte Aufteilung hatte nicht fünf Streifen')
  await page.getByRole('heading', {name: 'Tomate · Bagua-Tomate'}).waitFor()
  await journal.getByText('Zweiter Pflückgang', {exact: true}).waitFor()
  await button('Einen Tag zurück').click()
  check(await day.inputValue() === '2027-05-14' && !await journal.getByText('Zweiter Pflückgang', {exact: true}).isVisible() &&
    await journal.getByText('Erster Pflückgang', {exact: true}).isVisible(), 'Ernteübersicht reagierte nicht auf den Tag')
  await moveCamera('Süden', 'Vergrößern', 'ArrowUp')
  const historicalCamera = await camera()
  check(historicalCamera !== currentCamera, 'Kameratest hat den Rückblick nicht verändert')
  await combo('Planansicht').selectOption('current')
  check(await camera() === historicalCamera, 'Aktueller Plan übernahm die zuletzt sichtbare Kamera nicht')
  check(await day.inputValue() === '2027-05-14' && await count.inputValue() === '8' &&
    await combo('Streifen').inputValue() === strip, 'Projektansicht hat aktuellen Entwurf oder Datum verloren')
  await count.fill('7')
  await combo('Planansicht').selectOption('auto')
  await day.fill('2028-02-28')
  await button('Einen Tag weiter').click()
  check(await day.inputValue() === '2028-02-29', 'Schalttag fehlt')
  await button('Abspielen').click()
  await page.waitForFunction(() => document.querySelector('.season-calendar input[type=date]').value >= '2028-03-01')
  await button('Pause').click()
  const final = await records()
  for (const project of [old, after]) {
    check(JSON.stringify(final.find(record => record.id === project.id)) === JSON.stringify(project),
      'Datumsansicht schrieb einen Gartenstand')
  }
  await day.fill('2027-05-15')
  await journal.getByText('Zweiter Pflückgang', {exact: true}).waitFor()
  check(await camera() === historicalCamera, 'Erneuter Wechsel setzte die Kamera zurück')

  for (const [date, phase] of [
    ['2027-04-06', 'Abnehmende Sichel'],
    ['2027-04-07', 'Neumond'],
    ['2027-04-13', 'Zunehmende Sichel'],
    ['2027-04-14', 'Erstes Viertel'],
    ['2027-02-20', 'Zunehmender Mond'],
    ['2027-02-21', 'Vollmond'],
    ['2027-05-13', 'Erstes Viertel'],
    ['2027-05-28', 'Letztes Viertel'],
    ['2028-01-05', 'Erstes Viertel'],
  ]) {
    await day.fill(date)
    await moon.getByText(phase, {exact: true}).waitFor()
  }
  await day.fill('2027-05-19')
  await slider.press('ArrowRight')
  check(await day.inputValue() === '2027-05-20', 'Regler änderte den Saisontag nicht')
  await moon.getByText('Vollmond', {exact: true}).waitFor()
  await day.fill('2027-05-19')
  await moon.getByText('Zunehmender Mond', {exact: true}).waitFor()
  await button('Abspielen').click()
  await moon.getByText('Vollmond', {exact: true}).waitFor()
  check(await day.inputValue() === '2027-05-20', 'Vollmond erschien am falschen Wiedergabetag')
  await moon.getByText('Abnehmender Mond', {exact: true}).waitFor()
  await button('Pause').click()
  check(await day.inputValue() === '2027-05-21', 'Abnehmender Mond erschien am falschen Wiedergabetag')
  await day.fill('2027-05-20')
  check(await camera() === historicalCamera, 'Mondphasenanzeige änderte den Bildausschnitt')
  check((await moon.getAttribute('title')).includes('Europe/Luxembourg'), 'Der Standort des Kartenprojekts fehlt')
  check(errors.length === 0, errors.join(' / '))
  return {id, historicalStrips: 5, currentStrips: 7, harvestedKg: 2, previous: old.revision, current: after.revision}
}
