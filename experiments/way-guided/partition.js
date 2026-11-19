import InteriorPointArea from 'jsts/org/locationtech/jts/algorithm/InteriorPointArea.js'
import SimplePointInAreaLocator from 'jsts/org/locationtech/jts/algorithm/locate/SimplePointInAreaLocator.js'
import Coordinate from 'jsts/org/locationtech/jts/geom/Coordinate.js'
import Location from 'jsts/org/locationtech/jts/geom/Location.js'
import GeoJSONReader from 'jsts/org/locationtech/jts/io/GeoJSONReader.js'
import GeoJSONWriter from 'jsts/org/locationtech/jts/io/GeoJSONWriter.js'
import Polygonizer from 'jsts/org/locationtech/jts/operation/polygonize/Polygonizer.js'
import UnaryUnionOp from 'jsts/org/locationtech/jts/operation/union/UnaryUnionOp.js'

const reader = new GeoJSONReader()
const writer = new GeoJSONWriter()

function forNoding([start, end]) {
  // Cross the computed target by a subpixel amount to node it even after rounding.
  // The dangling tail is discarded; rendered/exported coordinates keep the actual hit.
  const length = Math.hypot(end[0] - start[0], end[1] - start[1])
  return [start, end.map((value, i) => value + 1e-7 * (value - start[i]) / length)]
}

function interiorProbe(face) {
  const probe = InteriorPointArea.getInteriorPoint(face)
  if (probe && SimplePointInAreaLocator.locate(probe, face) === Location.INTERIOR) return probe

  // Coincident edges can leave a collinear spur at the preferred scanline.
  const rings = [face.getExteriorRing(), ...Array.from({length: face.getNumInteriorRing()}, (_, i) => face.getInteriorRingN(i))]
    .map(ring => ring.getCoordinates())
  const ordinates = [...new Set(rings.flatMap(ring => ring.map(point => point.y)))].sort((a, b) => a - b)
  for (let i = 1; i < ordinates.length; i++) {
    const y = (ordinates[i - 1] + ordinates[i]) / 2
    const crossings = rings.flatMap(ring => ring.slice(1).flatMap((b, j) => {
      const a = ring[j]
      return (a.y > y) !== (b.y > y) ? [a.x + (y - a.y) * (b.x - a.x) / (b.y - a.y)] : []
    })).sort((a, b) => a - b)
    for (let j = 1; j < crossings.length; j += 2) {
      const point = new Coordinate((crossings[j - 1] + crossings[j]) / 2, y)
      if (SimplePointInAreaLocator.locate(point, face) === Location.INTERIOR) return point
    }
  }
  return null
}

export function partitionGround(ground, cuts) {
  if (!ground.length || !cuts.length) return ground
  // Polygonize the linework. An open or dangling line cannot create a face.
  const mask = reader.read({type: 'MultiPolygon', coordinates: ground})
  const network = reader.read({type: 'MultiLineString', coordinates: [...ground.flat(), ...cuts.map(forNoding)]})
  const polygonizer = new Polygonizer()
  polygonizer.add(UnaryUnionOp.union(network))
  const faces = polygonizer.getPolygons().toArray().filter(face => {
    const probe = interiorProbe(face)
    return probe && SimplePointInAreaLocator.locate(probe, mask) === Location.INTERIOR
  })
  const total = faces.reduce((sum, face) => sum + face.getArea(), 0)
  if (Math.abs(total - mask.getArea()) > 1e-6) throw new Error('Die virtuellen Trennlinien ergeben keine vollständige Flächenpartition.')
  return faces.map(face => writer.write(face).coordinates)
}
