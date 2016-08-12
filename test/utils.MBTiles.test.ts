import test from 'ava'
import MBTiles, { parseCenter, parseBounds } from '../app/utils/MBTiles'

const DB = 'tiles.mbtiles'
const NAME = 'OpenStreetMap'
const ATTRIBUTION = 'Map data © OpenStreetMap'
const DESCRIPTION = 'Tiles from OSM'
const SCHEME = 'http://tile-{switch:a,b,c}.openstreetmap.fr/hot/{zoom}/{x}/{y}.png'
const BOUNDS = [-27, 62, -11, 67.5]
const BOUNDS_STRING = '-27,62,-11,67.5'
const CENTER = [-18.7, 65, 7]
const CENTER_STRING = '-18.7,65,7'
const MINZOOM = 1
const MAXZOOM = 18
const METADATA = {
  name: NAME,
  attribution: ATTRIBUTION,
  description: DESCRIPTION,
  scheme: SCHEME,
  center: CENTER,
  bounds: BOUNDS ,
  minzoom: MINZOOM,
  maxzoom: MAXZOOM 
}
const TILE = {
  x: 2389,
  y: 2946,
  zoom: 13,
  scheme: 'http://tile-{switch:a,b,c}.openstreetmap.fr/hot/{zoom}/{x}/{y}.png'
}

test('MBTiles', async (t) => {
  const mbtiles = new MBTiles(DB)
  t.pass()
})

test('Update Metadata', async (t) => {
  const mbtiles = new MBTiles(DB)
  const status = await mbtiles.metadata(METADATA)
  t.true(status.ok)
})

test('parseCenter', t => {
  const center = parseCenter(CENTER)
  t.deepEqual(center, CENTER_STRING)
})

test('parseBounds', t => {
  const bounds = parseBounds(BOUNDS)
  t.deepEqual(bounds, BOUNDS_STRING)
})

test('Save Tile', async (t) => {
  const mbtiles = new MBTiles(DB)
  const status = await mbtiles.save(TILE)
  t.true(status.ok)
})