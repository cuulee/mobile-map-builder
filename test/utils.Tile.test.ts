import test from 'ava'
import debug from '../app/utils/debug'
import Tile, {
  encodeId,
  decodeId,
  validateTile,
  parseSwitch,
  parseUrl,
  downloadTile } from '../app/utils/Tile'

const X = 655
const Y = 854
const ZOOM = 15
const SWITCH = 'abc'
const URL = 'http://tile-a.openstreetmap.fr/hot/13/2389/2946.png'
const SCHEME_NO_SWITCH = 'http://tile.openstreetmap.fr/hot/{zoom}/{x}/{y}.png'
const SCHEME = 'http://tile-{switch:a,b,c}.openstreetmap.fr/hot/{zoom}/{x}/{y}.png'
const SCHEME_QUADKEY = 'http://ecn.t{switch:0,1,2,3}.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=5250'
const TILE = { quadkey: '012123', scheme: SCHEME, x: X, y: Y, zoom: ZOOM }

test('Tile', t => {
  const tile = new Tile(TILE)
  const re = new RegExp(`http://tile-[${ SWITCH }].openstreetmap.fr/hot/${ ZOOM }/${ X }/${ Y }.png`)
  t.deepEqual(tile.x, X)
  t.deepEqual(tile.y, Y)
  t.deepEqual(tile.zoom, ZOOM)
  t.deepEqual(tile.scheme, SCHEME)
  t.true(!!tile.url.match(re))
})

test('Parse Switch', t => {
  const re = new RegExp(SCHEME.replace(/{switch:[a-z,\d]*}/i, `[${ SWITCH }]`))
  const url = parseSwitch(SCHEME)
  t.true(!!url.match(re))
})

test('Parse Switch - No Switch', t => {
  const re = new RegExp(SCHEME_NO_SWITCH)
  const url = parseSwitch(SCHEME_NO_SWITCH)
  t.true(!!url.match(re))
})

test('Parse Url', t => {
  const re = new RegExp(`http://tile-[${ SWITCH }].openstreetmap.fr/hot/${ ZOOM }/${ X }/${ Y }.png`)
  const url = parseUrl(TILE)
  t.true(!!url.match(re))
})

test('Parse Url - QuadKey', t => {
  const tile = TILE
  tile.scheme = SCHEME_QUADKEY
  const url = parseUrl(tile)
  t.true(!!url)
})

test('Validate Tile', t => {
  t.true(!!validateTile(TILE))
})

test('Throw Error Tile', t => {
  const tile = { scheme: SCHEME, x: X, y: Y, zoom: 2 }
  t.throws(() => validateTile(tile), 'Illegal parameters for tile')
})

test('Download Tile from Tile Class', t => {
  const tile = new Tile(TILE)
  tile.download()
    .then(buffer => t.pass())
})

test('Download Tile from Method', t => {
  downloadTile(URL)
    .then(buffer => t.pass())
})

test('Download Tile from Class', async (t) => {
  const tile = new Tile(TILE)
  const buffer = await tile.download()
  t.true(!!buffer)
})

test('encodeId', t => {
  const id = encodeId({
    scheme: SCHEME,
    tile_column: X,
    tile_row: Y,
    zoom_level: ZOOM,
  })
  debug.log(id)
  t.true(!!id)
})

test('decodeId', t => {
  const id = decodeId(
    'em9vbV9sZXZlbD0xNTt0aWxlX2NvbHVtbj02NTU7dGlsZV9yb3c9' +
    'ODU0O3NjaGVtZT1odHRwOi8vdGlsZS17c3dpdGNoOmEsYixjfS5v' +
    'cGVuc3RyZWV0bWFwLmZyL2hvdC97em9vbX0ve3h9L3t5fS5wbmc=')
  t.true(!!id)
})

test('Throws Error bad encodeId', t => {
  t.throws(() => encodeId({
    scheme: SCHEME,
    tile_column: undefined,
    tile_row: Y,
    zoom_level: ZOOM,
  }), 'encodeId <tile_column> is required')
  t.throws(() => encodeId({
    scheme: SCHEME,
    tile_column: X,
    tile_row: undefined,
    zoom_level: ZOOM,
  }), 'encodeId <tile_row> is required')
  t.throws(() => encodeId({
    scheme: undefined,
    tile_column: X,
    tile_row: Y,
    zoom_level: ZOOM,
  }), 'encodeId <scheme> is required')
  t.throws(() => encodeId({
    scheme: SCHEME,
    tile_column: X,
    tile_row: Y,
    zoom_level: undefined,
  }), 'encodeId <zoom_level> is required')
})
