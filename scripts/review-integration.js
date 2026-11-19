async page => {
  const verify = (condition, message) => { if (!condition) throw new Error(message) }
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.setViewportSize({width: 1440, height: 980})
  await page.goto('http://127.0.0.1:5173/')
  const button = name => page.getByRole('button', {name, exact: true})
  const type = page.getByLabel('Objekttyp im Bestand')
  const projectStatus = text => page.locator('#project-status').filter({hasText: text})
  const snapshot = () => page.evaluate(async () => {
    const url = performance.getEntriesByType('resource').find(entry => new URL(entry.name).pathname === '/experiments/way-guided/ui.js').name
    return (await import(url)).readEditor()
  })
  const point = async xy => page.mouse.click(...await page.locator('#map').evaluate((map, [x, y]) => {
    const screen = new DOMPoint(x, y).matrixTransform(map.getScreenCTM())
    return [screen.x, screen.y]
  }, xy))
  const draw = async (tool, points) => {
    await button(tool).click()
    for (const xy of points) await point(xy)
    await button('Zeichnung abschließen').click()
  }
  const classify = async (xy, value) => {
    await button('Fläche auswählen').click()
    await point(xy)
    const id = await page.locator('#regions legend').textContent()
    await type.selectOption(value)
    return id
  }
  const outline = async (points, kind) => {
    await draw('Objektumriss zeichnen', points)
    await type.selectOption(kind)
  }
  const save = async () => {
    await button('Garten speichern').click()
    await projectStatus('Garten gespeichert.').waitFor()
  }
  const iso = async () => {
    await button('Beetplan').click()
    await page.getByRole('heading', {name: 'Anbau planen'}).waitFor()
  }
  const reopen = async projectName => {
    await button('Garten schließen').click()
    await button(projectName).click()
    await projectStatus('Gespeicherten Garten geöffnet.').waitFor()
  }
  const plant = async (strip, culture) => {
    await page.getByRole('combobox', {name: 'Streifen', exact: true}).selectOption({label: strip})
    await page.getByRole('combobox', {name: 'Kultur', exact: true}).selectOption(culture)
    await button('Belegung speichern').click()
    await page.getByText('Gespeichert · ' + culture, {exact: true}).waitFor()
  }
  const areaCheck = output => page.evaluate(async ({regions, result, boundary, net}) => {
    const {area, intersect, shape} = await import('/experiments/way-guided/model.js')
    let overlaps = 0
    for (const [index, region] of regions.entries()) {
      overlaps += area(intersect(region.geometry, result.paths))
      for (const other of regions.slice(index + 1)) overlaps += area(intersect(region.geometry, other.geometry))
    }
    const partition = area(result.paths) + regions.reduce((sum, region) => sum + area(region.geometry), 0)
    const usable = area(net.paths) + net.regions.reduce((sum, region) => sum + area(region.geometry), 0)
    return {overlaps, difference: partition - area(shape(boundary)), occupied: partition - usable}
  }, output)
  const shedUnion = output => page.evaluate(async ({outlines}) => {
    const {area, intersect, shape} = await import('/experiments/way-guided/model.js')
    const [first, second] = outlines.filter(outline => outline.kind === 'shed').map(outline => shape(outline.points))
    const overlap = area(intersect(first, second))
    return {overlap, area: area(first) + area(second) - overlap}
  }, output)
  const names = [`Bagua E2E ${Date.now()}`, `Neuer Garten E2E ${Date.now()}`]

  await page.locator('#garden').selectOption('bagua')
  verify((await snapshot()).regions.length === 0, 'Bagua startete mit Geometrie')
  await page.getByText('Vorlagen', {exact: true}).click()
  await button('Sichtbares Bagua-Netz laden').click()
  const bagua = await snapshot()
  verify(bagua.regions.length === 4 && bagua.regions.every(({kind}) => kind === 'unknown'), 'Bagua hat nicht vier ungeklärte Flächen')
  const field = await classify([475, 270], 'bed')
  await button('Weggeometrie nachbearbeiten').click()
  await outline([[474, 267], [483, 265], [486, 274], [476, 277]], 'tree')
  verify(Math.abs((await areaCheck(await snapshot())).occupied) < 1e-5, 'Baum hat Nettofläche abgezogen')
  await outline([[466, 215], [485, 215], [485, 227], [466, 227]], 'greenhouse')
  await page.getByRole('button', {name: /Gewächshaus .* ausblenden/}).click()
  verify(Math.abs((await areaCheck(await snapshot())).occupied) < 1e-5, 'Hülle hat Nettofläche abgezogen')
  const shed = [[470, 242], [488, 242], [488, 260], [470, 260]]
  await outline(shed, 'shed')
  const afterShed = await snapshot()
  const measured = await areaCheck(afterShed)
  verify(measured.occupied > 0 && measured.overlaps < 1e-5 && Math.abs(measured.difference) < 1e-5, 'Flächenbilanz Bagua')
  await outline(shed, 'shed')
  const withBothSheds = await snapshot()
  const union = await shedUnion(withBothSheds)
  // Compare recorded coordinates. Pixel rounding can differ between clicks.
  verify(union.overlap > 0 && Math.abs((await areaCheck(withBothSheds)).occupied - union.area) < 1e-5, 'Überdeckung doppelt abgezogen')
  verify(await page.getByRole('combobox', {name: 'Kultur', exact: true}).count() === 0, 'Kulturwahl auf der Karte')
  await page.getByLabel('Gartenname').fill(names[0])
  await save()
  await iso()
  await page.getByRole('combobox', {name: 'Grundfläche', exact: true}).selectOption(field)
  await page.getByLabel('Unterteilungen').fill('7')
  await button('Unterteilung übernehmen').click()
  await page.getByText('Unterteilung gespeichert.', {exact: true}).waitFor()
  await plant('Streifen 1', 'Möhre')
  await plant('Streifen 7', 'Bohne')
  const baguaSaved = await snapshot()
  await reopen(names[0])
  verify(JSON.stringify((await snapshot()).net) === JSON.stringify(baguaSaved.net), 'Bagua Netto-Geometrie nach Wiederöffnung')
  await page.getByRole('combobox', {name: 'Grundfläche', exact: true}).selectOption(field)
  await page.getByRole('combobox', {name: 'Streifen', exact: true}).selectOption({label: 'Streifen 1'})
  verify(await page.getByRole('combobox', {name: 'Kultur', exact: true}).inputValue() === 'Möhre', 'Bagua Streifenkultur verloren')
  await page.getByRole('combobox', {name: 'Streifen', exact: true}).selectOption({label: 'Streifen 7'})
  verify(await page.getByRole('combobox', {name: 'Kultur', exact: true}).inputValue() === 'Bohne', 'Bagua zweite Streifenkultur verloren')
  await page.screenshot({path: 'evidence/step-4-bagua-iso.png'})

  await button('Garten schließen').click()
  await button('Neuen Garten zeichnen').click()
  await page.locator('#garden').selectOption('tandel')
  await draw('Grenze zeichnen', [[220,220],[420,220],[420,420],[220,420]])
  verify((await snapshot()).regions.length === 1, 'Grundstück ohne Weg hat nicht genau eine Grundfläche')
  await draw('Wegachse zeichnen', [[254,320],[390,320]])
  const newGarden = await snapshot()
  verify(newGarden.regions.length === 2 && newGarden.result.lines[0].extensions.length === 2, 'Virtuelle Enden partitionieren den neuen Garten nicht')
  const freshField = await classify([300,270], 'growing')
  await classify([300,370], 'free')
  await page.getByLabel('Gartenname').fill(names[1])
  await save()
  await iso()
  await page.getByRole('combobox', {name: 'Grundfläche', exact: true}).selectOption(freshField)
  await page.getByRole('combobox', {name: 'Kultur', exact: true}).selectOption('Tomate')
  await button('Belegung speichern').click()
  await page.getByText('Gespeichert · Tomate', {exact: true}).waitFor()
  await button('Karte').click()
  const standard = page.getByLabel('Standardbreite (cm)')
  await standard.fill('110')
  await standard.press('Tab')
  verify((await snapshot()).regions.some(({id}) => id === freshField), 'Eindeutiger Breitenwechsel verlor Fläche')
  await iso()
  await page.getByRole('combobox', {name: 'Grundfläche', exact: true}).selectOption(freshField)
  verify(await page.getByRole('combobox', {name: 'Kultur', exact: true}).inputValue() === 'Tomate', 'Breitenwechsel verlor Kultur')
  await reopen(names[1])
  await page.getByRole('combobox', {name: 'Grundfläche', exact: true}).selectOption(freshField)
  verify(await page.getByRole('combobox', {name: 'Kultur', exact: true}).inputValue() === 'Tomate', 'Neuer Garten verlor Kultur nach Wiederöffnung')
  await button('Karte').click()
  await page.screenshot({path: 'evidence/step-4-neuer-garten.png'})
  verify(!errors.length, errors.join(' / '))
  return {names, baguaRegionCount: bagua.regions.length, baguaShedUnionPx2: measured.occupied,
    newRegionCount: newGarden.regions.length, newField: freshField}
}
