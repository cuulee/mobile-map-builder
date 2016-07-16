import uuid from 'node-uuid'
import turf from 'turf'
import { sample } from 'lodash'
import { mercator } from './GlobalMercator'

export const validateTile = ({ x, y, zoom }) => {
  let tileCountXY = Math.pow(2, zoom)
  if (x >= tileCountXY || y >= tileCountXY) {
    throw new Error('Illegal parameters for tile')
  }
  return true
}

export const parseSwitch = (url) => {
  let pattern = /{switch:([a-z,\d]*)}/i
  let found = url.match(pattern)
  if (found) {
    let random = sample(found[1].split(','))
    return url.replace(pattern, random)
  }
  return url
}

export const parseUrl = ({ scheme, x, y, zoom, quadkey }) => {
  let url = scheme
  url = url.replace(/{zoom}/, zoom)
  url = url.replace(/{z}/, zoom)
  url = url.replace(/{x}/, x)
  url = url.replace(/{y}/, y)
  url = url.replace(/{quadkey}/, quadkey)
  url = parseSwitch(url)

  return url
}

export default class Tile {
  constructor({ x, y, zoom, scheme, quadkey }) {

    if (typeof x == 'undefined') { throw new Error('[x] required') }
    if (typeof y == 'undefined') { throw new Error('[y] required') }
    if (typeof zoom == 'undefined') { throw new Error('[zoom] required') }
    if (typeof scheme == 'undefined') { throw new Error('[scheme] required') }
    if (typeof quadkey != 'undefined' && typeof quadkey != 'string') { throw new Error('[quadkey] must be string') }

    // User Input
    this.x = x
    this.y = y
    this.zoom = zoom
    this.scheme = scheme
    this.quadkey = quadkey

    // Extra Properties
    this.bounds = mercator.GoogleLatLonBounds({ x: x, y: y, zoom: zoom })
    this.geometry = turf.bboxPolygon(this.bounds).geometry
    this.quadkey = mercator.GoogleQuadKey({ x: x, y: y, zoom: zoom })
    this.url = parseUrl({ x: x, y: y, zoom: zoom, scheme: scheme, quadkey: this.quadkey })
    this.id = uuid.v4()

    // Validation
    validateTile({ x: x, y: y, zoom: zoom })
  }
}

if (require.main === module) {
  /* istanbul ignore next */
  const { GOOGLE } = require('../../test/globals')
  /* istanbul ignore next */
  const tile = new Tile(GOOGLE)
  /* istanbul ignore next */
  console.log(tile)
}
