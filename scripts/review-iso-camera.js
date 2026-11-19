async page => {
  const check = (ok, message) => { if (!ok) throw new Error(message) }
  const close = (a, b, tolerance = .0002) => Math.abs(a - b) < tolerance
  const button = name => page.getByRole('button', {name, exact: true})
  const combo = name => page.getByRole('combobox', {name, exact: true})
  const angle = page.getByLabel('Winkel (°)', {exact: true})
  const fillAngle = async value => {
    if (!await angle.isEditable()) await button('Winkel ändern').click()
    await angle.fill(value)
  }
  const svg = page.getByRole('group', {name: 'Isometrischer Gartenplan'})
  const title = 'Bagua Kamera ' + Date.now()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
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
  await page.getByLabel('Objekttyp im Bestand').selectOption('bed')
  await page.getByLabel('Gartenname').fill(title)
  await button('Beetplan').click()
  await combo('Grundfläche').selectOption(field)
  await page.getByLabel('Unterteilungen').fill('7')
  await fillAngle('37.25')
  await button('Unterteilung übernehmen').click()
  const stripId = field + ':strip:2'
  await combo('Streifen').selectOption(stripId)
  const records = () => page.evaluate(async title => {
    const {listProjects, readProjectBackup} = await import('/src/integrated-storage.js')
    const record = (await listProjects()).find(project => project.name === title)
    return [record, await readProjectBackup(record.id)]
  }, title)
  const saved = await records()

  const actualView = () => svg.evaluate(element => {
    const world = element.querySelector('[data-iso-world]')
    const matrix = element.getCTM().inverse().multiply(world.getCTM())
    const view = element.viewBox.baseVal
    const center = new DOMPoint(view.x + view.width / 2, view.y + view.height / 2)
    const focus = center.matrixTransform(matrix.inverse())
    return {focus: [focus.x, focus.y], zoom: Math.sqrt(matrix.a * matrix.d - matrix.b * matrix.c),
      coefficients: [matrix.a, matrix.b, matrix.c, matrix.d]}
  })
  const initial = await actualView()
  await button('Vergrößern').click()
  await button('Verschieben').click()
  const box = await svg.boundingBox()
  await page.mouse.move(box.x + box.width * .48, box.y + box.height * .48)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * .53, box.y + box.height * .51, {steps: 5})
  await page.mouse.up()
  await button('Verschieben').click()
  const before = await actualView()
  check(before.zoom > initial.zoom && !close(before.focus[0], initial.focus[0]), 'Der Test hat weder gezoomt noch verschoben')
  await fillAngle('51.5')

  const waitHeading = heading => page.waitForFunction(heading => {
    const drawing = document.querySelector('.garden-iso')
    return Number(drawing?.dataset.cameraAngle) === heading && drawing.dataset.cameraRotating !== 'true'
  }, heading)
  const verifyView = async heading => {
    await waitHeading(heading)
    const current = await actualView()
    check(current.focus.every((coordinate, index) => close(coordinate, before.focus[index])) &&
      close(current.zoom, before.zoom), `Drehung veränderte Fokus oder Zoom: ${JSON.stringify({heading, before, current})}`)
    const radians = heading * Math.PI / 180
    const expected = [Math.cos(radians), -Math.sin(radians) / Math.sqrt(3), Math.sqrt(3) * Math.sin(radians), Math.cos(radians)]
    check(current.coefficients.every((value, index) => close(value / before.zoom, expected[index])),
      'Kamera veränderte die feste ISO-Neigung')
    check(await combo('Streifen').inputValue() === stripId && await angle.inputValue() === '51.5', 'ISO-Entwurf oder Streifenwahl ging verloren')
  }
  for (const [name, heading] of [['Osten', 90], ['Süden', 180], ['Westen', 270], ['Norden', 0]]) {
    await button(name).click()
    await verifyView(heading)
    check(await button(name).evaluate(element => document.activeElement === element), 'Kamerasteuerung verlor Tastaturfokus')
  }
  await button('Nach rechts drehen').click()
  await verifyView(90)
  await button('Nach links drehen').click()
  await verifyView(0)
  await page.emulateMedia({reducedMotion: 'reduce'})
  await button('Osten').press('Enter')
  await verifyView(90)
  check(await svg.getAttribute('data-camera-rotating') !== 'true', 'Reduzierte Bewegung animierte weiter')

  const centerOf = async locator => {
    const rect = await locator.boundingBox()
    return [rect.x + rect.width / 2, rect.y + rect.height / 2]
  }
  const handle = await centerOf(page.getByRole('slider', {name: 'Streifenrichtung drehen'}))
  const pivot = await centerOf(page.locator('[data-strip-angle-pivot]'))
  await page.mouse.move(...handle)
  await page.mouse.down()
  await page.mouse.move(handle[0] + (handle[0] - pivot[0]) * .25, handle[1] + (handle[1] - pivot[1]) * .25)
  await page.mouse.up()
  check(close(Number(await angle.inputValue()), 51.5, .4), 'Der Griff las im Osten einen Bildschirmwinkel statt Bodenwinkel')
  await fillAngle('51.5')
  await button('Karte').click()
  await button('Beetplan').click()
  await verifyView(90)
  check(JSON.stringify(await records()) === JSON.stringify(saved) && saved[0].planning.splits[field].angle === 37.25,
    'Kamera schrieb Garten, Streifenwinkel oder Sicherung')
  check(errors.length === 0, errors.join(' / '))
  return {focus: before.focus, zoom: before.zoom, storedAngle: 37.25, directions: 4}
}
