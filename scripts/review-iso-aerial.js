async page => {
  const check = (condition, message) => { if (!condition) throw new Error(message) }
  const button = name => page.getByRole('button', {name, exact: true})
  const svg = page.getByRole('group', {name: 'Isometrischer Gartenplan'})
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.setViewportSize({width: 1440, height: 900})
  await page.emulateMedia({reducedMotion: 'reduce'})
  await page.goto('http://127.0.0.1:5173/')
  await page.locator('#garden').selectOption('bagua')
  await page.getByText('Vorlagen', {exact: true}).click()
  await button('Sichtbares Bagua-Netz laden').click()
  const title = 'Bagua ISO-Luftbild ' + Date.now()
  await page.getByLabel('Gartenname').fill(title)
  await button('Beetplan').click()
  const saved = () => page.evaluate(async name => {
    const {listProjects, readProjectBackup} = await import('/src/integrated-storage.js')
    const project = (await listProjects()).find(record => record.name === name)
    return project && {project, backup: await readProjectBackup(project.id)}
  }, title)
  const before = await saved()
  check(before?.project.snapshot.boundary.length, 'Der Testgarten wurde nicht geladen')

  const camera = () => svg.evaluate(node => ({
    view: node.getAttribute('viewBox'), transform: node.querySelector('[data-iso-world]').getAttribute('transform'),
    angle: node.dataset.cameraAngle, zoom: node.dataset.cameraZoom,
  }))
  const overlap = () => svg.evaluate((node, points) => {
    const boundary = node.querySelector('.iso-boundary')
    const raster = node.querySelector('[data-iso-aerial] > g')
    const transform = raster.getScreenCTM()
    const contour = boundary.getScreenCTM()
    return Math.max(...points.map(([x, y], index) => {
      const drawn = boundary.points.getItem(index).matrixTransform(contour)
      const photo = new DOMPoint(x, y).matrixTransform(transform)
      return Math.hypot(drawn.x - photo.x, drawn.y - photo.y)
    }))
  }, before.project.snapshot.boundary)
  const initial = await camera()
  await button('Luftbild').click()
  await page.getByRole('link', {name: /Orthofoto 2023/}).waitFor()
  check(JSON.stringify(await camera()) === JSON.stringify(initial), 'Der Untergrundwechsel änderte die Kamera')
  for (const [direction, angle] of [['Osten', '90'], ['Süden', '180'], ['Westen', '270'], ['Norden', '0']]) {
    await button(direction).click()
    check((await camera()).angle === angle, 'Kompassstellung fehlt')
    check(await overlap() < 0.5, 'Luftbild und Beetkontur laufen auseinander')
  }
  await button('Vergrößern').click()
  await button('Verschieben').click()
  await svg.press('ArrowRight')
  await button('Verschieben').click()
  check(await overlap() < 0.5, 'Luftbild und Kontur verschieben sich unterschiedlich')
  await button('Schraffuren/Grün').click()
  check(await svg.getAttribute('data-iso-background') === 'drawing', 'Schraffuren wurden nicht wiederhergestellt')
  await button('Luftbild').click()
  await button('Karte').click()
  await button('Beetplan').click()
  await page.getByRole('link', {name: /Orthofoto 2023/}).waitFor()
  check(JSON.stringify(await saved()) === JSON.stringify(before), 'Ansichtswechsel veränderte Garten oder Sicherung')
  check(!errors.length, errors.join(' / '))
  return {garden: title, maximumDeviationPx: await overlap(), revision: before.project.revision}
}
