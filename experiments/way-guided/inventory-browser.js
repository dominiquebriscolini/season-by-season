async page => {
  const verify = (ok, message) => { if (!ok) throw new Error(message) }
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.setViewportSize({width: 1440, height: 980})
  await page.goto(new URL('/experiments/way-guided/', page.url()).href)
  const button = name => page.getByRole('button', {name, exact: true})
  const type = page.getByRole('combobox', {name: 'Objekttyp im Bestand', exact: true})
  const status = page.getByRole('status')
  await page.locator('#garden').selectOption('bagua')
  await page.getByText('Vorlagen', {exact: true}).click()
  await button('Sichtbares Bagua-Netz laden').click()
  await page.waitForFunction(() => document.querySelector('#stats').textContent.startsWith('1 verbundene Wegfläche'))
  await page.evaluate(() => {
    const create = URL.createObjectURL.bind(URL)
    URL.createObjectURL = blob => {
      window.inventoryDownload = blob.text().then(JSON.parse)
      return create(blob)
    }
  })
  const snapshot = async () => {
    const download = page.waitForEvent('download')
    await button('Versuchsdaten speichern').click()
    await download
    return page.evaluate(() => window.inventoryDownload)
  }
  const point = async xy => page.mouse.click(...await page.locator('#map').evaluate((map, [x, y]) => {
    const screen = new DOMPoint(x, y).matrixTransform(map.getScreenCTM())
    return [screen.x, screen.y]
  }, xy))
  const poly = async points => {
    for (const xy of points) await point(xy)
    await button('Zeichnung abschließen').click()
  }
  const assertPartition = async output => {
    const result = await page.evaluate(async ({regions, result, boundary, outlines}) => {
      const {area, intersect, shape} = await import('/experiments/way-guided/model.js')
      let overlap = 0
      for (const [i, region] of regions.entries()) {
        overlap += area(intersect(region.geometry, result.paths))
        for (const other of regions.slice(i + 1)) overlap += area(intersect(region.geometry, other.geometry))
      }
      const sum = regions.reduce((total, region) => total + area(region.geometry), area(result.paths))
      return {overlap, error: Math.abs(sum - area(shape(boundary))),
        overGround: outlines.some(outline => regions.some(region => area(intersect(shape(outline.points), region.geometry)) > 1))}
    }, output)
    verify(result.overlap < 0.00001 && result.error < 0.00001, 'Ground is not a complete non-overlapping partition')
    return result
  }
  const initial = await snapshot()
  verify(initial.regions.length === 4 && initial.regions.every(item => item.kind === 'unknown'), 'Initial bestands classification')
  await assertPartition(initial)
  await button('Fläche auswählen').click()
  await point([475,270])
  verify(await page.locator('#regions fieldset').count() === 1, 'One selection should expose one settings card')
  const originalId = await page.locator('#regions legend').textContent()
  await type.selectOption('free')
  await button('Luftbild prüfen').click()
  await page.getByText('Ungeprüfter Bildhinweis', {exact: false}).waitFor()
  for (const obsolete of ['Bildkontur als Teilfläche übernehmen', 'Teilen', 'Zusammenführen', 'Kontur korrigieren']) {
    verify(await button(obsolete).count() === 0, 'Obsolete ground geometry tool still available: ' + obsolete)
  }
  const proposed = await snapshot()
  const geometry = output => output.regions.map(region => [region.id, region.geometry])
  verify(JSON.stringify(geometry(proposed)) === JSON.stringify(geometry(initial)), 'Type change or image advice changed geometry')
  verify(proposed.regions.find(item => item.id === originalId)?.kind === 'free', 'Free area was not classified')
  await button('Bildhinweis verwerfen').click()
  const standard = page.getByLabel('Standardbreite (cm)')
  await standard.fill('100')
  await standard.press('Tab')
  const wide = await snapshot()
  await assertPartition(wide)
  await standard.fill('80')
  await standard.press('Tab')
  const restored = await snapshot()
  verify(JSON.stringify(geometry(restored)) === JSON.stringify(geometry(initial)), 'Width round trip changed geometry or IDs')
  verify(restored.regions.find(item => item.id === originalId)?.kind === 'free', 'Width round trip lost the type')

  await button('Weggeometrie nachbearbeiten').click()
  await button('Objektumriss zeichnen').click()
  await poly([[474,267],[483,265],[486,274],[476,277]])
  verify(await type.locator('option[value=bed]').count() === 0, 'Outline can be promoted to a ground type')
  await type.selectOption('tree')
  const overlay = await snapshot()
  verify(overlay.outlines[0]?.kind === 'tree', 'Tree was not created')
  verify((await assertPartition(overlay)).overGround, 'Overlay should be allowed above the ground')
  verify(JSON.stringify(restored.regions) === JSON.stringify(overlay.regions), 'Overlay modified the ground partition')
  await button('Umriss korrigieren').click()
  await poly([[474,267],[481,265],[484,273],[476,276]])
  verify((await snapshot()).outlines[0].id === overlay.outlines[0].id, 'Overlay correction changed identity')
  await button('Fläche auswählen').click()
  await point([478,271])
  await button('Grundfläche darunter auswählen').click()
  verify(await page.locator('#regions legend').textContent() === originalId, 'Underlying ground is not accessible')
  verify(await page.locator('#regions input').count() === 0, 'Inventory exposes planting control')
  verify(errors.length === 0, errors.join(' / '))
  await button('Luftbild prüfen').click()

  const drawObject = async (kind, points) => {
    await button('Objektumriss zeichnen').click()
    await poly(points)
    await type.selectOption(kind)
    return (await snapshot()).outlines.at(-1)
  }
  await button('Fläche auswählen').click()
  await point([478,271])
  await button('Objekt verschieben').click()
  await point([478,271])
  await point([490,275])
  const movedTree = await snapshot()
  verify(movedTree.outlines[0].id === overlay.outlines[0].id &&
    JSON.stringify(movedTree.outlines[0].points) !== JSON.stringify(overlay.outlines[0].points), 'Moving a tree changed its ID or kept its old position')
  await drawObject('hedge', [[442,248],[452,249],[452,256],[442,255]])
  verify(JSON.stringify((await snapshot()).net) === JSON.stringify(restored.net), 'Vegetation changed the usable area')

  const shed = await drawObject('shed', [[391,293],[416,293],[416,316],[391,316]])
  await drawObject('building', [[402,300],[427,300],[427,321],[402,321]])
  const buildings = await snapshot()
  const usable = output => page.evaluate(async ({boundary, result, net, outlines, regions}) => {
    const {area, intersect, shape} = await import('/experiments/way-guided/model.js')
    const footprintSum = outlines.filter(item => ['building', 'shed'].includes(item.kind))
      .reduce((sum, item) => sum + area(shape(item.points)), 0)
    return {
      total: area(shape(boundary)),
      occupied: area(net.occupied),
      netPath: area(net.paths),
      grossPath: area(result.paths),
      netGround: net.regions.reduce((sum, item) => sum + area(item.geometry), 0),
      grossGround: regions.reduce((sum, item) => sum + area(item.geometry), 0),
      occupiedInNetPath: area(intersect(net.paths, net.occupied)),
      footprintSum,
    }
  }, output)
  const afterBuildings = await usable(buildings)
  verify(afterBuildings.netPath < afterBuildings.grossPath && afterBuildings.netGround < afterBuildings.grossGround,
    'Buildings did not subtract from both kinds of area')
  verify(afterBuildings.occupied < afterBuildings.footprintSum && afterBuildings.occupiedInNetPath < 1e-5 &&
    Math.abs(afterBuildings.total - afterBuildings.occupied - afterBuildings.netPath - afterBuildings.netGround) < 1e-5,
    'Buildings were double-counted or the net partition is incomplete')
  await button('Fläche auswählen').click()
  await point([395,310])
  await button('Objekt verschieben').click()
  await point([395,310])
  await point([445,310])
  const movedShed = await snapshot()
  const afterMove = await usable(movedShed)
  verify(movedShed.outlines.find(item => item.id === shed.id)?.kind === 'shed' &&
    afterMove.occupied > afterBuildings.occupied && afterMove.netPath > afterBuildings.netPath,
    'Moving the shed lost its identity or failed to update net coverage')
  verify(JSON.stringify(geometry(movedShed)) === JSON.stringify(geometry(restored)) &&
    JSON.stringify(movedShed.axes) === JSON.stringify(restored.axes), 'Buildings edited the base partition')
  const greenhouse = await drawObject('greenhouse', [[457,278],[473,278],[473,292],[457,292]])
  await button(`Gewächshaus ${greenhouse.id} ausblenden`).click()
  const hidden = await snapshot()
  verify(hidden.outlines.at(-1).hidden && JSON.stringify(hidden.net) === JSON.stringify(movedShed.net),
    'Hiding a greenhouse changed usable area or failed to hide it')
  await button(`Gewächshaus ${greenhouse.id} einblenden`).click()
  const shown = await snapshot()
  verify(!shown.outlines.at(-1).hidden && shown.outlines.at(-1).id === greenhouse.id, 'Greenhouse did not reappear with its ID')
  verify(errors.length === 0, errors.join(' / '))
  return {groundAreas: restored.regions.length, connectedWays: restored.result.paths.length,
    advisoryImage: true, freeAreaId: originalId, overlayId: overlay.outlines[0].id, shedId: shed.id, greenhouseId: greenhouse.id}
}
