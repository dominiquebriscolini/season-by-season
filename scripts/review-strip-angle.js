async page => {
  const check = (ok, message) => { if (!ok) throw new Error(message) }
  const button = name => page.getByRole('button', {name, exact: true})
  const combo = name => page.getByRole('combobox', {name, exact: true})
  const angle = page.getByLabel('Winkel (°)', {exact: true})
  const fillAngle = async value => {
    if (!await angle.isEditable()) await button('Winkel ändern').click()
    await angle.fill(value)
  }
  const count = page.getByLabel('Unterteilungen')
  const preview = page.locator('[data-strip-preview]')
  const handle = page.getByRole('slider', {name: 'Streifenrichtung drehen'})
  const name = 'Bagua Winkel ' + Date.now()
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
  const field = await page.locator('#regions legend').textContent()
  await page.getByLabel('Objekttyp im Bestand').selectOption('bed')
  await page.getByLabel('Gartenname').fill(name)
  await button('Beetplan').click()
  await combo('Grundfläche').selectOption(field)
  check(!await angle.isEditable() && !await handle.isVisible(), 'Winkelbearbeitung war ohne ausdrückliche Auswahl aktiv')
  const width = page.getByLabel('Breite je Unterteilung')
  check(await page.locator('.iso-subdivision-count').evaluate(row => {
    const [count, width] = Array.from(row.children, child => child.getBoundingClientRect())
    return width.left >= count.right
  }), 'Breite steht nicht neben der Anzahl')
  const widthValue = async () => Number.parseFloat((await width.textContent()).replace(',', '.'))
  const desiredWidth = page.getByLabel('Wunschbreite (m)', {exact: true})
  await desiredWidth.fill('2')
  check(await count.inputValue() === '7' && Math.abs(await widthValue() - 2) < .10 &&
    await preview.locator('path').count() === 7, 'Wunschbreite berechnete Anzahl oder Vorschau falsch')
  await desiredWidth.fill('0')
  check(await count.inputValue() === '7' && !await desiredWidth.evaluate(input => input.validity.valid),
    'Ungültige Wunschbreite veränderte die Anzahl')
  await count.fill('7')
  const seven = await widthValue()
  await count.fill('14')
  check(Math.abs(seven - 2 * await widthValue()) < .025, 'Unterteilungsbreite folgt nicht der Anzahl')
  await count.fill('7')
  const stored = () => page.evaluate(async name => {
    const {listProjects, readProjectBackup} = await import('/src/integrated-storage.js')
    const record = (await listProjects()).find(project => project.name === name)
    return [record, await readProjectBackup(record.id)]
  }, name)
  const initial = await stored()
  await fillAngle('37.25')
  check(await preview.locator('path').count() === 7, 'Numerische Eingabe zeigte keine sieben Streifen')
  check(await handle.isVisible(), 'Winkel ändern zeigte keinen Drehgriff')
  await button('Winkel fertig').click()
  check(!await angle.isEditable() && !await handle.isVisible() &&
    await angle.inputValue() === '37.25' && await preview.locator('path').count() === 7, 'Winkel fertig verlor die Vorschau')
  await button('Winkel ändern').click()
  const center = async locator => {
    const box = await locator.boundingBox()
    return [box.x + box.width / 2, box.y + box.height / 2]
  }
  const pivot = await center(page.locator('[data-strip-angle-pivot]'))
  const drag = async (offset, shift) => {
    if (shift) await page.keyboard.down('Shift')
    await page.mouse.move(...await center(handle))
    await page.mouse.down()
    await page.mouse.move(pivot[0] + offset[0], pivot[1] + offset[1], {steps: 4})
    await page.mouse.up()
    if (shift) await page.keyboard.up('Shift')
    return Number(await angle.inputValue())
  }
  const free = await drag([38, -37], false)
  const snapped = await drag([66, 11], true)
  check(Math.abs(free % 15) > .01 && snapped % 15 === 0, 'Freies Ziehen oder Rastung fehlerhaft')
  check(JSON.stringify(await stored()) === JSON.stringify(initial), 'Vorschau schrieb Garten oder Sicherung')
  await fillAngle('360')
  await button('Unterteilung übernehmen').click()
  await combo('Streifen').selectOption(field + ':strip:3')
  check((await stored())[0].planning.splits[field].angle === 0, '360° wurden nicht als 0° gespeichert')
  await combo('Kultur').selectOption('Bohne')
  await button('Belegung speichern').click()
  await page.getByText('Gespeichert · Bohne', {exact: true}).waitFor()
  const crop = field + ':strip:3'
  await page.evaluate(() => {
    window.angleConfirmations = []
    window.confirm = message => { window.angleConfirmations.push(message); return false }
  })
  await fillAngle('180')
  await button('Unterteilung übernehmen').click()
  await page.getByText('Unterteilung gespeichert.', {exact: true}).waitFor()
  const halfTurn = await stored()
  check(halfTurn[0].planning.cultures[crop] === 'Bohne' &&
    !(await page.evaluate(() => window.angleConfirmations.length)), 'Halbwendung änderte Belegung')

  await fillAngle('93.75')
  await button('Unterteilung übernehmen').click()
  check((await page.evaluate(() => window.angleConfirmations.at(-1))).includes('nicht eindeutig') &&
    JSON.stringify(await stored()) === JSON.stringify(halfTurn), 'Abbruch nach mehrdeutiger Drehung schrieb Daten')
  await page.evaluate(() => { window.confirm = () => true })
  await button('Unterteilung übernehmen').click()
  await page.getByRole('heading', {name: 'Frühere Belegungen prüfen'}).waitFor()
  const updated = await stored()
  check(updated[0].planning.archived.at(-1).cultures[crop] === 'Bohne' &&
    JSON.stringify(updated[0].snapshot) === JSON.stringify(initial[0].snapshot) &&
    JSON.stringify(updated[1]) === JSON.stringify(halfTurn[0]), 'Gartenkontur, Sicherung oder alte Zuordnung ging verloren')
  await button('Garten schließen').click()
  await button(name).click()
  await combo('Grundfläche').selectOption(field)
  check(await angle.inputValue() === '93.75', 'Wiederöffnung erhielt den gespeicherten Winkel nicht')
  return {free, snapped, reopenedAngle: Number(await angle.inputValue()), archivedCrop: 'Bohne'}
}
