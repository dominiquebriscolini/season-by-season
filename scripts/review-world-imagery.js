async page => {
  const check = (ok, message) => { if (!ok) throw new Error(message) }
  const button = (name, root = page) => root.getByRole('button', {name, exact: true})
  const picker = page.getByRole('dialog', {name: 'Weltkarte', exact: true})
  const map = page.locator('#map')
  const background = map.locator('[data-world-tiles]')
  const draft = map.locator('#overlays polyline[stroke="#ffdc68"]')
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.setViewportSize({width: 1440, height: 960})
  page.setDefaultTimeout(15_000)
  await page.goto('http://127.0.0.1:5173/')
  await button('Weltkarte').click()
  await picker.getByRole('searchbox', {name: 'Ort oder Adresse', exact: true}).fill('Berlin')
  await button('Suchen', picker).click()
  await picker.getByRole('button', {name: /^Berlin, Deutschland$/i}).click()
  const frame = picker.locator('.world-map-picker__selection')
  const frameBounds = await frame.boundingBox()
  check(frameBounds?.width > 0, 'Der Ausschnitt fehlt')
  const detail = page.waitForResponse(response => response.ok() &&
    /tiles\.versatiles\.org\/tiles\/satellite\/(?:16|17|18|19)\//.test(response.url()))
  await button('Luftbild', picker).click()
  await detail
  await picker.getByRole('link', {name: /VersaTiles/}).waitFor()
  check(JSON.stringify(await frame.boundingBox()) === JSON.stringify(frameBounds), 'Wechsel verschob den Ausschnittrahmen')
  const editorDetail = page.waitForResponse(response => response.ok() &&
    response.request().resourceType() === 'image' &&
    /tiles\.versatiles\.org\/tiles\/satellite\/(?:17|18|19)\//.test(response.url()))
  await button('Ausschnitt übernehmen', picker).click()
  await editorDetail
  await background.waitFor()
  check(await background.getAttribute('data-world-basemap') === 'aerial', 'Luftbildauswahl ging bei Übernahme verloren')
  await button('Grenze zeichnen').click()
  async function point(x, y) {
    const position = await map.evaluate((svg, pair) => {
      const p = new DOMPoint(...pair).matrixTransform(svg.getScreenCTM())
      return [p.x, p.y]
    }, [x, y])
    await page.mouse.click(...position)
  }
  await point(170, 165)
  await point(450, 165)
  await map.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  const view = await map.getAttribute('viewBox')
  const first = await draft.getAttribute('points')
  await button('Straßenkarte').click()
  check(await background.getAttribute('data-world-basemap') === 'street', 'Straßenkarte wurde nicht aktiviert')
  check(await draft.getAttribute('points') === first, 'Straßenkarte änderte Entwurfspunkte')
  check(await map.getAttribute('viewBox') === view, 'Straßenkarte änderte den Ausschnitt')
  await point(450, 450)
  await point(170, 450)
  const finalDraft = await draft.getAttribute('points')
  await button('Luftbild').click()
  check(await draft.getAttribute('points') === finalDraft && await map.getAttribute('viewBox') === view,
    'Luftbild änderte Kartenmaßstab oder Entwurf')
  await page.keyboard.press('Enter')
  await draft.waitFor({state: 'hidden'})
  const title = 'Berlin Luftbild ' + Date.now()
  await page.getByLabel('Gartenname').fill(title)
  await button('Garten speichern').click()
  await page.getByText('Garten gespeichert.', {exact: true}).waitFor()
  const saved = () => page.evaluate(async name => {
    const {listProjects} = await import('/src/integrated-storage.js')
    return (await listProjects()).find(project => project.name === name)
  }, title)
  const before = await saved()
  check(before.snapshot.boundary.length === 4, 'Grundstück wurde nicht mit vier Punkten abgeschlossen')
  await button('Straßenkarte').click()
  await button('Luftbild').click()
  check(JSON.stringify(await saved()) === JSON.stringify(before), 'Hintergrundwahl änderte einen Gartenstand')
  await button('Garten schließen').click()
  await button(title).click()
  await map.locator('[data-world-basemap="street"]').waitFor()
  check(await background.getAttribute('data-world-basemap') === 'street' &&
    JSON.stringify(await saved()) === JSON.stringify(before), 'Wiederöffnung änderte Grundstück oder Startansicht')
  await button('Luftbild').click()
  check(errors.length === 0, errors.join(' / '))
  return {garden: title, points: before.snapshot.boundary.length, revision: before.revision,
    aerialCredit: await page.locator('.map-frame .attribution').textContent()}
}
