// http://www.maptiler.org/google-maps-coordinates-tile-bounds-projection/

import uuid from 'node-uuid'
import turf from 'turf'
import { sample } from 'lodash'
import { mercator } from './GlobalMercator'

/**
 * Validate Tile - Test for common mistakes to validate the TMS/Google tile.
 *
 * @name validateTile
 * @param  {Number} x - Google Tile X
 * @param  {Number} y - Google Tile Y
 * @param  {Number} zoom - Zoom Level
 * @param  {String} scheme (Optional) - Scheme URL
 * @return {Object<Tile>} Returns itself
 * @example
 * validateTile({x: 180, y: 150, zoom: 13})
 *
 * //= {x: 180, y: 150, zoom: 13, scheme: <scheme>}
 * or
 * //= throw Error(msg)
 */
const validateTile = ({ x, y, zoom, scheme }) => {
  if (typeof x !== 'number') { throw new Error('[x] Must be a Number') }
  if (typeof y !== 'number') { throw new Error('[y] Must be a Number') }
  if (typeof zoom !== 'number') { throw new Error('[zoom] Must be a Number') }
  if (typeof scheme !== 'string' && typeof !== 'undefined') { throw new Error('[scheme] (Optional) Must be a String.') }

  let tileCountXY = Math.pow(2, zoom)
  if (x >= tileCountXY || y >= tileCountXY) {
    throw new Error('Illegal parameters for tile')
  }
  return { x: x, y: y, zoom: zoom, scheme: scheme }
}

/**
 * Parse Switch - Replaces {switch:a,b,c} with a random sample.
 *
 * @name parseSwitch
 * @param  {String} url - URL Scheme
 * @return {String} Parsed URL with switch replaced
 * @example
 * scheme = 'http://tile-{switch:a,b,c}.openstreetmap.fr/hot/{zoom}/{x}/{y}.png'
 * const url = parseUrl(scheme)
 *
 * //= 'http://tile-a.openstreetmap.fr/hot/{zoom}/{x}/{y}.png'
 */
export const parseSwitch = (url) => {
  const pattern = /{switch:([a-z,\d]*)}/i
  const found = url.match(pattern)
  if (found) {
    const random = sample(found[1].split(','))
    return url.replace(pattern, random)
  }
  return url
}

/**
 * paserUrl -
 * @param  {String} scheme - Slippy map URL scheme
 * @param  {Number} x - Tile X
 * @param  {Number} y - Tile Y
 * @param  {Number} zoom - Zoom Level
 * @param  {String} quadkey - Microsoft QuadKey
 * @return {String}
 * @example
 * const tile = { x: 2389, y: 2946, zoom: 13, scheme: SCHEME }
 * tile.scheme = 'http://tile-{switch:a,b,c}.openstreetmap.fr/hot/{zoom}/{x}/{y}.png'
 * const url = parseUrl(tile)
 */
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
  name = 'Tile'

  constructor({ x, y, zoom, scheme, quadkey }) {
    // Validate Types
    if (typeof x == 'undefined') { throw new Error('[x] required') }
    if (typeof y == 'undefined') { throw new Error('[y] required') }
    if (typeof zoom == 'undefined') { throw new Error('[zoom] required') }
    if (typeof scheme == 'undefined') { throw new Error('[scheme] required') }
    if (typeof quadkey !== 'undefined' && typeof quadkey !== 'string') { throw new Error('[quadkey] must be string') }

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
  map(func) {
    Object.keys(this).map(key => {
      const item = {}
      item[key] = this[key]
      return func(item)
    })
  }
  forEach(func) {
    return this.map(func)
  }
}

if (require.main === module) {
  /* istanbul ignore next */
  const { GOOGLE } = require('../../test/globals')
  /* istanbul ignore next */
  const tile = new Tile(GOOGLE)
  /* istanbul ignore next */
  tile.map(i => console.log(i))
}
