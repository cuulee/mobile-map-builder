import test from 'ava'
import Grid from '../app/Grid'

const BOUNDS = [-66.633234, 45.446628, -66.052350, 45.891202]
const MAXZOOM = 7
const MINZOOM = 4
const SCHEME = 'http://tile-{switch:a,b,c}.openstreetmap.fr/hot/{zoom}/{x}/{y}.png'
const OPTIONS = {
  bounds: BOUNDS,
  maxZoom: MAXZOOM,
  minZoom: MINZOOM,
  scheme: SCHEME,
}

test('Grid', t => {
  const grid = new Grid(OPTIONS)
  t.deepEqual(BOUNDS, grid.bounds)
  const { value, done } = grid.tiles.next()
  t.true(!!value)
  t.true(!done)
})

test('Throws Error bad Grid', t => {
  t.throws(() => new Grid({
    bounds: BOUNDS,
    maxZoom: MAXZOOM,
    minZoom: -1,
    scheme: SCHEME,
  }), 'Grid <minZoom> cannot be less than 0')
  t.throws(() => new Grid({
    bounds: BOUNDS,
    maxZoom: 24,
    minZoom: MINZOOM,
    scheme: SCHEME,
  }), 'Grid <maxZoom> cannot be greater than 23')
  t.throws(() => new Grid({
    bounds: BOUNDS,
    maxZoom: 5,
    minZoom: 10,
    scheme: SCHEME,
  }), 'Grid <minZoom> cannot be greater than <maxZoom>')
})
