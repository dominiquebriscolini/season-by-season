import './garden-iso.css';

const svgNamespace = 'http://www.w3.org/2000/svg';
const metresPerDegree = 111195;
const viewWidth = 760;
const viewHeight = 430;
let nextSceneId = 0;

function element(name, attributes = {}, content) {
  const node = document.createElementNS(svgNamespace, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  if (content !== undefined) node.textContent = content;
  return node;
}

function bounds(points) {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
}

function pointList(points) {
  return points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
}

function projectGround(east, north) {
  return [(east + north) * Math.sqrt(3) / 2, (east - north) / 2];
}

function projection(boundary) {
  const [lon0, lat0] = boundary[0];
  const eastScale = metresPerDegree * Math.cos(lat0 * Math.PI / 180);
  const project = ([lon, lat]) => {
    const east = (lon - lon0) * eastScale;
    const north = (lat - lat0) * metresPerDegree;
    return projectGround(east, north);
  };
  const { left, right, top, bottom } = bounds(boundary.map(project));
  const scale = Math.min(550 / (right - left), 318 / (bottom - top));
  const midX = (left + right) / 2;
  const midY = (top + bottom) / 2;
  return {
    scale,
    projectRing: (ring) => ring.map(project).map(([x, y]) => [viewWidth / 2 + (x - midX) * scale, viewHeight / 2 - 5 + (y - midY) * scale]),
  };
}

function addPattern(defs, id, name, width, height, strokes) {
  const pattern = element('pattern', { id, width, height, patternUnits: 'userSpaceOnUse' });
  pattern.append(element('path', { class: `iso-${name}-hatch`, d: strokes }));
  defs.append(pattern);
}

function inside([x, y], points) {
  let contained = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) contained = !contained;
  }
  return contained;
}

function addPlants(group, points, clipId) {
  const { left, right, top, bottom } = bounds(points);
  const plants = element('g', { class: 'iso-plants', 'clip-path': `url(#${clipId})`, 'aria-hidden': 'true' });
  let row = 0;
  for (let y = top + 6; y < bottom; y += 12, row++) {
    for (let x = left + 5 + (row % 2) * 6; x < right; x += 16) {
      if (!inside([x, y], points)) continue;
      plants.append(element('path', {
        transform: `translate(${x} ${y})`,
        d: 'M 0 2 l 0 -6 m 0 3 l -3 -2 m 3 2 l 3 -3 m -5 2 l -2 -2 m 5 0 l 1 -3',
      }));
    }
  }
  group.append(plants);
}

function addOrientation(svg, scale) {
  const orientation = element('g', { class: 'iso-annotation', 'aria-hidden': 'true' });
  const northArrow = element('path');
  const northLabel = element('text', {'text-anchor': 'middle', 'dominant-baseline': 'middle'}, 'N');
  const ruler = element('line', {class: 'iso-ruler-line'});
  const rulerTicks = element('path', {class: 'iso-ruler-ticks'});
  const rulerLabel = element('text', {'text-anchor': 'middle', 'dominant-baseline': 'middle'});
  const format = new Intl.NumberFormat('de', { maximumSignificantDigits: 2 });
  let view = {angle: 0, zoom: 1};
  orientation.append(northArrow, northLabel, ruler, rulerTicks, rulerLabel);
  svg.append(orientation);
  return (cameraView = view) => {
    view = cameraView;
    const {angle, zoom} = view;
    const box = svg.viewBox.baseVal;
    const right = box.x + box.width;
    const bottom = box.y + box.height;
    const arrowX = right - Math.min(110, box.width * .25);
    const arrowY = box.y + Math.min(83, box.height * .37);
    const direction = angle * Math.PI / 180;
    const sin = Math.sin(direction);
    const cos = Math.cos(direction);
    const [northX, northY] = projectGround(-sin, cos);
    const length = Math.hypot(northX, northY);
    const [x, y] = [northX / length, northY / length];
    const point = (forward, sideways = 0) => [arrowX + x * forward - y * sideways, arrowY + y * forward + x * sideways];
    northArrow.setAttribute('d', `M ${point(0)} L ${point(28)} M ${point(21, -4)} L ${point(28)} L ${point(21, 4)}`);
    const label = point(41);
    northLabel.setAttribute('x', label[0]);
    northLabel.setAttribute('y', label[1]);

    const left = box.x + Math.min(57, box.width * .1);
    const base = bottom - Math.min(44, box.height * .24);
    const scaledMetre = scale * zoom;
    // Reserve room for the longest projection of a ground vector through the whole turn.
    const maxMetres = Math.min(100, box.width * .24, box.height * .32) / (scaledMetre * Math.sqrt(1.5));
    const decade = 10 ** Math.floor(Math.log10(maxMetres));
    const metres = [5, 2, 1].map(digit => digit * decade).find(distance => distance <= maxMetres) ?? decade;
    const [width, height] = projectGround(cos, sin).map(component => component * metres * scaledMetre);
    const startX = left - Math.min(width, 0);
    const startY = base - Math.max(height, 0);
    const endX = startX + width;
    const endY = startY + height;
    ruler.setAttribute('x1', startX);
    ruler.setAttribute('y1', startY);
    ruler.setAttribute('x2', endX);
    ruler.setAttribute('y2', endY);
    const tick = (cx, cy) => `M ${cx - x * 4} ${cy - y * 4} L ${cx + x * 4} ${cy + y * 4}`;
    rulerTicks.setAttribute('d', `${tick(startX, startY)} ${tick(endX, endY)}`);
    rulerLabel.setAttribute('x', (startX + endX) / 2);
    rulerLabel.setAttribute('y', base + Math.min(20, (bottom - base) * .55));
    rulerLabel.textContent = `${format.format(metres)} m`;
  };
}

function addObject(svg, defs, object, geometry, sceneId, index, selectedId, culture, onSelect) {
  const path = geometry.flatMap(polygon => polygon.map(ring => `M ${pointList(ring)} Z`)).join(' ');
  if (!path) return;
  const outline = { d: path, 'fill-rule': 'evenodd' };
  const selectable = object.selectable ?? object.kind === 'bed';
  const group = element('g', { class: `iso-object iso-${object.kind}`, 'data-source': object.source });
  if (object.fieldId !== undefined) group.dataset.fieldId = object.fieldId;
  group.append(element('title', {}, culture ? `${object.label} · ${culture}` : object.label));
  group.append(element('path', { class: 'iso-object-fill', ...outline }));
  if (['bed', 'path'].includes(object.kind)) {
    group.append(element('path', { class: 'iso-object-lines', fill: `url(#${sceneId}-${object.kind})`, ...outline }));
  }

  if (selectable) {
    group.setAttribute('role', 'button');
    group.setAttribute('tabindex', '0');
    group.setAttribute('aria-label', object.label);
    group.setAttribute('aria-pressed', String(object.id === selectedId));
    group.dataset.bedId = object.id;
    if (culture) {
      group.setAttribute('aria-description', culture);
      const clipId = `${sceneId}-plant-${index}`;
      const clip = element('clipPath', { id: clipId });
      clip.append(element('path', { ...outline, 'clip-rule': 'evenodd' }));
      defs.append(clip);
      for (const [outer] of geometry) addPlants(group, outer, clipId);
    }
    group.addEventListener('click', () => onSelect(object.id));
    group.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelect(object.id);
      }
    });
  }
  svg.append(group);
}

function addLegend(container, objects, cultureById) {
  const entries = [
    ['bed', 'Beet', objects.some(({ kind }) => kind === 'bed')],
    ['path', 'Weg', objects.some(({ kind }) => kind === 'path')],
    ['plant', 'Bepflanzt', objects.some(({ id }) => cultureById[id])],
  ];
  const legend = document.createElement('ul');
  legend.className = 'iso-legend';
  legend.setAttribute('aria-label', 'Kartenlegende');
  for (const [kind, label, visible] of entries) {
    if (!visible) continue;
    const item = document.createElement('li');
    const key = document.createElement('span');
    key.setAttribute('aria-hidden', 'true');
    key.className = `iso-key iso-key-${kind}`;
    item.append(key, label);
    legend.append(item);
  }
  if (legend.childElementCount) container.append(legend);
}

export function renderGardenIso(container, {
  boundary, objects, selectedId, onSelect, cultureById, camera, cameraView, referenceBoundary = boundary,
  addUnderlay,
}) {
  const focusedId = container.contains(document.activeElement) ? document.activeElement.dataset.bedId : undefined;
  container.replaceChildren();
  if (boundary.length < 4) return;

  const sceneId = `garden-iso-${++nextSceneId}`;
  const { scale, projectRing } = projection(referenceBoundary);
  const svg = element('svg', { class: 'garden-iso', viewBox: `0 0 ${viewWidth} ${viewHeight}`, role: 'group', 'aria-label': 'Isometrischer Gartenplan' });
  const defs = element('defs');
  addPattern(defs, `${sceneId}-ground`, 'ground', 20, 17, 'M 3 4 l 3 -1.7 M 13 13 l 2 -1.2 M 8 15 l 1 -0.6');
  addPattern(defs, `${sceneId}-bed`, 'bed', 14, 10, 'M 1 3 l 5 -2.9 M 8 8 l 5 -2.9');
  addPattern(defs, `${sceneId}-path`, 'path', 12, 9, 'M 2 2 l 2 1.2 M 8 5 l 2 1.2');
  svg.append(defs);
  const world = camera ? element('g', {'data-iso-world': ''}) : svg;
  if (camera) svg.append(world);

  const ground = pointList(projectRing(boundary));
  const shadow = element('polygon', { class: 'iso-ground-shadow', points: ground, transform: 'translate(3 17)' });
  const edge = element('polygon', { class: 'iso-ground-edge', points: ground, transform: 'translate(0 8)' });
  world.append(shadow, edge);
  world.append(element('polygon', { class: 'iso-ground', points: ground }));
  world.append(element('polygon', { class: 'iso-ground-hatching', points: ground, fill: `url(#${sceneId}-ground)` }));
  const aerial = addUnderlay?.({svg, world, defs, ground, clipId: `${sceneId}-aerial`, projectRing});

  const ordered = [...objects.filter(({ kind }) => kind === 'path'), ...objects.filter(({ kind }) => kind !== 'path')];
  ordered.forEach((object, index) => {
    const geometry = (object.geometry ?? [[object.ring]]).map(polygon => polygon.map(projectRing));
    addObject(world, defs, object, geometry, sceneId, index, selectedId, cultureById[object.id], onSelect);
  });
  world.append(element('polygon', { class: 'iso-boundary', points: ground }));
  const orient = addOrientation(svg, scale);
  orient({angle: 0, zoom: 1});
  const toolbar = camera?.mount({
    svg, world, viewId: cameraView, center: [viewWidth / 2, viewHeight / 2],
    onViewChange(view) {
      orient(view);
      const radians = view.angle * Math.PI / 180;
      const cosine = Math.cos(radians);
      const sine = Math.sin(radians);
      // Ground elevation and shadow offsets stay in screen space.
      const offset = (x, y) => `translate(${cosine * x - Math.sqrt(3) * sine * y} ${sine * x / Math.sqrt(3) + cosine * y})`;
      shadow.setAttribute('transform', offset(3, 17));
      edge.setAttribute('transform', offset(0, 8));
      aerial?.refresh();
    },
  });
  if (toolbar) container.append(toolbar);
  container.append(svg);
  if (aerial) container.append(aerial.bar);
  addLegend(container, objects, cultureById);

  if (focusedId) Array.from(svg.querySelectorAll('[data-bed-id]')).find((bed) => bed.dataset.bedId === focusedId)?.focus({ preventScroll: true });
  function fitViewport({width, height}, fit) {
    aerial?.refresh();
    if (width <= 0 || height <= 0 || fit.width <= 0 || fit.height <= 0) return;
    // Fit in the panel-free box, then crop symmetrically about the camera center.
    const scale = Math.min(fit.width / viewWidth, fit.height / viewHeight);
    // SVGRect stores single-precision dimensions. Center using those same values.
    const visibleWidth = Math.fround(width / scale);
    const visibleHeight = Math.fround(height / scale);
    const box = `${(viewWidth - visibleWidth) / 2} ${(viewHeight - visibleHeight) / 2} ${visibleWidth} ${visibleHeight}`;
    if (svg.getAttribute('viewBox') === box) return;
    svg.setAttribute('viewBox', box);
    orient();
  }
  return { svg, world, projectRing, toolbar, fitViewport, setAerial: aerial?.setEnabled };
}
