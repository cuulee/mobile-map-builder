import test from 'ava'
import { pick } from 'lodash'
import { mercator, validateBounds, LngLat, LngLatBounds } from '../app/GlobalMercator'
import {
  LATLNG,
  METERS,
  PIXELS,
  TILE,
  BOUNDS,
  BOUNDS_LATLNG,
  GOOGLE,
  QUADKEY,
  QUADKEY_BAD } from './globals'

test('Global Mercator', t => {
  t.true(!!mercator)
})

test('LatLonToMeters', t => {
  const meters = mercator.LatLonToMeters(LATLNG)
  const { mx, my, zoom } = meters
  t.deepEqual({ mx, my, zoom }, METERS)
})

test('MetersToLatLon', t => {
  const latlng = mercator.MetersToLatLon(METERS)
  const { lat, lng, zoom } = latlng
  t.deepEqual({lat, lng, zoom}, LATLNG)
})

test('MetersToPixels', t => {
  const pixels = mercator.MetersToPixels(METERS)
  const { px, py, zoom } = pixels
  t.deepEqual(px, PIXELS.px)
  t.deepEqual(py, PIXELS.py)
  t.deepEqual(zoom, PIXELS.zoom)
})

test('PixelsToTile', t => {
  let tile = mercator.PixelsToTile(PIXELS)
  t.deepEqual(tile, pick(TILE, ['tx', 'ty', 'zoom']))
})

test('MetersToTile', t => {
  let tile = mercator.MetersToTile(METERS)
  t.deepEqual(tile, pick(TILE, ['tx', 'ty', 'zoom']))
})

test('PixelsToMeters', t => {
  let meters = mercator.PixelsToMeters(PIXELS)
  t.deepEqual(meters.mx.toPrecision(5), METERS.mx.toPrecision(5))
  t.deepEqual(meters.my.toPrecision(5), METERS.my.toPrecision(5))
})

test('TileBounds', t => {
  let bounds = mercator.TileBounds(TILE)
  t.deepEqual(bounds, BOUNDS)
})

test('TileLatLonBounds', t => {
  let bounds = mercator.TileLatLonBounds(TILE)
  t.deepEqual(bounds, BOUNDS_LATLNG)
})

test('GoogleTile', t => {
  let google = mercator.TileGoogle(TILE)
  t.deepEqual(google, pick(GOOGLE, ['x', 'y', 'zoom']))
})

test('TileQuadKey', t => {
  let quadkey = mercator.TileQuadKey(TILE)
  t.deepEqual(quadkey, QUADKEY)
})

test('QuadKeyGoogle', t => {
  let google = mercator.QuadKeyGoogle(QUADKEY)
  t.deepEqual(google, pick(GOOGLE, ['x', 'y', 'zoom']))
})

test('QuadKeyTile', t => {
  let tile = mercator.QuadKeyTile(QUADKEY)
  t.deepEqual(tile, pick(TILE, ['tx', 'ty', 'zoom']))
})

test('Throws Error QuadKeyTile', t => {
  t.throws(() => mercator.QuadKeyTile(QUADKEY_BAD), 'Invalid QuadKey digit sequence')
})

test('GoogleBounds', t => {
  let bounds = mercator.GoogleBounds(GOOGLE)
  t.deepEqual(bounds, BOUNDS)
})

test('GoogleLatLngBounds', t => {
  let bounds = mercator.GoogleLatLonBounds(GOOGLE)
  t.deepEqual(bounds, BOUNDS_LATLNG)
})

test('LatLngToGoogle', t => {
  let google = mercator.LatLngToGoogle(LATLNG)
  t.deepEqual(google, pick(GOOGLE, ['x', 'y', 'zoom']))
})

test('LatLngBounds', t => {
  let { bounds } = new LngLatBounds(BOUNDS_LATLNG)
  t.deepEqual(bounds, BOUNDS_LATLNG)
})

test('GoogleQuadKey', t => {
  let quadkey = mercator.GoogleQuadKey(GOOGLE)
  t.deepEqual(quadkey, QUADKEY)
})

test('Throws Error Bad Bounds', t => {
  t.throws(() => validateBounds([1]), '[bounds] must be an Array of 4 numbers')
  t.throws(() => validateBounds([1, 2]), '[bounds] must be an Array of 4 numbers')
  t.throws(() => validateBounds([1, 2, 3]), '[bounds] must be an Array of 4 numbers')
  t.throws(() => validateBounds([1, 2, 3, 4, 5]), '[bounds] must be an Array of 4 numbers')
})

test('Throws Error Bad LngLat', t => {
  t.throws(() => new LngLat({ lat: -220, lng: 120 }), 'LngLat [lat] must be within -90 to 90 degrees')
  t.throws(() => new LngLat({ lat: 220, lng: 120 }), 'LngLat [lat] must be within -90 to 90 degrees')
  t.throws(() => new LngLat({ lat: 45, lng: -220 }), 'LngLat [lng] must be within -180 to 180 degrees')
  t.throws(() => new LngLat({ lat: 45, lng: 220 }), 'LngLat [lng] must be within -180 to 180 degrees')
})
