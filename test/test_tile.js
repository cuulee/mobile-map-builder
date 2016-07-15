import test from 'ava'
import Tile, { validateTile, parseSwitch, parseUrl } from '../app/utils/Tile'

const X = 655
const Y = 854
const ZOOM = 15
const SWITCH = 'abc'
const SCHEME_NO_SWITCH = 'http://tile.openstreetmap.fr/hot/{zoom}/{x}/{y}.png'
const SCHEME = 'http://tile-{switch:a,b,c}.openstreetmap.fr/hot/{zoom}/{x}/{y}.png'
const TILE = { x: X, y: Y, zoom: ZOOM, scheme: SCHEME }

test('Tile', t => {
  const tile = new Tile(TILE)
  let re = new RegExp(`http://tile-[${ SWITCH }].openstreetmap.fr/hot/${ ZOOM }/${ X }/${ Y }.png`)
  t.deepEqual(tile.x, X)
  t.deepEqual(tile.y, Y)
  t.deepEqual(tile.zoom, ZOOM)
  t.deepEqual(tile.scheme, SCHEME)
  t.true(!!tile.url.match(re))
})

test('Parse Switch', t => {
  let re = new RegExp(SCHEME.replace(/{switch:[a-z,\d]*}/i, `[${ SWITCH }]`))
  let url = parseSwitch(SCHEME)
  t.true(!!url.match(re))
})

test('Parse Switch - No Switch', t => {
  let re = new RegExp(SCHEME_NO_SWITCH)
  let url = parseSwitch(SCHEME_NO_SWITCH)
  t.true(!!url.match(re))
})

test('Parse Url', t => {
  let re = new RegExp(`http://tile-[${ SWITCH }].openstreetmap.fr/hot/${ ZOOM }/${ X }/${ Y }.png`)
  let url = parseUrl(TILE)
  t.true(!!url.match(re))
})

test('Validate Tile', t => {
  t.true(validateTile(TILE))
})

test('Throw Error Tile', t => {
  let tile = {x: X, y: Y, zoom: 2, scheme: SCHEME}
  t.throws(() => validateTile(tile), 'Illegal parameters for tile')
})
