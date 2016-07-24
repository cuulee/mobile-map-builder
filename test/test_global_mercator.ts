import test from 'ava'
import { pick } from 'lodash'
import { mercator, bounds, latlng } from '../app/utils/GlobalMercator'
import {
  LATLNG,
  METERS,
  METERS_OFFSET,
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
  t.true(!!meters)
})

test('MetersToLatLon', t => {
  let latlng = mercator.MetersToLatLon(METERS)
  t.true(!!latlng)
})

test('MetersToPixels', t => {
  let pixels = mercator.MetersToPixels(METERS)
  t.true(!!pixels)
})

test('PixelsToTile', t => {
  let tile = mercator.PixelsToTile(PIXELS)
  t.true(!!tile)
})

test('MetersToTile', t => {
  let tile = mercator.MetersToTile(METERS)
  t.true(!!tile)
})

test('PixelsToMeters', t => {
  let meters = mercator.PixelsToMeters(PIXELS)
  t.true(!!meters)
})

test('TileBounds', t => {
  let bounds = mercator.TileBounds(TILE)
  t.true(!!bounds)
})

test('TileLatLonBounds', t => {
  let bounds = mercator.TileLatLonBounds(TILE)
  t.true(!!bounds)
})

test('GoogleTile', t => {
  let google = mercator.TileGoogle(TILE)
  t.true(!!google)
})

test('TileQuadKey', t => {
  let quadkey = mercator.TileQuadKey(TILE)
  t.true(!!quadkey)
})

test('QuadKeyGoogle', t => {
  let google = mercator.QuadKeyGoogle(QUADKEY)
  t.true(GOOGLE.x == google.x)
  t.true(GOOGLE.y == google.y)
  t.true(GOOGLE.zoom == google.zoom)
})

test('QuadKeyTile', t => {
  let tile = mercator.QuadKeyTile(QUADKEY)
  t.true(TILE.tx == tile.tx)
  t.true(TILE.ty == tile.ty)
  t.true(TILE.zoom == tile.zoom)
})

test('Throws Error QuadKeyTile', t => {
  t.throws(() => mercator.QuadKeyTile(QUADKEY_BAD), 'Invalid QuadKey digit sequence')
})

test('GoogleBounds', t => {
  let bounds = mercator.GoogleBounds(GOOGLE)
  t.true(!!bounds)
})

test('GoogleLatLngBounds', t => {
  let bounds = mercator.GoogleLatLonBounds(GOOGLE)
  t.true(!!bounds)
})

test('GoogleQuadKey', t => {
  let quadkey = mercator.GoogleQuadKey(GOOGLE)
  t.deepEqual(quadkey, QUADKEY)
})

test('Throws Error Bad Bounds', t => {
  t.throws(() => bounds([1]), '[bounds] Must be an array with 4x Numbers.')
  t.throws(() => bounds([1,2]), '[bounds] Must be an array with 4x Numbers.')
  t.throws(() => bounds([1,2,3]), '[bounds] Must be an array with 4x Numbers.')
  t.throws(() => bounds([1,2,3,4,5]), '[bounds] Must be an array with 4x Numbers.')
})

test('Throws Error Bad LatLng', t => {
  t.throws(() => new latlng({ lat:-220, lng:120 }), '[lat] must be within -90 to 90 degrees')
  t.throws(() => new latlng({ lat:220, lng:120 }), '[lat] must be within -90 to 90 degrees')
  t.throws(() => new latlng({ lat:45, lng:-220 }), '[lng] must be within -180 to 180 degrees')
  t.throws(() => new latlng({ lat:45, lng:220 }), '[lng] must be within -180 to 180 degrees')
})