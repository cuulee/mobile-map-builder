import test from 'ava'
import _ from 'lodash'
import GlobalMercator from '../app/utils/GlobalMercator'

const mercator = new GlobalMercator()
const LATLNG = { lat: 45, lng: -75 }
const METERS = { mx: -8348961.809495518, my: 5621521.486192067, zoom: 13 }
const METERS_OFFSET = { mx: -8348961.809495518, my: 5621521.486192066, zoom: 13 }
const PIXELS = { px: 611669.3333333334, py: 1342753.919383204, zoom: 13 }
const TILE = { tx: 2389, ty: 5245, zoom: 13 }
const METERS_BOUNDS = [
  -8350592.466098936,
  5620873.31197872,
  -8345700.496288683,
  5625765.281788971
]
const LATLNG_BOUNDS = [
  -75.01464843750001,
  44.99588261816546,
  -74.97070312499999,
  45.02695045318546
]
const GOOGLE = { x: 2389, y: 2946, zoom: 13 }
const QUADKEY = { quadkey: '0302321010121' }
const QUADKEY_BAD = { quadkey: '030486861' }

test('Global Mercator', t => {
  t.true(!!mercator)
})

test('LatLonToMeters', t => {
  let meters = mercator.LatLonToMeters(LATLNG)
  t.deepEqual(meters, _.pick(METERS, ['mx', 'my']))
})

test('MetersToLatLon', t => {
  let latlng = mercator.MetersToLatLon(METERS)
  t.deepEqual(latlng, LATLNG)
})

test('MetersToPixels', t => {
  let pixels = mercator.MetersToPixels(METERS)
  t.deepEqual(pixels, PIXELS)
})

test('PixelsToTile', t => {
  let tile = mercator.PixelsToTile(PIXELS)
  t.deepEqual(tile, TILE)
})

test('MetersToTile', t => {
  let tile = mercator.MetersToTile(METERS)
  t.deepEqual(tile, TILE)
})

test('PixelsToMeters', t => {
  let meters = mercator.PixelsToMeters(PIXELS)
  t.deepEqual(meters, METERS_OFFSET)
})

test('TileBounds', t => {
  let bounds = mercator.TileBounds(TILE)
  t.deepEqual(bounds, METERS_BOUNDS)
})

test('TileLatLonBounds', t => {
  let bounds = mercator.TileLatLonBounds(TILE)
  t.deepEqual(bounds, LATLNG_BOUNDS)
})

test('GoogleTile', t => {
  let google = mercator.TileGoogle(TILE)
  t.deepEqual(google, GOOGLE)
})

test('TileQuadKey', t => {
  let quadkee = mercator.TileQuadKey(TILE)
  t.deepEqual(quadkee, QUADKEY)
})

test('QuadKeyGoogle', t => {
  let google = mercator.QuadKeyGoogle(QUADKEY)
  t.deepEqual(google, GOOGLE)
})

test('QuadKeyTile', t => {
  let tile = mercator.QuadKeyTile(QUADKEY)
  t.deepEqual(tile, TILE)
})

test('Throws Error QuadKeyTile', t => {
  t.throws(() => mercator.QuadKeyTile(QUADKEY_BAD), 'Invalid QuadKey digit sequence')
})
