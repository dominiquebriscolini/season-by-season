async page => {
  const check = (ok, message) => { if (!ok) throw new Error(message) }
  const button = name => page.getByRole('button', {name, exact: true})
  const library = page.getByRole('dialog', {name: 'Gespeicherte Gärten'})
  const current = page.locator('#iso-content')
  const svg = current.getByRole('group', {name: 'Isometrischer Gartenplan'})
  const background = current.getByRole('group', {name: 'Untergrund'})
  const drawing = background.getByRole('button', {name: 'Schraffuren/Grün', exact: true})
  const aerial = background.getByRole('button', {name: 'Luftbild', exact: true})
  const titles = ['Bagua', 'Tandel'].map(name => `${name} Untergrund ${Date.now()}`)
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.setDefaultTimeout(8000)
  await page.setViewportSize({width: 1440, height: 900})
  await page.goto('http://127.0.0.1:5173/')

  async function expectMode(mode) {
    await svg.and(current.locator(`[data-iso-background="${mode}"]`)).waitFor()
    check(await aerial.getAttribute('aria-pressed') === String(mode === 'aerial') &&
      await drawing.getAttribute('aria-pressed') === String(mode === 'drawing'),
    `Schalter steht nicht auf ${mode}`)
  }

  async function open(name) {
    await library.getByRole('button', {name, exact: true}).click()
    await library.waitFor({state: 'hidden'})
    await svg.waitFor()
    check(await page.getByLabel('Gartenname').inputValue() === name, 'Falscher Garten geöffnet')
  }

  async function switchTo(name) {
    await button('Gespeicherte Gärten').click()
    await open(name)
  }

  await page.locator('#garden').selectOption('bagua')
  await page.getByText('Vorlagen', {exact: true}).click()
  await button('Sichtbares Bagua-Netz laden').click()
  await page.getByLabel('Gartenname').fill(titles[0])
  await button('Beetplan').click()
  await expectMode('drawing')
  await aerial.click()
  await expectMode('aerial')

  await button('Garten schließen').click()
  await button('Neuen Garten zeichnen').click()
  await page.locator('#garden').selectOption('tandel')
  await button('Grenze zeichnen').click()
  const map = page.locator('#map')
  for (const [x, y] of [[220, 220], [420, 220], [420, 420], [220, 420]]) {
    const position = await map.evaluate((node, point) => {
      const transformed = new DOMPoint(...point).matrixTransform(node.getScreenCTM())
      return [transformed.x, transformed.y]
    }, [x, y])
    await page.mouse.click(...position)
  }
  await map.press('Enter')
  await page.getByLabel('Gartenname').fill(titles[1])
  await button('Beetplan').click()
  await expectMode('drawing')

  const records = () => page.evaluate(async names => {
    const {listProjects, readProjectBackup} = await import('/src/integrated-storage.js')
    const all = await listProjects()
    return await Promise.all(names.map(async name => {
      const project = all.find(record => record.name === name)
      return {project, backup: await readProjectBackup(project.id)}
    }))
  }, titles)
  const before = await records()
  const keys = before.map(({project}) => `season-by-season.iso-underlay.v1.${project.id}`)
  const preferences = () => page.evaluate(names => names.map(name => localStorage.getItem(name)), keys)

  await aerial.click()
  await expectMode('aerial')
  await drawing.click()
  await expectMode('drawing')
  check(JSON.stringify(await preferences()) === JSON.stringify(['aerial', 'drawing']), 'Die Wahl wurde nicht pro Garten geschrieben')

  await switchTo(titles[0])
  await expectMode('aerial')
  await switchTo(titles[1])
  await expectMode('drawing')
  await page.reload()
  await switchTo(titles[1])
  await expectMode('drawing')
  await switchTo(titles[0])
  await expectMode('aerial')
  await drawing.click()
  await expectMode('drawing')
  await button('Garten schließen').click()
  await open(titles[0])
  await expectMode('drawing')
  await aerial.click()
  await expectMode('aerial')

  await page.evaluate(key => localStorage.setItem(key, 'ungültig'), keys[1])
  await switchTo(titles[1])
  await expectMode('drawing')
  await switchTo(titles[0])
  await expectMode('aerial')
  check(JSON.stringify(await records()) === JSON.stringify(before), 'Untergrundwechsel änderte Revision, Projekt oder Sicherung')
  check(!errors.length, errors.join(' / '))
  return {gardenModes: ['aerial', 'drawing'], reopenedAndReloaded: true, invalidValueFallback: true,
    unchangedRecords: true, revisions: before.map(({project}) => project.revision)}
}
