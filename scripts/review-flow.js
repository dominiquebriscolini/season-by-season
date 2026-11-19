async page => {
  const verify = (condition, message) => {
    if (!condition) throw new Error(message)
  }
  const failures = []
  page.on('pageerror', error => failures.push(error.message))
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('http://127.0.0.1:5173/')
  const fixture = await page.evaluate(async () => (await fetch('/garden/fixture.json')).json())
  await page.getByText(fixture.name, { exact: false }).first().waitFor()

  const map = page.getByRole('region', { name: 'Gartenkarte' })
  const draw = page.getByRole('button', { name: /Grenze (neu )?zeichnen/ })
  await draw.click()
  const box = await map.boundingBox()
  const rasterSize = Math.min(box.width, box.height) - 44
  const [west, south, east, north] = fixture.image.projectedExtent
  const mercator = ([lon, lat]) => [
    lon * Math.PI / 180 * 6378137,
    Math.log(Math.tan(Math.PI * (lat + 90) / 360)) * 6378137,
  ]

  const points = fixture.suggestedBoundary.slice(0, -1)
  for (const [i, point] of points.entries()) {
    const [x, y] = mercator(point)
    await page.mouse.click(
      box.x + (box.width - rasterSize) / 2 + (x - west) / (east - west) * rasterSize,
      box.y + (box.height - rasterSize) / 2 + (north - y) / (north - south) * rasterSize,
    )
    if (i === 1) {
      await map.press('Enter')
      verify(!(await page.getByRole('button', { name: 'Luftbild auswerten' }).isVisible()), 'Two points closed a polygon')
    }
  }
  await map.press('Enter')
  await page.getByRole('button', { name: 'Luftbild auswerten', exact: true }).click()
  await page.getByText('61,3 % Überlappung', { exact: false }).waitFor()
  await page.getByText('68,2 % Überlappung', { exact: false }).waitFor()
  await page.getByLabel('Handumrisse einblenden').check()
  const cultureEntry = page.getByLabel('Kultur', { exact: true })
  verify(!(await cultureEntry.isVisible()), 'Culture entry visible during inventory review')
  await page.screenshot({ path: 'evidence/luftbild-vergleich.png', fullPage: true })

  await page.getByRole('button', { name: 'Zum Beetplan' }).click()
  const bed = page.getByRole('button', { name: 'Beet 1', exact: true })
  verify((await page.getByRole('button', { name: 'Weg 1', exact: true }).count()) === 0, 'Path is selectable as a bed')
  verify(!(await cultureEntry.isVisible()), 'Culture entry visible without a selected bed')
  await bed.click()
  await page.getByLabel('Kultur', { exact: true }).selectOption('Möhre')
  await page.getByRole('button', { name: 'Belegung speichern' }).click()
  await page.getByText('Möhre · gespeichert').waitFor()

  const primary = 'season-by-season.garden.v1'
  const before = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), primary)
  verify(before.boundary.length === points.length + 1, 'Drawn border did not preserve exactly the clicked vertices')
  verify(JSON.stringify(before.boundary[0]) === JSON.stringify(before.boundary.at(-1)), 'Border was not closed')
  verify(before.objects.length === 2 && before.objects.every(object => object.source === 'detected'), 'Reference geometry reached the garden')
  verify(before.cultures['bed-1'] === 'Möhre', 'Assignment was not saved')

  await page.reload()
  await page.getByRole('button', { name: 'Gespeicherten Garten öffnen' }).click()
  await page.getByText('Möhre · gespeichert').waitFor()
  verify(await page.getByLabel('Kultur', { exact: true }).inputValue() === 'Möhre', 'Reload did not restore the culture')
  await page.screenshot({ path: 'evidence/gespeichertes-beet.png', fullPage: true })
  await page.evaluate(key => localStorage.setItem(key, 'unreadable'), primary)
  await page.reload()
  await page.getByText('Der Garten wurde aus der lokalen Sicherung geladen.').waitFor()
  await page.getByRole('button', { name: 'Gespeicherten Garten öffnen' }).click()
  await page.getByText('Möhre · gespeichert').waitFor()
  await page.evaluate((key) => localStorage.setItem(key, localStorage.getItem(key + '.backup')), primary)

  await page.getByRole('button', { name: 'Konturen auf der Karte prüfen' }).click()
  verify(!(await cultureEntry.isVisible()), 'Culture entry visible when returning to inventory review')
  await page.getByRole('button', { name: 'Luftbild auswerten', exact: true }).click()
  await page.getByText('Luftbild ausgewertet.', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Zum Beetplan' }).click()
  verify(await page.getByLabel('Kultur', { exact: true }).inputValue() === 'Möhre', 'Reanalysis cleared the crop')

  const controls = await page.evaluate(async fixture => {
    const { evaluateImage } = await import('/src/garden-analysis.js')
    const image = new Image()
    image.src = fixture.image.url
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const context = canvas.getContext('2d')
    context.drawImage(image, 0, 0)
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
    const detected = evaluateImage(fixture, fixture.suggestedBoundary, pixels)
    const withoutReferences = evaluateImage({ ...fixture, references: [] }, fixture.suggestedBoundary, pixels)
    const empty = evaluateImage(fixture, fixture.suggestedBoundary, context.createImageData(canvas.width, canvas.height))
    return {
      referencesOnlyForComparison: JSON.stringify(detected.objects) === JSON.stringify(withoutReferences.objects),
      emptyImageObjects: empty.objects.length,
    }
  }, fixture)
  verify(controls.referencesOnlyForComparison, 'Reference rings influenced recognition')
  verify(controls.emptyImageObjects === 0, 'Blank image produced detections')

  verify(failures.length === 0, failures.join(' / '))
  return { comparisons: before.comparisons, savedCulture: before.cultures['bed-1'],
    backupRestored: true, reanalysisPreservedCrop: true, ...controls }
}
