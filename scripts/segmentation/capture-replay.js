async page => {
  const base = 'http://127.0.0.1:5173'
  const mode = new URL(page.url()).searchParams.get('method')
  if (!['manual', 'rgb', 'segment'].includes(mode)) throw new Error('Open the selected benchmark method before replay.')
  const response = await page.request.get(base + '/evidence/segmentation/' + mode + '-intent.json')
  if (!response.ok()) throw new Error('Could not load recorded operator intent.')
  const intent = await response.json()
  await page.setViewportSize({ width: 1180, height: 860 })
  await page.goto(base + '/scripts/segmentation/?method=' + mode)
  await page.waitForFunction(() => typeof window.benchmarkInput === 'function')
  const canvas = page.locator('canvas')
  const box = await canvas.boundingBox()
  const size = await canvas.evaluate(el => [el.width, el.height])
  for (const object of intent) {
    const label = { bed: 'Beet beginnen', path: 'Weg beginnen', pair: 'RGB-Paar beginnen' }[object.kind]
    await page.getByRole('button', { name: label }).click()
    for (const [x, y] of object.points) {
      await page.mouse.click(box.x + x * box.width / size[0], box.y + y * box.height / size[1])
    }
    if (mode === 'rgb') {
      await page.getByLabel('Weg-Halbbreite').fill(String(object.halfWidth))
      await page.getByRole('button', { name: 'Abschließen', exact: true }).click()
    } else {
      await canvas.press('Enter')
    }
  }
  const captured = await page.evaluate(() => window.benchmarkInput())
  if (captured.objects.length !== intent.length || !Number.isFinite(captured.elapsedMs)) {
    throw new Error('Incomplete capture.')
  }
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Eingaben exportieren' }).click()
  await (await download).saveAs('evidence/segmentation/' + mode + '-input.json')
  return { objects: captured.objects.length, events: captured.events.length, elapsedMs: captured.elapsedMs }
}
