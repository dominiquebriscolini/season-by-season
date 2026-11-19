async page => {
  const check = (ok, message) => { if (!ok) throw new Error(message) }
  const button = (name, root = page) => root.getByRole('button', {name, exact: true})
  const picker = page.getByRole('dialog', {name: 'Weltkarte', exact: true})
  const map = page.locator('#map')
  const frame = page.locator('.map-frame')
  const act = /\/wmts\/ortho_2025\/GLOBAL_WEBMERCATOR_4_V3\/(\d+)\//
  const credit = /ACT Luxemburg · Mai 2025/
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.setViewportSize({width: 1280, height: 900})
  await page.goto('http://127.0.0.1:5173/')

  async function chooseGarden() {
    await button('Weltkarte').click()
    await picker.getByRole('searchbox').fill('jardin communautaire Luxembourg')
    await button('Suchen', picker).click()
    await picker.getByRole('button', {name: /^Jardin Communautaire, Itzigerstee/}).click()
  }

  await page.route(act, route => route.abort())
  await chooseGarden()
  const baseline = page.waitForResponse(response => response.ok() &&
    /tiles\.versatiles\.org\/tiles\/satellite\/(16|17)\//.test(response.url()))
  await button('Luftbild', picker).click()
  await baseline
  await button('Ausschnitt übernehmen', picker).click()
  await frame.getByRole('link', {name: /VersaTiles/}).waitFor()
  const detailTilesReady = await map.locator('[data-world-tiles] image').evaluateAll(async nodes => {
    const urls = nodes.map(node => node.getAttribute('href')).filter(url => /satellite\/1[67]\//.test(url))
    const results = await Promise.allSettled(urls.map(url => {
      const image = new Image()
      image.src = url
      return image.decode()
    }))
    return results.some(result => result.status === 'fulfilled')
  })
  check(detailTilesReady, 'VersaTiles-Detailkacheln fehlen im Vorher-Vergleich')
  check(!await frame.getByRole('link', {name: credit}).isVisible(), 'ACT-Ausfall hinterließ einen falschen Datumshinweis')
  const beforeView = await map.getAttribute('viewBox')
  await frame.screenshot({path: 'evidence/world-map/hesperingen-versatiles.png'})
  await page.unroute(act)

  await button('Straßenkarte').click()
  const editorImage = page.waitForResponse(response => response.ok() && act.test(response.url()))
  await button('Luftbild').click()
  const editorZoom = Number((await editorImage).url().match(act)[1])
  await frame.getByRole('link', {name: credit}).waitFor()
  check(await map.getAttribute('viewBox') === beforeView, 'ACT verschob den Kartenausschnitt')
  await frame.screenshot({path: 'evidence/world-map/hesperingen-act-2025.png'})

  const finerImage = page.waitForResponse(response => response.ok() && Number(response.url().match(act)?.[1]) > editorZoom)
  const zoomIn = button('Vergrößern')
  await zoomIn.click()
  await zoomIn.click()
  const finerZoom = Number((await finerImage).url().match(act)[1])
  await frame.getByRole('link', {name: credit}).waitFor()
  await button('Grenze zeichnen').click()
  for (const [x, y] of [[205, 200], [415, 200], [415, 415], [205, 415]]) {
    const screen = await map.evaluate((node, point) => {
      const p = new DOMPoint(...point).matrixTransform(node.getScreenCTM())
      return [p.x, p.y]
    }, [x, y])
    await page.mouse.click(...screen)
  }
  const draft = map.locator('#overlays polyline[stroke="#ffdc68"]')
  const points = await draft.getAttribute('points')
  const drawingView = await map.getAttribute('viewBox')
  await button('Straßenkarte').click()
  await button('Luftbild').click()
  check(await draft.getAttribute('points') === points && await map.getAttribute('viewBox') === drawingView,
    'Hintergrundwechsel änderte die Zeichnung oder den Zoom')
  await page.keyboard.press('Enter')
  await draft.waitFor({state: 'hidden'})
  await frame.getByRole('link', {name: credit}).waitFor()
  const title = 'Hesperingen ACT ' + Date.now()
  await page.getByLabel('Gartenname').fill(title)
  await button('Garten speichern').click()
  await page.getByText('Garten gespeichert.', {exact: true}).waitFor()
  const saved = await page.evaluate(async name => {
    const {listProjects} = await import('/src/integrated-storage.js')
    return (await listProjects()).find(project => project.name === name)
  }, title)
  check(saved?.snapshot.boundary.length === 4 && saved.revision === 1, 'Gespeicherte Geometrie oder Revision weichen ab')
  check(!errors.length, errors.join(' / '))
  return {garden: title, editorZoom, finerZoom, points: saved.snapshot.boundary.length}
}
