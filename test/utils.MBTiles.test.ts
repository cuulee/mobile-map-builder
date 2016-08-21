import test from 'ava'
import * as del from 'del'
import * as uuid from 'node-uuid'
// import debug from '../app/utils/debug'
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
const FORMAT = 'png'
const TYPE = 'baselayer'
const METADATA = {
  attribution: ATTRIBUTION,
  bounds: BOUNDS,
  center: CENTER,
  description: DESCRIPTION,
  format: FORMAT,
  maxzoom: MAXZOOM,
  minzoom: MINZOOM,
  name: NAME,
  scheme: SCHEME,
  type: TYPE,
}

test('Update Metadata', async (t) => {
  const mbtiles = new MBTiles('UpdateMetadata.mbtiles')
  const status = await mbtiles.metadata(METADATA)
  await del('UpdateMetadata.mbtiles')
  t.true(status.ok)
})

test('Save', async (t) => {
  const DB_SAVE = `${ uuid.v4() }.mbtiles`
  const DB_METADATA = {
    attribution: 'Map data © Bing',
    bounds: BOUNDS,
    center: [-111.2082, 52.6037],
    description: 'Tiles from Bing',
    format: 'jpg',
    maxZoom: 3,
    minZoom: 3,
    name: 'Test',
    scheme: SCHEME,
    type: 'baselayer',
  }
  const mbtiles = new MBTiles(DB_SAVE)
  const status = await mbtiles.save(DB_METADATA)
  t.true(status.ok)
})

test('parseCenter', t => {
  const center = parseCenter(CENTER)
  t.deepEqual(center, CENTER_STRING)
})

test('Throws Error parseCenter', t => {
  t.throws(() => parseCenter([0, 110]), 'parseCenter [y] must be within -90 to 90 degrees')
  t.throws(() => parseCenter([-190, 0]), 'parseCenter [x] must be within -180 to 180 degrees')
})

test('parseBounds', t => {
  const bounds = parseBounds(BOUNDS)
  t.deepEqual(bounds, BOUNDS_STRING)
})

test('Throws Error parseBounds', t => {
  t.throws(() => parseBounds([1, 2, 3]), '[bounds] must have 4 numbers')
  t.throws(() => parseBounds([1, 2, 3, 4, 5]), '[bounds] must have 4 numbers')
})

test('Throws Metadata format error', async (t) => {
  const DB = 'MetadataFormatError.mbtiles'
  const mbtiles = new MBTiles(DB)
  const METADATA_ERROR_FORMAT = {
    bounds: BOUNDS,
    description: DESCRIPTION,
    format: 'format-error',
    name: NAME,
    type: TYPE,
  }
  await mbtiles.metadata(METADATA_ERROR_FORMAT).then(
    status => status,
    error => t.deepEqual(error.message, 'MBTiles.metadata <format> must be [png or jpg]')
  )
})

test('Throws Metadata type error', async (t) => {
  const DB = 'MetadataTypeError.mbtiles'
  const mbtiles = new MBTiles(DB)
  const METADATA_ERROR_TYPE = {
    bounds: BOUNDS,
    description: DESCRIPTION,
    format: FORMAT,
    name: NAME,
    type: 'type-error',
  }
  await mbtiles.metadata(METADATA_ERROR_TYPE).then(
    status => status,
    error => t.deepEqual(error.message, 'MBTiles.metadata <type> must be [overlay or baselayer]')
  )
})
