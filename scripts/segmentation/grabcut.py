"""Segment each prompted object independently. This runner never loads comparisons."""

import argparse
from hashlib import sha256
import json
from math import atan, degrees, exp, isfinite, log, pi, radians, tan
from pathlib import Path
from time import perf_counter

import cv2 as cv
import numpy as np


ROOT = Path(__file__).resolve().parents[2]
EARTH_RADIUS = 6378137
ITERATIONS = 5
SEED_RADIUS = 2
MIN_MASK_PIXELS = 20
SIMPLIFY_PX = 1


def project(lon, lat):
    return EARTH_RADIUS * radians(lon), EARTH_RADIUS * log(tan(pi / 4 + radians(lat) / 2))


def unproject(x, y):
    return degrees(x / EARTH_RADIUS), degrees(2 * atan(exp(y / EARTH_RADIUS)) - pi / 2)


def segment(image, parcel_mask, points):
    height, width = image.shape[:2]
    if len(points) != 3 or any(len(point) != 2 for point in points):
        return None, "Two box corners and one interior point are required."
    if not all(isfinite(value) for point in points for value in point):
        return None, "Prompt points must be finite."
    a, b, seed = [tuple(map(int, map(round, point))) for point in points]
    left, right = sorted((a[0], b[0]))
    top, bottom = sorted((a[1], b[1]))
    seed_x, seed_y = seed
    if not (0 <= left < seed_x < right < width and 0 <= top < seed_y < bottom < height):
        return None, "The foreground point must be strictly inside a box in the image."
    if not parcel_mask[seed_y, seed_x]:
        return None, "The foreground point is outside the garden."

    mask = np.full((height, width), cv.GC_BGD, dtype=np.uint8)
    mask[top : bottom + 1, left : right + 1] = cv.GC_PR_FGD
    # OpenCV uses hard foreground labels only where a user supplied a positive hint.
    cv.circle(mask, seed, SEED_RADIUS, cv.GC_FGD, thickness=cv.FILLED)
    mask[~parcel_mask] = cv.GC_BGD
    cv.setRNGSeed(0)
    try:
        cv.grabCut(image, mask, None, None, None, ITERATIONS, cv.GC_INIT_WITH_MASK)
    except cv.error:
        return None, "OpenCV could not fit foreground and background for this prompt."

    binary = np.isin(mask, (cv.GC_FGD, cv.GC_PR_FGD)).astype(np.uint8)
    _, labels, statistics, _ = cv.connectedComponentsWithStats(binary, connectivity=4)
    seed_label = labels[seed_y, seed_x]
    if seed_label == 0 or statistics[seed_label, cv.CC_STAT_AREA] < MIN_MASK_PIXELS:
        return None, "The seeded segment has fewer than 20 pixels."

    component = (labels == seed_label).astype(np.uint8)
    contours, _ = cv.findContours(component, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)
    contour = max(contours, key=cv.contourArea)
    polygon = cv.approxPolyDP(contour, SIMPLIFY_PX, closed=True).reshape(-1, 2).tolist()
    if len(polygon) < 3 or cv.contourArea(np.asarray(polygon, dtype=np.int32)) == 0:
        return None, "The contour could not form an area."

    return [*polygon, polygon[0]], None


def run(fixture_file, input_file, output_file):
    fixture_bytes = fixture_file.read_bytes()
    input_bytes = input_file.read_bytes()
    fixture = json.loads(fixture_bytes)
    recording = json.loads(input_bytes)
    if 'references' in fixture:
        raise ValueError('Use the raw fixture without reference polygons.')
    if recording['method'] != 'segment':
        raise ValueError('Expected segment-input JSON.')

    image_path = ROOT / fixture['image']['url'].lstrip('/')
    image_bytes = image_path.read_bytes()
    image = cv.imdecode(np.frombuffer(image_bytes, dtype=np.uint8), cv.IMREAD_COLOR)
    if image is None:
        raise ValueError(f'OpenCV could not decode {image_path}')
    height, width = image.shape[:2]
    if fixture['image']['size'] != [width, height]:
        raise ValueError('Image dimensions differ from the fixture.')
    west, south, east, north = fixture['image']['projectedExtent']
    original_rings = []
    for lon, lat in fixture['suggestedBoundary']:
        x, y = project(lon, lat)
        original_rings.append([round((x - west) * width / (east - west)), round((north - y) * height / (north - south))])
    parcel_mask = np.zeros((height, width), dtype=np.uint8)
    cv.fillPoly(parcel_mask, [np.asarray(original_rings, dtype=np.int32)], 1)
    parcel_mask = parcel_mask.astype(bool)

    cv.setNumThreads(1)
    cv.setUseOptimized(False)
    objects = []
    attempts = []
    compute_start = perf_counter()
    for index, prompt in enumerate(recording['objects'], start=1):
        kind = prompt['kind']
        if kind not in ('bed', 'path'):
            raise ValueError(f'Unexpected object type: {kind}')
        start = perf_counter()
        polygon, failure = segment(image, parcel_mask, prompt['points'])
        object_id = f'segment-{index}'
        attempts.append({'id': object_id, 'kind': kind, 'runtimeMs': round((perf_counter() - start) * 1000, 3), 'failure': failure})
        if failure:
            continue
        ring = [
            unproject(west + (x + 0.5) * (east - west) / width, north - (y + 0.5) * (north - south) / height)
            for x, y in polygon
        ]
        objects.append({'id': object_id, 'kind': kind, 'ring': ring})

    result = {
        'method': 'segment',
        'implementation': f'OpenCV {cv.__version__} GrabCut, NumPy {np.__version__}',
        'iterations': ITERATIONS,
        'seedRadiusPx': SEED_RADIUS,
        'minimumMaskPixels': MIN_MASK_PIXELS,
        'simplifyPx': SIMPLIFY_PX,
        'fixtureSha256': sha256(fixture_bytes).hexdigest(),
        'imageSha256': sha256(image_bytes).hexdigest(),
        'inputSha256': sha256(input_bytes).hexdigest(),
        'sourceSha256': sha256(Path(__file__).read_bytes()).hexdigest(),
        'runtimeMs': round((perf_counter() - compute_start) * 1000, 3),
        'objects': objects,
        'attempts': attempts,
    }
    with output_file.open('x', encoding='utf-8', newline='\n') as stream:
        json.dump(result, stream, indent=2)
        stream.write('\n')
    print(f'{len(objects)}/{len(attempts)} polygons; {result["runtimeMs"]:.1f} ms')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('fixture', type=Path)
    parser.add_argument('recording', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    run(args.fixture, args.recording, args.output)
