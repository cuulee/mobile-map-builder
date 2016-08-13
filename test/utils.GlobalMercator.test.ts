import test from 'ava'
import { pick } from 'lodash'
import { mercator, bounds, LatLng } from '../app/utils/GlobalMercator'
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
  let meters = mercator.LatLonToMeters(LATLNG)
  t.deepEqual(meters, METERS)
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

test('GoogleQuadKey', t => {
  let quadkey = mercator.GoogleQuadKey(GOOGLE)
  t.deepEqual(quadkey, QUADKEY)
})

test('Throws Error Bad Bounds', t => {
  t.throws(() => bounds([1]), '[bounds] Must be an array with 4x Numbers.')
  t.throws(() => bounds([1, 2]), '[bounds] Must be an array with 4x Numbers.')
  t.throws(() => bounds([1, 2, 3]), '[bounds] Must be an array with 4x Numbers.')
  t.throws(() => bounds([1, 2, 3, 4, 5]), '[bounds] Must be an array with 4x Numbers.')
})

test('Throws Error Bad LatLng', t => {
  t.throws(() => new LatLng({ lat: -220, lng: 120 }), '[lat] must be within -90 to 90 degrees')
  t.throws(() => new LatLng({ lat: 220, lng: 120 }), '[lat] must be within -90 to 90 degrees')
  t.throws(() => new LatLng({ lat: 45, lng: -220 }), '[lng] must be within -180 to 180 degrees')
  t.throws(() => new LatLng({ lat: 45, lng: 220 }), '[lng] must be within -180 to 180 degrees')
})
