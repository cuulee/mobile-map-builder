// http://www.maptiler.org/google-maps-coordinates-tile-bounds-projection/

import uuid from 'node-uuid'
import turf from 'turf'
import { sample } from 'lodash'
//import { mercator } from './GlobalMercator'

interface tile {
  x:number,
  y:number,
  zoom:number,
  scheme:string
}

/**
 * Validate Tile - Test for common mistakes to validate the TMS/Google tile.
 *
 * @name validateTile
 * @param {Number} x - Google Tile X
 * @param {Number} y - Google Tile Y
 * @param {Number} zoom - Zoom Level
 * @param {String} scheme (Optional) - Scheme URL
 * @return {Object<Tile>} Returns itself
 * @example
 * validateTile({x: 180, y: 150, zoom: 13})
 *
 * //= {x: 180, y: 150, zoom: 13, scheme: <scheme>}
 * or
 * //= throw Error(msg)
 */
const validateTile = (tile: { x:number, y:number, zoom:number, scheme?:string }) => {
  let tileCountXY = Math.pow(2, tile.zoom)
  if (tile.x >= tileCountXY || tile.y >= tileCountXY) {
    throw new Error('Illegal parameters for tile')
  }
  return tile
}

/**
 * Parse Switch - Replaces {switch:a,b,c} with a random sample.
 *
 * @name parseSwitch
 * @param {String} url - URL Scheme
 * @return {String} Parsed URL with switch replaced
 * @example
 * scheme = 'http://tile-{switch:a,b,c}.openstreetmap.fr/hot/{zoom}/{x}/{y}.png'
 * const url = parseUrl(scheme)
 * //= 'http://tile-a.openstreetmap.fr/hot/{zoom}/{x}/{y}.png'
 */
export const parseSwitch = (url:string) => {
  const pattern = /{switch:([a-z,\d]*)}/i
  const found = url.match(pattern)
  if (found) {
    const random = sample(found[1].split(','))
    return url.replace(pattern, random)
  }
  return url
}

/**
 * Substitutes the given tile information (x,y,zoom) to the URL tile scheme.
 * 
 * @name paserUrl
 * @param {String} scheme - Slippy map URL scheme
 * @param {Number} x - Tile X
 * @param {Number} y - Tile Y
 * @param {Number} zoom - Zoom Level
 * @param {String} quadkey - Microsoft QuadKey
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
    if (typeof quadkey == 'undefined' && typeof quadkey == 'string') { throw new Error('[quadkey] must be string') }

    // User Input
    this.x = x
    this.y = y
    this.zoom = zoom
    this.scheme = scheme
    this.quadkey = quadkey

    // Extra Properties
    //this.bounds = mercator.GoogleLatLonBounds({ x: x, y: y, zoom: zoom })
    //this.geometry = turf.bboxPolygon(this.bounds).geometry
    //this.quadkey = mercator.GoogleQuadKey({ x: x, y: y, zoom: zoom })
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
