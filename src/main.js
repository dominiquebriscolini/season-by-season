import './styles.css'
import { containsOutline, createGardenMap } from './garden-map.js'
import { renderGardenIso } from './garden-iso.js'
import { analyseGarden, withinImage } from './garden-analysis.js'
import { readGarden, saveGarden } from './garden-storage.js'

const cultures = ['Bohne', 'Kopfsalat', 'Möhre', 'Radieschen', 'Tomate', 'Zucchini']

const root = document.getElementById('app')
root.innerHTML = `
  <header class="topbar">
    <div class="brand">
      <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>
      <div><strong>Season by Season</strong><small>Gartenplanung</small></div>
    </div>
    <nav aria-label="Ansichten">
      <button type="button" id="map-tab" aria-current="page">Karte</button>
      <button type="button" id="plan-tab" disabled>Beetplan</button>
    </nav>
    <span class="local-state" id="local-state">Lokaler Prototyp</span>
  </header>
  <main>
    <div class="workspace-title">
      <div><p class="location" id="place">Beispielgarten</p><h1 id="title">Garten erfassen</h1></div>
      <button type="button" class="quiet" id="open-garden" hidden>Gespeicherten Garten öffnen</button>
    </div>
    <section id="map-page" aria-labelledby="title" class="workspace">
      <figure class="surface map-surface">
        <div id="garden-map"></div>
        <figcaption><span>Luftbild des Beispielgartens</span><a id="image-source" target="_blank" rel="noopener">Bildquelle</a></figcaption>
      </figure>
      <aside class="surface side-panel" aria-label="Garten erfassen">
        <h2>Grundstück auswählen</h2>
        <p id="draw-help">Setze Eckpunkte um den Beispielgarten. Schließe das Polygon mit Enter.</p>
        <div class="actions">
          <button type="button" class="primary" id="begin-drawing">Grenze zeichnen</button>
          <button type="button" class="primary" id="finish-drawing" hidden disabled>Polygon schließen</button>
          <button type="button" class="quiet" id="cancel-drawing" hidden>Abbrechen</button>
          <button type="button" class="quiet" id="focus-image">Zum Beispielgarten</button>
        </div>
        <section id="analysis-section" class="panel-section" aria-labelledby="analysis-heading" hidden>
          <h2 id="analysis-heading">Luftbild auswerten</h2>
          <p id="method-summary"></p>
          <button type="button" class="primary" id="analyse">Luftbild auswerten</button>
          <div id="analysis-review" hidden>
            <h3>Vergleich mit Handumrissen</h3>
            <label class="switch"><input type="checkbox" id="show-reference"> Handumrisse einblenden</label>
            <ul class="results" id="results"></ul>
            <p class="secondary-text" id="review-details"></p>
          </div>
          <section id="outline-editor" class="panel-section" aria-labelledby="outline-heading" hidden>
            <h3 id="outline-heading">Konturen übernehmen</h3>
            <ul class="results" id="outlines"></ul>
            <div class="actions">
              <button type="button" class="quiet" id="add-bed">Beet einzeichnen</button>
              <button type="button" class="quiet" id="add-path">Weg einzeichnen</button>
              <button type="button" class="primary" id="use-plan">Zum Beetplan</button>
            </div>
          </section>
        </section>
      </aside>
    </section>
    <section id="plan-page" aria-labelledby="title" class="workspace" hidden>
      <figure class="surface plan-surface">
        <div id="garden-iso"></div>
        <figcaption id="plan-caption">Isometrische Ansicht</figcaption>
      </figure>
      <aside class="surface side-panel" aria-label="Beet bearbeiten">
        <h2 id="beet-heading">Beet auswählen</h2>
        <p id="beet-help">Wähle ein Beet in der Zeichnung.</p>
        <form id="culture-form" hidden>
          <label for="culture">Kultur</label>
          <select id="culture"></select>
          <button type="submit" class="primary">Belegung speichern</button>
        </form>
        <p id="culture-saved" class="saved-culture" hidden></p>
        <section id="saved-results" class="panel-section" hidden>
          <h3>Luftbildauswertung</h3>
          <p id="saved-summary"></p>
          <button type="button" class="quiet" id="back-to-results">Konturen auf der Karte prüfen</button>
        </section>
      </aside>
    </section>
    <p class="status" id="status" role="status" aria-live="polite"></p>
  </main>
`

const el = id => document.getElementById(id)
const setHidden = (id, hidden) => { el(id).hidden = hidden }
const status = message => { el('status').textContent = message }
const number = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 })
const percent = new Intl.NumberFormat('de-DE', { style: 'percent', maximumFractionDigits: 1 })

async function openExample() {
  const response = await fetch('./garden/fixture.json')
  if (!response.ok) throw new Error(`Beispielgarten konnte nicht geladen werden (HTTP ${response.status}).`)
  const fixture = await response.json()
  fixture.references ??= []
  const stored = readGarden(fixture.name)
  let saved = stored.garden
  let boundary = saved?.boundary ?? null
  let analysis = saved
  let selectedId = saved?.selectedId ?? null
  let drawing = false
  let outlineTitle = ''
  let busy = false

  el('place').textContent = [fixture.name, fixture.locality].filter(Boolean).join(' · ')
  el('image-source').href = fixture.image.attribution?.url ?? fixture.image.url
  el('method-summary').textContent = fixture.methodSummary ??
    'Die Analyse leitet Konturen aus den Bildpixeln ab. Handumrisse dienen dem Vergleich.'
  el('culture').append(new Option('Kultur wählen', ''), ...cultures.map(name => new Option(name, name)))
  el('culture').required = true

  const map = createGardenMap(el('garden-map'), {
    image: fixture.image,
    descriptionId: 'draw-help',
    gardenBoundary: boundary,
    onDraw(ring) {
      boundary = ring
      analysis = null
      el('show-reference').checked = false
      selectedId = null
      endDrawing()
      if (withinImage(fixture.image.extent, ring)) {
        status('Gartengrenze übernommen. Das Luftbild kann ausgewertet werden.')
      } else {
        status('Die Grenze liegt außerhalb des lokalen Luftbildausschnitts. Zeichne sie vollständig innerhalb des Luftbilds.')
      }
      renderReview()
    },
    onDraftChange({ points, canFinish }) {
      if (!drawing) return
      el('finish-drawing').disabled = !canFinish
      let hint = 'Ungültige Kontur. Entferne den letzten Punkt mit der Rücktaste.'
      if (canFinish) hint = 'Schließe mit Enter.'
      else if (points < 3) hint = 'Setze mindestens drei Punkte.'
      el('draw-help').textContent = points === 0
        ? `${outlineTitle}Setze den ersten Eckpunkt auf der Karte. Mit Escape brichst du ab.`
        : `${points} Eckpunkte gesetzt. ${hint}`
    },
    onCancel() {
      endDrawing()
      renderReview()
      status('Zeichnen abgebrochen.')
    },
    onImageError() {
      status('Das Luftbild konnte nicht angezeigt werden. Lade die Seite erneut.')
    },
  })

  function switchPage(page) {
    const inPlan = page === 'plan'
    if (inPlan && drawing) cancelDrawing()
    setHidden('map-page', inPlan)
    setHidden('plan-page', !inPlan)
    el('title').textContent = inPlan ? 'Beetplan' : 'Garten erfassen'
    const active = el(inPlan ? 'plan-tab' : 'map-tab')
    el(inPlan ? 'map-tab' : 'plan-tab').removeAttribute('aria-current')
    active.setAttribute('aria-current', 'page')
    if (inPlan) renderPlan()
    else requestAnimationFrame(() => map.updateSize?.())
  }

  function syncSavedControls() {
    el('plan-tab').disabled = !saved
    setHidden('open-garden', !saved)
    el('local-state').textContent = saved ? 'Lokal gespeichert' : 'Lokaler Prototyp'
  }

  function endDrawing() {
    drawing = false
    outlineTitle = ''
    setHidden('begin-drawing', false)
    setHidden('finish-drawing', true)
    setHidden('cancel-drawing', true)
    el('draw-help').textContent = boundary
      ? 'Die Gartengrenze ist auf der Karte markiert.'
      : 'Setze Eckpunkte um den Beispielgarten. Schließe das Polygon mit Enter.'
    el('begin-drawing').textContent = boundary ? 'Grenze neu zeichnen' : 'Grenze zeichnen'
  }

  function renderReview() {
    const inside = boundary && withinImage(fixture.image.extent, boundary)
    setHidden('analysis-section', !boundary)
    setHidden('outline-editor', !inside)
    el('analyse').disabled = busy || drawing || !inside
    el('analyse').textContent = busy ? 'Luftbild wird ausgewertet …' : 'Luftbild auswerten'
    setHidden('analysis-review', !analysis?.comparisons.length)
    const overlay = analysis?.objects ?? []
    const references = el('show-reference').checked ? fixture.references : []
    map.setObjects([...overlay, ...references])
    el('outlines').replaceChildren(...overlay.map(object => {
      const row = document.createElement('li')
      const name = document.createElement('strong')
      name.textContent = object.label
      const origin = document.createElement('span')
      origin.textContent = object.source === 'manual' ? 'Von Hand gezeichnet' : 'Aus dem Luftbild berechnet'
      const edit = document.createElement('button')
      edit.type = 'button'
      edit.className = 'quiet outline-edit'
      edit.textContent = `${object.label} neu zeichnen`
      edit.disabled = drawing || busy
      edit.addEventListener('click', () => drawOutline(object.kind, object))
      row.append(name, origin, edit)
      return row
    }))
    el('add-bed').disabled = drawing || busy
    el('add-path').disabled = drawing || busy
    el('use-plan').disabled = drawing || busy || !overlay.some(object => object.kind === 'bed')
    if (!analysis) return

    el('results').replaceChildren(...analysis.comparisons.map(comparison => {
      const row = document.createElement('li')
      const name = document.createElement('strong')
      name.textContent = comparison.label
      const detail = document.createElement('span')
      detail.textContent = comparison.iou == null ? 'Keine passende Kontur'
        : `${percent.format(comparison.iou)} Überlappung (IoU) · ${number.format(comparison.detectedArea)} m² erkannt / ${number.format(comparison.referenceArea)} m² von Hand markiert`
      row.append(name, detail)
      return row
    }))
    el('review-details').textContent = 'Die Messwerte beziehen sich auf berechnete Konturen. Gestrichelte Linien zeigen die Vergleichsumrisse.'
  }

  function startDrawing(onComplete) {
    drawing = true
    setHidden('begin-drawing', true)
    setHidden('finish-drawing', false)
    setHidden('cancel-drawing', false)
    el('finish-drawing').disabled = true
    status('')
    if (onComplete) el('garden-map').scrollIntoView({ block: 'nearest' })
    map.beginDrawing(onComplete)
    renderReview()
  }

  function cancelDrawing() {
    map.cancelDrawing()
    endDrawing()
    renderReview()
  }

  function drawOutline(kind, previous) {
    const name = kind === 'bed' ? 'Beet' : 'Weg'
    outlineTitle = previous ? `${previous.label} neu zeichnen. ` : `${name} einzeichnen. `
    startDrawing(ring => {
      endDrawing()
      if (!containsOutline(boundary, ring)) {
        status('Die neue Kontur muss vollständig innerhalb der Gartengrenze liegen.')
        renderReview()
        return
      }
      analysis ??= { comparisons: [], note: '', objects: [] }
      let index = 1
      while (analysis.objects.some(object => object.label === `${name} M${index}`)) index++
      const outline = {
        id: previous?.id ?? crypto.randomUUID(), label: previous?.label ?? `${name} M${index}`,
        kind, source: 'manual', ring,
      }
      const objects = previous
        ? analysis.objects.map(object => object.id === previous.id ? outline : object)
        : [...analysis.objects, outline]
      analysis = { ...analysis, objects }
      status(`${outline.label} in den Entwurf übernommen.`)
      renderReview()
    })
  }

  function renderPlan() {
    if (!saved) return
    const selected = saved.objects.find(object => object.id === selectedId && object.kind === 'bed')
    renderGardenIso(el('garden-iso'), {
      boundary: saved.boundary,
      objects: saved.objects,
      selectedId: selected?.id ?? null,
      cultureById: saved.cultures,
      onSelect(id) {
        selectedId = id
        renderPlan()
        el('culture').focus({ preventScroll: true })
      },
    })
    const culture = selected ? saved.cultures[selected.id] ?? '' : ''
    el('beet-heading').textContent = selected?.label ?? 'Beet auswählen'
    el('beet-help').textContent = selected
      ? (selected.source === 'detected' ? 'Kontur aus dem Luftbild' : 'Von Hand markierte Kontur')
      : 'Wähle ein Beet in der Zeichnung.'
    setHidden('culture-form', !selected)
    el('culture').value = culture
    setHidden('culture-saved', !culture)
    el('culture-saved').textContent = culture ? `${culture} · gespeichert` : ''
    setHidden('saved-results', false)
    const beds = saved.objects.filter(object => object.kind === 'bed').length
    const paths = saved.objects.filter(object => object.kind === 'path').length
    el('saved-summary').textContent = `${beds} ${beds === 1 ? 'Beet' : 'Beete'}, ${paths} ${paths === 1 ? 'Weg' : 'Wege'}`
  }

  function persist(garden, message) {
    try {
      const { backedUp } = saveGarden(garden)
      saved = garden
      syncSavedControls()
      status(backedUp ? message : `${message} Die lokale Sicherungskopie konnte nicht aktualisiert werden.`)
      return true
    } catch {
      status('Der Browser konnte den Garten nicht lokal speichern.')
      return false
    }
  }

  function reopen() {
    if (drawing) map.cancelDrawing()
    boundary = saved.boundary
    analysis = saved
    selectedId = saved.selectedId
    map.setBoundary(boundary)
    endDrawing()
    renderReview()
    switchPage('plan')
    status('Gespeicherten Garten geöffnet.')
  }

  el('begin-drawing').addEventListener('click', () => startDrawing())
  el('finish-drawing').addEventListener('click', () => map.finishDrawing())
  el('cancel-drawing').addEventListener('click', cancelDrawing)
  el('add-bed').addEventListener('click', () => drawOutline('bed'))
  el('add-path').addEventListener('click', () => drawOutline('path'))
  el('focus-image').addEventListener('click', () => map.focusImage())
  el('map-tab').addEventListener('click', () => switchPage('map'))
  el('plan-tab').addEventListener('click', () => switchPage('plan'))
  el('back-to-results').addEventListener('click', () => {
    if (drawing) map.cancelDrawing()
    boundary = saved.boundary
    analysis = saved
    map.setBoundary(boundary)
    endDrawing()
    renderReview()
    switchPage('map')
  })
  el('open-garden').addEventListener('click', reopen)
  el('show-reference').addEventListener('change', renderReview)

  el('analyse').addEventListener('click', async () => {
    busy = true
    const selectedBoundary = boundary
    renderReview()
    try {
      const result = await analyseGarden(fixture, selectedBoundary)
      if (boundary === selectedBoundary) {
        const manual = (analysis?.objects ?? []).filter(object => object.source === 'manual')
        const replaced = new Set(manual.map(object => object.id))
        analysis = { ...result, objects: [...result.objects.filter(object => !replaced.has(object.id)), ...manual] }
        status(result.objects.length ? 'Luftbild ausgewertet.' : 'Im gewählten Ausschnitt wurden keine Konturen gefunden.')
      }
    } catch (error) {
      if (boundary === selectedBoundary) status(error.message)
    } finally {
      busy = false
      renderReview()
    }
  })
  el('use-plan').addEventListener('click', () => {
    const availableBeds = new Set(analysis.objects.filter(object => object.kind === 'bed').map(object => object.id))
    const existingCultures = Object.entries(saved?.cultures ?? {}).filter(([id]) => availableBeds.has(id))
    const garden = {
      fixtureName: fixture.name,
      boundary,
      objects: analysis.objects,
      comparisons: analysis.comparisons,
      note: analysis.note,
      cultures: Object.fromEntries(existingCultures),
      selectedId: availableBeds.has(saved?.selectedId) ? saved.selectedId : null,
    }
    if (persist(garden, 'Garten lokal gespeichert.')) {
      selectedId = garden.selectedId
      switchPage('plan')
    }
  })
  el('culture-form').addEventListener('submit', event => {
    event.preventDefault()
    const culture = el('culture').value
    if (!selectedId || !cultures.includes(culture)) return
    const garden = { ...saved, selectedId, cultures: { ...saved.cultures, [selectedId]: culture } }
    if (persist(garden, `${culture} für das ausgewählte Beet gespeichert.`)) renderPlan()
  })

  syncSavedControls()
  endDrawing()
  renderReview()
  if (stored.recovered) status('Der Garten wurde aus der lokalen Sicherung geladen.')
}

openExample().catch(error => {
  el('begin-drawing').disabled = true
  el('focus-image').disabled = true
  status(error.message)
})
