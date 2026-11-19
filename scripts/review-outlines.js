async page => {
  const assert = (ok, message) => { if (!ok) throw new Error(message) }
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.setViewportSize({ width: 1440, height: 1050 })
  const base = 'http://127.0.0.1:5173'
  const fixture = await (await page.request.get(base + '/evidence/transfer/fixture.json')).json()
  const [references, prompts, tandel] = await Promise.all([
    page.request.get(base + '/evidence/transfer/references.json').then(response => response.json()),
    page.request.get(base + '/evidence/transfer/hesperange-prompts.json').then(response => response.json()),
    page.request.get(base + '/garden/fixture.json').then(response => response.json()),
  ])
  let analysisPrompts = tandel.analysisPrompts
  await page.route('**/garden/fixture.json', route => route.fulfill({
    json: { ...fixture, analysisPrompts },
  }))
  const button = name => page.getByRole('button', { name, exact: true })
  const map = page.getByRole('region', { name: 'Gartenkarte' })
  const status = message => page.getByRole('status').getByText(message, { exact: true }).waitFor()
  const key = 'season-by-season.garden.v1'
  const snapshot = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key)

  async function selectPolygon(label, ring) {
    await button(label).click()
    const box = await map.boundingBox()
    const raster = Math.min(box.width, box.height) - 44
    const [west, south, east, north] = fixture.image.projectedExtent
    for (const [lon, lat] of ring.slice(0, -1)) {
      const x = lon * Math.PI / 180 * 6378137
      const y = Math.log(Math.tan(Math.PI * (lat + 90) / 360)) * 6378137
      await page.mouse.click(
        box.x + (box.width - raster) / 2 + (x - west) / (east - west) * raster,
        box.y + (box.height - raster) / 2 + (north - y) / (north - south) * raster,
      )
    }
    await map.press('Enter')
  }

  await page.goto(base)
  await selectPolygon('Grenze zeichnen', fixture.suggestedBoundary)
  await button('Luftbild auswerten').click()
  await status('Im gewählten Ausschnitt wurden keine Konturen gefunden.')
  assert(await button('Zum Beetplan').isDisabled(), 'No detection should initially block transition')

  await selectPolygon('Beet einzeichnen', references[0].ring)
  await selectPolygon('Weg einzeichnen', references[1].ring)
  await button('Zum Beetplan').click()
  await button('Beet M1').click()
  await page.getByLabel('Kultur', { exact: true }).selectOption('Möhre')
  await button('Belegung speichern').click()
  await page.getByText('Möhre · gespeichert').waitFor()
  const before = await snapshot()
  assert(before.objects.length === 2 && before.objects.every(object => object.source === 'manual'), 'Manual plan provenance missing')

  // Exercise replacement with an existing crop. Cancellation and out-of-bounds drawing
  // leave that record intact; a successful redraw changes only the ring.
  await button('Konturen auf der Karte prüfen').click()
  await button('Beet M1 neu zeichnen').click()
  await map.press('Escape')
  const [lon, lat] = fixture.image.extent
  const outside = [[lon + .00002, lat + .00002], [lon + .00004, lat + .00002], [lon + .00004, lat + .00004], [lon + .00002, lat + .00002]]
  await selectPolygon('Beet M1 neu zeichnen', outside)
  await status('Die neue Kontur muss vollständig innerhalb der Gartengrenze liegen.')
  const newRing = references[0].ring.map(([x, y]) => [x + .000003, y])
  await selectPolygon('Beet M1 neu zeichnen', newRing)
  await selectPolygon('Beet einzeichnen', references[2].ring)
  await button('Luftbild auswerten').click()
  await status('Im gewählten Ausschnitt wurden keine Konturen gefunden.')
  await page.screenshot({ path: 'evidence/transfer/manuelle-konturen.png', fullPage: true })
  await button('Zum Beetplan').click()
  await page.getByText('Möhre · gespeichert').waitFor()
  const after = await snapshot()
  const edited = after.objects.find(object => object.id === before.objects[0].id)
  assert(after.objects.length === 3 && edited && JSON.stringify(edited.ring) !== JSON.stringify(before.objects[0].ring), 'Replacement was not retained')
  assert(JSON.stringify(before.boundary) === JSON.stringify(after.boundary), 'Object edit changed parcel boundary')
  await page.reload()
  await button('Gespeicherten Garten öffnen').click()
  await page.getByText('Möhre · gespeichert').waitFor()
  await button('Beet M2').waitFor()
  assert(JSON.stringify((await snapshot()).objects) === JSON.stringify(after.objects), 'Reload changed saved outlines')

  // Separately verify that a computed proposal can be redrawn while keeping its ID.
  analysisPrompts = prompts
  await page.evaluate(key => {
    localStorage.removeItem(key)
    localStorage.removeItem(key + '.backup')
  }, key)
  await page.reload()
  await selectPolygon('Grenze zeichnen', fixture.suggestedBoundary)
  await button('Luftbild auswerten').click()
  await button('Beet 1 neu zeichnen').waitFor()
  await selectPolygon('Beet 1 neu zeichnen', references[0].ring)
  await button('Luftbild auswerten').click()
  await status('Luftbild ausgewertet.')
  await button('Zum Beetplan').click()
  const corrected = (await snapshot()).objects
  assert(corrected.some(object => object.id === 'bed-1' && object.source === 'manual'), 'Correction to predicted bed lost after rerun')
  assert(corrected.some(object => object.id === 'path-1' && object.source === 'detected'), 'Unaffected proposal missing')
  assert(errors.length === 0, errors.join(' / '))
  return { missingDetectionsRecovered: true, correctedProposalId: 'bed-1', savedCropAfterRedrawAndReload: true, outsideRejected: true }
}
