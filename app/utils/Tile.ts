import uuid from 'node-uuid'
import turf from 'turf'
import { sample } from 'lodash'
import { mercator } from './GlobalMercator'


interface Tile {
  x: number,
  y: number,
  zoom: number
}

function validateTile(tile: Tile) {
  let tileCountXY = Math.pow(2, zoom)
  if (x >= tileCountXY || y >= tileCountXY) {
    throw new Error('Illegal parameters for tile')
  }
  return true
}

validateTile({x: 1, y: 1, zoom: 2})

/**
 * Parse Switch
 * @param  {string} url - URL Scheme
 * @return {string} Parsed URL with switch replaced
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
