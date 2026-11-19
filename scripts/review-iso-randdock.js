async page => {
  const check = (condition, detail) => { if (!condition) throw new Error(detail) }
  const button = (name, within = page) => within.getByRole('button', {name, exact: true})
  const combo = (name, within = page) => within.getByRole('combobox', {name, exact: true})
  const field = (name, within = page) => within.getByLabel(name, {exact: true})
  const heading = name => page.getByRole('heading', {name, exact: true})
  const drawing = page.locator('.iso-stage .garden-iso:visible')
  const projects = page.getByRole('dialog', {name: 'Saisonprojekte'})
  const journal = page.getByRole('region', {name: 'Erntejournal'})
  const toggle = button('Beetdetails')
  const close = button('Beetdetails schließen')
  const day = field('Saisondatum')
  const plan = combo('Planansicht')
  const count = field('Unterteilungen')
  const angle = field('Winkel (°)')
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.setDefaultTimeout(10_000)

  const settle = () => page.evaluate(() => new Promise(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  }))
  const isFocused = locator => locator.evaluate(element => document.activeElement === element)
  async function metrics() {
    await settle()
    return drawing.evaluate(svg => {
      const world = svg.querySelector('[data-iso-world]')
      const box = svg.getBoundingClientRect()
      const matrix = world.getScreenCTM()
      const center = new DOMPoint(box.x + box.width / 2, box.y + box.height / 2)
      const focus = center.matrixTransform(matrix.inverse())
      const {cameraAngle, cameraZoom, cameraFocusX, cameraFocusY} = svg.dataset
      const stage = svg.closest('.iso-stage')
      const intersect = rect => Math.min(box.right, rect.right) - Math.max(box.left, rect.left) > .5 &&
        Math.min(box.bottom, rect.bottom) - Math.max(box.top, rect.top) > .5
      const layoutTargets = [...stage.querySelectorAll('.iso-workbench-tools, .iso-detail-dock'), document.querySelector('#iso-season')]
      const covered = layoutTargets.some(element => intersect(element.getBoundingClientRect()))
      const annotations = [...svg.querySelectorAll('.iso-annotation text')].map(element => {
        const rect = element.getBoundingClientRect()
        return rect.left >= box.left && rect.top >= box.top && rect.right <= box.right && rect.bottom <= box.bottom
      })
      return {
        size: [box.width, box.height], screenCenter: [center.x, center.y],
        focus: [focus.x, focus.y], storedFocus: [Number(cameraFocusX), Number(cameraFocusY)],
        angle: Number(cameraAngle), zoom: Number(cameraZoom), matrix: [matrix.a, matrix.b, matrix.c, matrix.d],
        pixelsPerIsoUnit: Math.sqrt(matrix.a * matrix.d - matrix.b * matrix.c), covered, annotations,
      }
    })
  }
  const near = (actual, expected, tolerance) => actual.every((coordinate, i) => Math.abs(coordinate - expected[i]) <= tolerance)
  function compare(before, after, description, sameFrameSize = true) {
    check(!after.covered, `${description}: Zeichenfläche überlagert`)
    check(after.annotations.length === 2 && after.annotations.every(Boolean), `${description}: Nordmarke oder Maßstab abgeschnitten`)
    // The unchanged SVG world transform is parsed at single precision by Chromium.
    check(near(after.focus, after.storedFocus, 1e-4), `${description}: Bildschirmmitte ${after.focus} statt Bodenfokus ${after.storedFocus}`)
    check(near(before.focus, after.focus, 1e-5), `${description}: ${before.focus} → ${after.focus}`)
    check(Math.abs(before.zoom - after.zoom) <= 1e-6 && before.angle === after.angle, `${description}: Zoom oder Blickrichtung verstellt`)
    if (sameFrameSize) check(near(before.matrix, after.matrix, 1e-6), `${description}: Bildschirmmaßstab ${before.pixelsPerIsoUnit} → ${after.pixelsPerIsoUnit}`)
  }
  async function panel(open, escape = false) {
    check(await toggle.getAttribute('aria-expanded') === String(!open), 'Unerwarteter Dockzustand vor Aktion')
    if (open) await toggle.press('Enter')
    else if (escape) await page.keyboard.press('Escape')
    else await close.click()
    check(await toggle.getAttribute('aria-expanded') === String(open), 'Dock schaltete nicht um')
    if (open) {
      const title = page.getByRole('heading', {name: /^(Anbau planen|Anbaugeschichte)$/})
      check(await isFocused(title), 'Öffnen fokussierte den Docktitel nicht')
    } else {
      check(await isFocused(toggle), 'Schließen führte den Fokus nicht zu Beetdetails zurück')
      check(!await combo('Grundfläche').count(), 'Geschlossenes Dock blieb im Accessibility Tree')
    }
  }

  await page.setViewportSize({width: 1440, height: 900})
  await page.emulateMedia({reducedMotion: 'reduce', colorScheme: 'light'})
  await page.goto('http://127.0.0.1:5173/')
  const previous = 'Bagua Saison 2027 · Langer Projektname für den Rückblick im Beetplan'
  const current = 'Bagua Saison 2028 · Randdock'
  const records = () => page.evaluate(async names => {
    const {listProjects, readProjectBackup} = await import('/src/integrated-storage.js')
    const projects = (await listProjects()).filter(project => names.includes(project.name)).sort((a, b) => a.name.localeCompare(b.name))
    return Promise.all(projects.map(async project => ({project, backup: await readProjectBackup(project.id)})))
  }, [previous, current])

  await page.locator('#garden').selectOption('bagua')
  await page.getByText('Vorlagen', {exact: true}).click()
  await button('Sichtbares Bagua-Netz laden').click()
  await button('Fläche auswählen').click()
  const location = await page.locator('#map').evaluate(map => {
    const point = new DOMPoint(475, 270).matrixTransform(map.getScreenCTM())
    return [point.x, point.y]
  })
  await page.mouse.click(...location)
  const id = await page.locator('#regions legend').textContent()
  const strip = number => `${id}:strip:${number}`
  await combo('Objekttyp im Bestand').selectOption('bed')
  await field('Gartenname').fill(previous)
  await button('Beetplan').click()
  check(await toggle.getAttribute('aria-expanded') === 'true', 'Erster Beetplan öffnete das Dock nicht')
  await combo('Grundfläche').selectOption(id)
  await count.fill('5')
  await button('Unterteilung übernehmen').click()
  await page.getByText('Unterteilung gespeichert.', {exact: true}).waitFor()
  await combo('Streifen').selectOption(strip(3))
  await combo('Kultur').selectOption('Tomate')
  await button('Belegung speichern').click()
  await page.getByText('Gespeichert · Tomate', {exact: true}).waitFor()
  const planting = page.getByRole('dialog', {name: 'Anbaudaten'})
  await button('Anbaudaten').click()
  await planting.waitFor()
  await page.keyboard.press('Escape')
  await planting.waitFor({state: 'hidden'})
  check(await isFocused(button('Anbaudaten')) && await toggle.getAttribute('aria-expanded') === 'true', 'Dialog-Escape verlor Fokus oder schloss auch das Dock')
  await button('Saisonprojekte').click()
  await field('Hauptjahr', projects).fill('2027')
  await button('Hauptjahr speichern', projects).click()
  await page.getByText('Hauptjahr 2027 gespeichert.', {exact: true}).waitFor()
  await day.fill('2027-05-15')
  await button('Ernte erfassen', journal).click()
  await field('Erntedatum', journal).fill('2027-05-10')
  await field('Erntemenge', journal).fill('1.25')
  await combo('Ernteeinheit', journal).selectOption('kg')
  await field('Erntenotiz (optional)', journal).fill('Pflückgang · Randdock')
  await button('Ernte speichern', journal).click()
  await journal.getByText('Pflückgang · Randdock', {exact: true}).waitFor()

  const original = (await records())[0].project
  await button('Saisonprojekte').click()
  await button('Neues Saisonprojekt', projects).click()
  await field('Name des Saisonprojekts', projects).fill(current)
  await field('Hauptjahr des Saisonprojekts', projects).fill('2028')
  await combo('Vorjahresprojekt', projects).selectOption(original.id)
  await field('Aufteilung des Vorjahrs kopieren', projects).check()
  await button('Saisonprojekt anlegen', projects).click()
  await page.getByText(/Aufteilungen kopiert: 1\. Ausgelassen: 0\./).waitFor()
  await combo('Grundfläche').selectOption(id)
  check(await count.inputValue() === '5', 'Kopie fehlte')
  await count.fill('7')
  await button('Unterteilung übernehmen').click()
  await page.getByText('Unterteilung gespeichert.', {exact: true}).waitFor()
  await combo('Streifen').selectOption(strip(3))
  check(await combo('Kultur').inputValue() === '', 'Folgejahr übernahm Kultur')
  const untouched = await records()
  check(untouched.length === 2 && untouched.every(({backup}) => backup), 'Projektstände und Wiederherstellungspunkte fehlen')

  await button('Osten').click()
  await button('Vergrößern').click()
  await button('Vergrößern').click()
  const centered = await metrics()
  await button('Verschieben').click()
  await page.mouse.move(...centered.screenCenter)
  await page.mouse.down()
  await page.mouse.move(centered.screenCenter[0] + 32, centered.screenCenter[1] + 19, {steps: 5})
  await page.mouse.up()
  const moved = await metrics()
  check(!near(centered.focus, moved.focus, 1), 'Zeiger verschob den Bodenfokus nicht')
  check(moved.angle === 90 && moved.zoom === 1.5625, 'Testkamera wurde nicht auf Osten und 1,5625 gestellt')
  await page.keyboard.press('Escape')
  check(await isFocused(button('Verschieben')) && await toggle.getAttribute('aria-expanded') === 'true', 'Escape für Verschieben schloss auch das Dock oder verlor den Fokus')

  await button('Winkel ändern').click()
  await angle.fill('51.5')
  await page.getByRole('slider', {name: 'Streifenrichtung drehen'}).focus()
  const handle = await page.getByRole('slider', {name: 'Streifenrichtung drehen'}).boundingBox()
  const pivot = await page.locator('[data-strip-angle-pivot]:visible').boundingBox()
  check(handle && pivot, 'Winkelgriff und Drehpunkt in Ostansicht fehlen')
  const center = box => [box.x + box.width / 2, box.y + box.height / 2]
  const [hx, hy] = center(handle)
  const [px, py] = center(pivot)
  check(await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.matches('.iso-strip-angle-handle'), [hx, hy]), 'Winkelgriff liegt außerhalb der erreichbaren Zeichenfläche')
  await page.mouse.move(hx, hy)
  await page.mouse.down()
  await page.mouse.move(hx + (hx - px) * .22, hy + (hy - py) * .22, {steps: 4})
  await page.mouse.up()
  check(Math.abs(Number(await angle.inputValue()) - 51.5) < .5, 'Drehgriff las nach Ostschwenk einen Bildschirmwinkel')
  await angle.fill('51.5')
  await page.getByRole('slider', {name: 'Streifenrichtung drehen'}).press('ArrowRight')
  check(Number(await angle.inputValue()) === 52.5, 'Tastatur verstellt den Winkelgriff nicht in Ein-Grad-Schritten')
  await angle.fill('51.5')
  await count.fill('8')

  async function checkDraft() {
    check(await combo('Streifen').inputValue() === strip(3) && await count.inputValue() === '8' && await angle.inputValue() === '51.5',
      'Aktueller Streifen oder nicht gespeicherte Eingabe ging verloren')
    check(await page.getByRole('slider', {name: 'Streifenrichtung drehen'}).isVisible(), 'Aktiver Drehgriff ging verloren')
  }

  // Use the same draft and panned camera to test both docking axes and reflow.
  const samples = []
  for (const [width, height] of [[1440, 900], [1024, 768], [768, 1024], [390, 844], [320, 568], [844, 390]]) {
    await page.setViewportSize({width, height})
    await page.emulateMedia({reducedMotion: 'reduce', colorScheme: width <= 390 ? 'dark' : 'light'})
    const open = await metrics()
    compare(moved, open, `${width} × ${height} nach Umbruch`, false)
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Horizontaler Überlauf bei ${width} × ${height}`)
    if (width === 320) check(open.size[1] >= 96, `Nur ${open.size[1]} px Zeichnung in 320 × 568`)
    const preferences = await page.evaluate(() => ({local: {...localStorage}, session: {...sessionStorage}}))
    await panel(false)
    const closed = await metrics()
    compare(open, closed, `${width} × ${height} geschlossen`)
    check(closed.size[width > 900 ? 0 : 1] > open.size[width > 900 ? 0 : 1], 'Zeichenfläche gewann beim Schließen keinen Platz')
    await panel(true)
    const reopened = await metrics()
    compare(open, reopened, `${width} × ${height} wieder offen`)
    await checkDraft()
    check(JSON.stringify(await page.evaluate(() => ({local: {...localStorage}, session: {...sessionStorage}}))) === JSON.stringify(preferences), 'Dock schrieb Browserpräferenzen oder Entwurfscheckpoint')
    samples.push({width, height, open, closed, reopened})
    if (width === 390) await page.screenshot({path: 'evidence/iso-randdock/technik-bagua-390.png'})
  }

  await page.setViewportSize({width: 1440, height: 900})
  await day.fill('2027-05-15')
  await heading('Anbaugeschichte').waitFor()
  const history = await metrics()
  compare(samples[0].open, history, 'Automatischer Rückblick')
  check(await combo('Streifen').inputValue() === strip(3) && await combo('Streifen').locator('option').count() === 6, 'Passender historischer Streifen fehlt')
  await journal.getByText('Pflückgang · Randdock', {exact: true}).waitFor()
  check(await button('Garten speichern').isDisabled() && !await button('Belegung speichern').count() && !await button('Ernte erfassen').count(), 'Vorjahr war bearbeitbar')
  await combo('Streifen').selectOption(strip(2))
  await panel(false, true)
  const historicalClosed = await metrics()
  compare(history, historicalClosed, 'Historisches Dock geschlossen')
  await plan.selectOption('current')
  compare(historicalClosed, await metrics(), 'Manuell zurück zum Arbeitsplan bei geschlossenem Dock')
  check(await toggle.getAttribute('aria-expanded') === 'false', 'Planwahl setzte die Dockstellung zurück')
  await panel(true)
  await checkDraft()
  await plan.selectOption(`history:${original.id}`)
  await heading('Anbaugeschichte').waitFor()
  compare(history, await metrics(), 'Manueller Rückblick')
  check(await combo('Streifen').inputValue() === strip(2), 'Historische Auswahl wurde bei erneutem Rückblick überschrieben')
  await page.setViewportSize({width: 390, height: 844})
  await page.emulateMedia({reducedMotion: 'reduce', colorScheme: 'dark'})
  const mobile = samples.find(sample => sample.width === 390)
  const historicalMobile = await metrics()
  compare(mobile.open, historicalMobile, 'Manueller Rückblick bei 390 px')
  check(near(historicalMobile.size, mobile.open.size, .01), 'Langer Rückblickname veränderte die Rahmenhöhe')
  const readOnly = page.locator('.season-read-only')
  check(/schreibgeschützt/i.test(await readOnly.textContent()) && await readOnly.evaluate(node => {
    const label = node.getBoundingClientRect()
    const row = node.closest('.season-view').getBoundingClientRect()
    return label.width > 0 && label.right <= row.right + .5 && label.bottom <= row.bottom + .5
  }), 'Schreibschutz wurde im mobilen Rückblick abgeschnitten')
  await page.screenshot({path: 'evidence/iso-randdock/technik-bagua-rueckblick-390.png'})
  await page.setViewportSize({width: 1440, height: 900})
  await page.emulateMedia({reducedMotion: 'reduce', colorScheme: 'light'})
  await day.fill('2028-05-20')
  await heading('Anbaugeschichte').waitFor()
  await plan.selectOption('auto')
  await heading('Anbau planen').waitFor()
  await checkDraft()

  await count.fill('7')
  const savedAngle = untouched.find(({project}) => project.name === current).project.planning.splits[id].angle
  await angle.fill(String(Number(savedAngle.toFixed(8))))
  await button('Winkel fertig').click()

  await panel(false)
  await drawing.locator(`[data-bed-id="${strip(2)}"]`).press('Enter')
  check(await drawing.locator(`[data-bed-id="${strip(2)}"]`).getAttribute('aria-pressed') === 'true' && await toggle.getAttribute('aria-expanded') === 'false', 'Enter wählte nicht oder öffnete das Dock automatisch')
  const hit = await drawing.evaluate((svg, targetId) => {
    const bounds = svg.getBoundingClientRect()
    for (let y = bounds.top + 3; y < bounds.bottom - 3; y += 5) {
      for (let x = bounds.left + 3; x < bounds.right - 3; x += 5) {
        if (document.elementFromPoint(x, y)?.closest('[data-bed-id]')?.dataset.bedId === targetId) return [x, y]
      }
    }
    return null
  }, strip(3))
  check(hit, 'Kein realer Treffer auf Streifen 3 im verschobenen Ausschnitt')
  await page.mouse.click(...hit)
  check(await drawing.locator(`[data-bed-id="${strip(3)}"]`).getAttribute('aria-pressed') === 'true', 'Zeiger wählte nicht den sichtbaren Streifen')
  await button('Karte').click()
  await page.locator('#map').waitFor()
  await button('Beetplan').click()
  check(await toggle.getAttribute('aria-expanded') === 'false', 'Kartenwechsel setzte die Dockstellung zurück')
  compare(samples[0].closed, await metrics(), 'Karte → Beetplan')
  await panel(true)
  check(await combo('Streifen').inputValue() === strip(3), 'Kartenwechsel verlor die Streifenauswahl')

  // A fresh opening of this project has no cached historical selection.
  await button('Garten schließen').click()
  await button(current).click()
  await heading('Anbau planen').waitFor()
  await combo('Grundfläche').selectOption(id)
  await combo('Streifen').selectOption(strip(7))
  await day.fill('2027-05-15')
  await heading('Anbaugeschichte').waitFor()
  check(await combo('Grundfläche').inputValue() === id && await combo('Streifen').inputValue() === '', 'Fehlender Siebener wählte im Vorjahr einen falschen Streifen')
  await plan.selectOption('current')
  check(await combo('Streifen').inputValue() === strip(7), 'Siebener ging bei Rückkehr verloren')
  check(JSON.stringify(await records()) === JSON.stringify(untouched), 'Projektstand oder Wiederherstellungspunkt änderte sich')
  await page.screenshot({path: 'evidence/iso-randdock/technik-bagua-desktop.png'})
  check(errors.length === 0, errors.join(' / '))
  return {field: id, samples, history, historicalClosed, historicalMobile,
    records: untouched.map(({project, backup}) => ({year: project.season.year, revision: project.revision, backupRevision: backup.revision})), errors}
}
