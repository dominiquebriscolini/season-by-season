import 'ol/ol.css';
import polygonClipping from 'polygon-clipping';
import './garden-map.css';
import Feature from 'ol/Feature.js';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import { defaults as defaultControls } from 'ol/control/defaults.js';
import { never } from 'ol/events/condition.js';
import Polygon from 'ol/geom/Polygon.js';
import Draw from 'ol/interaction/Draw.js';
import { defaults as defaultInteractions } from 'ol/interaction/defaults.js';
import ImageLayer from 'ol/layer/Image.js';
import TileLayer from 'ol/layer/Tile.js';
import VectorLayer from 'ol/layer/Vector.js';
import { fromLonLat, toLonLat, transformExtent } from 'ol/proj.js';
import ImageStatic from 'ol/source/ImageStatic.js';
import OSM from 'ol/source/OSM.js';
import VectorSource from 'ol/source/Vector.js';
import CircleStyle from 'ol/style/Circle.js';
import Fill from 'ol/style/Fill.js';
import Stroke from 'ol/style/Stroke.js';
import Style from 'ol/style/Style.js';

const mapProjection = 'EPSG:3857';
const geographicProjection = 'EPSG:4326';
const boundaryStyle = new Style({
  fill: new Fill({ color: 'rgba(241, 221, 127, 0.15)' }),
  stroke: new Stroke({ color: '#fff0a2', width: 2.5 }),
});
const draftStyle = new Style({
  fill: new Fill({ color: 'rgba(241, 221, 127, 0.18)' }),
  stroke: new Stroke({ color: '#fff0a2', width: 2.5, lineDash: [8, 4] }),
  image: new CircleStyle({
    radius: 5,
    fill: new Fill({ color: '#fff0a2' }),
    stroke: new Stroke({ color: '#293528', width: 1.5 }),
  }),
});
const objectStyles = Object.fromEntries(['bed', 'path'].map((kind) => [
  kind,
  Object.fromEntries([false, true].map((manual) => [manual, new Style({
    fill: new Fill({ color: kind === 'path' ? 'rgba(249, 201, 120, .37)' : 'rgba(110, 214, 172, .3)' }),
    stroke: new Stroke({ color: kind === 'path' ? '#ffca79' : '#91f0bb', width: 2, lineDash: manual ? [4, 3] : undefined }),
  })])),
]));

function signedCross(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function onSegment(a, b, p) {
  return p[0] >= Math.min(a[0], b[0]) && p[0] <= Math.max(a[0], b[0])
    && p[1] >= Math.min(a[1], b[1]) && p[1] <= Math.max(a[1], b[1]);
}

function segmentsIntersect(a, b, c, d) {
  const abc = signedCross(a, b, c);
  const abd = signedCross(a, b, d);
  const cda = signedCross(c, d, a);
  const cdb = signedCross(c, d, b);
  return (abc === 0 && onSegment(a, b, c)) || (abd === 0 && onSegment(a, b, d))
    || (cda === 0 && onSegment(c, d, a)) || (cdb === 0 && onSegment(c, d, b))
    || (abc * abd < 0 && cda * cdb < 0);
}

function isSimplePolygon(points) {
  const n = points.length;
  if (n < 3 || new Set(points.map(([x, y]) => `${x},${y}`)).size !== n) return false;

  let area = 0;
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    area += signedCross(points[0], points[i], points[next]);
    for (let j = i + 2; j < n; j++) {
      const otherNext = (j + 1) % n;
      if (otherNext === i) continue;
      if (segmentsIntersect(points[i], points[next], points[j], points[otherNext])) return false;
    }
  }
  return Math.abs(area) > 1e-8;
}

function polygonFeature(ring) {
  return new Feature(new Polygon([ring.map((point) => fromLonLat(point))]));
}

export function containsOutline(boundary, outline) {
  const origin = fromLonLat(boundary[0]);
  const local = (ring) => ring.map((point) => {
    const [x, y] = fromLonLat(point);
    return [x - origin[0], y - origin[1]];
  });
  return polygonClipping.difference([local(outline)], [local(boundary)]).length === 0;
}

function appendImageCredit(container, attribution) {
  if (!attribution) return null;
  const credit = document.createElement('div');
  credit.className = 'garden-map__image-credit';
  if (typeof attribution === 'string' || !attribution.url) {
    credit.textContent = typeof attribution === 'string' ? attribution : attribution.text;
  } else {
    const link = document.createElement('a');
    link.href = attribution.url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = attribution.text;
    credit.append(link);
  }
  container.append(credit);
  return credit;
}

export function createGardenMap(container, {
  image,
  onDraw,
  onDraftChange,
  gardenBoundary,
  onImageError,
  onCancel,
  label = 'Gartenkarte',
  descriptionId,
  drawing = false,
} = {}) {
  const previousTabIndex = container.getAttribute('tabindex');
  const addedRole = !container.hasAttribute('role');
  const addedLabel = !container.hasAttribute('aria-label') && !container.hasAttribute('aria-labelledby');
  const addedDescription = descriptionId && !container.hasAttribute('aria-describedby');
  container.classList.add('garden-map');
  if (previousTabIndex === null) container.tabIndex = 0;
  if (addedRole) container.setAttribute('role', 'region');
  if (addedLabel) container.setAttribute('aria-label', label);
  if (addedDescription) container.setAttribute('aria-describedby', descriptionId);
  const boundarySource = new VectorSource({ wrapX: false });
  const objectSource = new VectorSource({ wrapX: false });
  const layers = [new TileLayer({ source: new OSM({ maxZoom: 19 }) })];
  let imageExtent;
  if (image) {
    const projection = image.projection ?? geographicProjection;
    const sourceExtent = image.projectedExtent ?? transformExtent(image.extent, geographicProjection, projection);
    imageExtent = transformExtent(sourceExtent, projection, mapProjection);
    const imageSource = new ImageStatic({ url: image.url, imageExtent: sourceExtent, projection });
    imageSource.on('imageloaderror', () => onImageError?.());
    layers.push(new ImageLayer({ source: imageSource }));
  }
  layers.push(
    new VectorLayer({
      source: objectSource,
      style: (feature) => objectStyles[feature.get('kind') === 'path' ? 'path' : 'bed'][feature.get('manual')],
    }),
    new VectorLayer({ source: boundarySource, style: boundaryStyle }),
  );
  const view = new View({
    center: fromLonLat([0, 0]),
    zoom: 2,
    maxZoom: 23,
    enableRotation: false,
  });
  const map = new Map({
    target: container,
    view,
    layers,
    controls: defaultControls({
      attributionOptions: { collapsible: false },
      rotate: false,
      zoomOptions: { zoomInTipLabel: 'Vergrößern', zoomOutTipLabel: 'Verkleinern' },
    }),
    interactions: defaultInteractions({ altShiftDragRotate: false, pinchRotate: false, doubleClickZoom: false }),
  });
  const imageCredit = appendImageCredit(container, image?.attribution);
  let draftPoints = [];
  let canFinish = false;
  let finishing = false;
  let onOutline;

  function updateDraft(points, valid) {
    const changed = draftPoints.length !== points.length || canFinish !== valid;
    draftPoints = points;
    canFinish = valid;
    if (changed) onDraftChange?.({ points: points.length, canFinish });
  }

  const draw = new Draw({
    type: 'Polygon',
    style: draftStyle,
    finishCondition: never,
    freehandCondition: never,
    snapTolerance: 3,
    stopClick: true,
    wrapX: false,
    geometryFunction([ring], geometry = new Polygon([])) {
      // OpenLayers keeps a trailing cursor point until finishDrawing().
      if (!finishing && ring.length - 1 !== draftPoints.length) {
        const points = ring.slice(0, -1);
        updateDraft(points, isSimplePolygon(points));
      }
      geometry.setCoordinates(ring.length ? [[...ring, ring[0]]] : []);
      return geometry;
    },
  });
  draw.setActive(false);
  map.addInteraction(draw);

  function setBoundary(ring) {
    boundarySource.clear();
    if (ring?.length >= 4) boundarySource.addFeature(polygonFeature(ring));
  }

  draw.on('drawend', ({ feature }) => {
    const [ring] = feature.getGeometry().getCoordinates();
    const coordinates = ring.map((point) => toLonLat(point));
    updateDraft([], false);
    if (onOutline) onOutline(coordinates);
    else {
      setBoundary(coordinates);
      onDraw?.(coordinates);
    }
  });

  function focusImage() {
    if (!imageExtent) return;
    map.updateSize();
    const size = map.getSize();
    if (size?.every((dimension) => dimension > 0)) {
      view.fit(imageExtent, { size, padding: [22, 22, 22, 22], maxZoom: 22 });
    }
  }

  function beginDrawing(completeOutline) {
    onOutline = completeOutline;
    draw.setActive(true);
    container.classList.add('garden-map--drawing');
    container.focus({ preventScroll: true });
    onDraftChange?.({ points: draftPoints.length, canFinish });
  }

  function cancelDrawing() {
    draw.abortDrawing();
    draw.setActive(false);
    onOutline = undefined;
    container.classList.remove('garden-map--drawing');
    updateDraft([], false);
  }

  function finishDrawing() {
    if (!canFinish) return false;
    finishing = true;
    let completed;
    try {
      completed = draw.finishDrawing();
    } finally {
      finishing = false;
    }
    if (!completed) return false;
    cancelDrawing();
    return true;
  }

  function handleKey(event) {
    if (!draw.getActive() || event.target !== container) return;
    if (event.key === 'Enter' && draftPoints.length) {
      event.preventDefault();
      event.stopPropagation();
      finishDrawing();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancelDrawing();
      onCancel?.();
    } else if (event.key === 'Backspace' && draftPoints.length) {
      event.preventDefault();
      if (draftPoints.length === 1) {
        draw.abortDrawing();
        updateDraft([], false);
      } else {
        draw.removeLastPoint();
      }
    }
  }

  container.addEventListener('keydown', handleKey);
  setBoundary(gardenBoundary);
  focusImage();
  if (drawing) beginDrawing();

  return {
    beginDrawing,
    cancelDrawing,
    finishDrawing,
    focusImage,
    setBoundary,
    updateSize() { map.updateSize(); },
    getPixelFromLonLat(point) { return map.getPixelFromCoordinate(fromLonLat(point)); },
    clearDrawing() {
      cancelDrawing();
      setBoundary(null);
    },
    setObjects(objects = []) {
      objectSource.clear();
      objectSource.addFeatures(objects.filter(({ ring }) => ring?.length >= 4).map(({ ring, kind, source }) => {
        const feature = polygonFeature(ring);
        feature.setProperties({ kind, manual: source === 'reference' });
        return feature;
      }));
    },
    dispose() {
      container.removeEventListener('keydown', handleKey);
      imageCredit?.remove();
      map.dispose();
      container.classList.remove('garden-map', 'garden-map--drawing');
      if (previousTabIndex === null) container.removeAttribute('tabindex');
      if (addedRole) container.removeAttribute('role');
      if (addedLabel) container.removeAttribute('aria-label');
      if (addedDescription) container.removeAttribute('aria-describedby');
    },
  };
}
