import test from 'ava'
import * as del from 'del'
import MBTiles, { parseCenter, parseBounds } from '../app/utils/MBTiles'

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
  attribution: ATTRIBUTION,
  bounds: BOUNDS,
  center: CENTER,
  description: DESCRIPTION,
  maxzoom: MAXZOOM,
  minzoom: MINZOOM,
  name: NAME,
  scheme: SCHEME,
}
const TILE = {
  scheme: 'http://tile-{switch:a,b,c}.openstreetmap.fr/hot/{zoom}/{x}/{y}.png',
  x: 2389,
  y: 2946,
  zoom: 13,
}

test('Update Metadata', async (t) => {
  const mbtiles = new MBTiles('UpdateMetadata.mbtiles')
  const status = await mbtiles.metadata(METADATA)
  await del('UpdateMetadata.mbtiles')
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
  const mbtiles = new MBTiles('SaveTile.mbtiles')
  const status = await mbtiles.save(TILE)
  await mbtiles.save(TILE) // Save Duplicate Tile
  await del('SaveTile.mbtiles')
  t.true(status.ok)
})

test('Create Index', async (t) => {
  const mbtiles = new MBTiles('CreateIndex.mbtiles')
  const status = await mbtiles.index()
  await del('CreateIndex.mbtiles')
  t.true(status.ok)
})
