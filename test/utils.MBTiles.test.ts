import test from 'ava'
import * as del from 'del'
import * as uuid from 'node-uuid'
// import debug from '../app/utils/debug'
import MBTiles, { stringifyCenter, stringifyBounds } from '../app/MBTiles'

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
  maxZoom: MAXZOOM,
  minZoom: MINZOOM,
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
    bounds: BOUNDS,
    format: 'jpg',
    maxZoom: 3,
    minZoom: 3,
    name: 'Test',
    scheme: SCHEME,
  }
  const mbtiles = new MBTiles(DB_SAVE)
  const status = await mbtiles.save(DB_METADATA)
  t.true(status.ok)
})

test('stringifyCenter', t => {
  const center = stringifyCenter(CENTER)
  t.deepEqual(center, CENTER_STRING)
})

test('Throws Error stringifyCenter', t => {
  t.throws(() => stringifyCenter([0, 110]), 'LngLat [lat] must be within -90 to 90 degrees')
  t.throws(() => stringifyCenter([-190, 0]), 'LngLat [lng] must be within -180 to 180 degrees')
})

test('stringifyBounds', t => {
  const bounds = stringifyBounds(BOUNDS)
  t.deepEqual(bounds, BOUNDS_STRING)
})

test('Throws Error stringifyBounds', t => {
  t.throws(() => stringifyBounds([1, 2, 3]), '[bounds] must be an Array of 4 numbers')
  t.throws(() => stringifyBounds([1, 2, 3, 4, 5]), '[bounds] must be an Array of 4 numbers')
})

test('Throws Metadata format error', async (t) => {
  const DB = 'MetadataFormatError.mbtiles'
  const mbtiles = new MBTiles(DB)
  const METADATA_ERROR_FORMAT = METADATA
  METADATA_ERROR_FORMAT.format = 'format-error'

  await mbtiles.metadata(METADATA_ERROR_FORMAT).then(
    status => status,
    error => t.deepEqual(error.message, 'MBTiles.metadata <format> must be [png or jpg]')
  )
})

test('Throws Metadata type error', async (t) => {
  const DB = 'MetadataTypeError.mbtiles'
  const mbtiles = new MBTiles(DB)
  const METADATA_ERROR_TYPE = METADATA
  METADATA_ERROR_TYPE.type = 'type-error'

  await mbtiles.metadata(METADATA_ERROR_TYPE).then(
    status => status,
    error => t.deepEqual(error.message, 'MBTiles.metadata <type> must be [overlay or baselayer]')
  )
})
