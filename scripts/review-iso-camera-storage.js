async page => {
  const check = (ok, message) => { if (!ok) throw new Error(message) }
  const button = name => page.getByRole('button', {name, exact: true})
  const svg = page.getByRole('group', {name: 'Isometrischer Gartenplan'})
  const title = 'Bagua Kamera ' + Date.now()
  const otherTitle = title + ' · zweiter Garten'
  await page.setViewportSize({width: 1440, height: 900})
  await page.goto('http://127.0.0.1:5173/')
  await page.locator('#garden').selectOption('bagua')
  await page.getByText('Vorlagen', {exact: true}).click()
  await button('Sichtbares Bagua-Netz laden').click()
  await page.getByLabel('Gartenname').fill(title)
  await button('Beetplan').click()
  const ids = await page.evaluate(async ({title, otherTitle}) => {
    const {listProjects, saveProject} = await import('/src/integrated-storage.js')
    const [first] = (await listProjects()).filter(project => project.name === title)
    const second = await saveProject({...first, id: crypto.randomUUID(), name: otherTitle}, null)
    return [first.id, second.id]
  }, {title, otherTitle})
  const records = () => page.evaluate(async ids => {
    const {readProject, readProjectBackup} = await import('/src/integrated-storage.js')
    return await Promise.all(ids.map(id => Promise.all([readProject(id), readProjectBackup(id)])))
  }, ids)
  const before = await records()
  const camera = () => svg.evaluate(element => ({
    angle: Number(element.dataset.cameraAngle),
    zoom: Number(element.dataset.cameraZoom),
    focus: [Number(element.dataset.cameraFocusX), Number(element.dataset.cameraFocusY)],
    transform: element.querySelector('[data-iso-world]').getAttribute('transform'),
  }))
  const waitHeading = heading => page.waitForFunction(heading => {
    const drawing = document.querySelector('.garden-iso')
    return Number(drawing?.dataset.cameraAngle) === heading && drawing.dataset.cameraRotating !== 'true'
  }, heading)
  const reopen = async name => {
    await button(name).click()
    await svg.waitFor()
  }
  const initial = await camera()
  await button('Vergrößern').click()
  await button('Verschieben').click()
  const box = await svg.boundingBox()
  await page.mouse.move(box.x + box.width * .5, box.y + box.height * .5)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * .56, box.y + box.height * .54, {steps: 4})
  await page.mouse.up()
  await button('Osten').click()
  await waitHeading(90)
  const firstView = await camera()
  check(firstView.zoom === 1.25 && firstView.focus[0] !== initial.focus[0], 'Zoom oder Verschieben war wirkungslos')
  await button('Garten schließen').click()
  await reopen(otherTitle)
  check(JSON.stringify(await camera()) === JSON.stringify(initial), 'Anderer Garten erbte die Kameraansicht')
  await button('Süden').click()
  await button('Verkleinern').click()
  await waitHeading(180)
  const secondView = await camera()
  await button('Garten schließen').click()
  await reopen(title)
  check(JSON.stringify(await camera()) === JSON.stringify(firstView), 'Erster Garten öffnete mit falscher Ansicht')
  check(await button('Verschieben').getAttribute('aria-pressed') === 'false', 'Werkzeugmodus wurde wiederhergestellt')

  await page.reload()
  await button('Gespeicherte Gärten').click()
  await reopen(otherTitle)
  check(JSON.stringify(await camera()) === JSON.stringify(secondView), 'Zweiter Garten verlor Ansicht nach Browser-Neuladen')
  await button('Westen').click()
  await button('Garten schließen').click()
  await reopen(otherTitle)
  const west = await camera()
  check(west.angle === 270 && west.zoom === secondView.zoom &&
    JSON.stringify(west.focus) === JSON.stringify(secondView.focus), 'Schließen während Drehung verlor das Kompassziel')
  check(JSON.stringify(await records()) === JSON.stringify(before), 'Kamera änderte Garten oder Sicherung')
  return {first: firstView, second: secondView, reopenedDirection: west.angle, recordsUnchanged: true}
}
