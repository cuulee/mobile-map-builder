import * as turf from 'turf'
import * as rp from 'request-promise'
import { Base64 } from 'js-base64'
import { sample, isUndefined } from 'lodash'
import { mercator } from './GlobalMercator'
import debug from './debug'

export interface InterfaceEncodeId {
  zoom_level: number
  tile_row: number
  tile_column: number
  scheme: string
}

export interface InterfaceTMS {
    tx: number
    ty: number
    zoom: number
}

export interface InterfaceTileSQL {
  id: string
  x: number
  y: number
  zoom: number
}

export interface InterfaceTileTMS {
  scheme: string
  tile_column: number
  tile_row: number
  zoom_level: number
  tile_id?: string
}

export interface InterfaceTile {
  x?: number
  y?: number
  zoom?: number
  scheme?: string
  tile_row?: number
  tile_column?: number
  zoom_level?: number
  quadkey?: string
  id?: string
  bbox?: number[]
  geometry?: {type: string, coordinates: number[][][]}
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
export const validateTile = (tile: InterfaceTile) => {
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
export const parseSwitch = (url: string) => {
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
export const parseUrl = (tile: InterfaceTile) => {
  let url = tile.scheme
  url = url.replace(/{zoom}/, String(tile.zoom))
  url = url.replace(/{z}/, String(tile.zoom))
  url = url.replace(/{x}/, String(tile.x))
  url = url.replace(/{y}/, String(tile.y))
  url = url.replace(/{quadkey}/, tile.quadkey)
  url = parseSwitch(url)

  return url
}

/**
 * Downloads the Tile
 *
 * @name downloadTile
 * @param {String} url
 * @return {Buffer}
 */
export const downloadTile = (url: string) => {
  return rp.get(url, { encoding : 'binary' })
    .then(data => new Buffer(data, 'binary'))
}

/**
 * Creates Base64 encoded ID from Tile
 *
 * @name encodeId
 * @param {String} scheme - Slippy map URL scheme
 * @param {Number} x - Tile X
 * @param {Number} y - Tile Y
 * @param {Number} zoom - Zoom Level
 * @return {String} id
 */
export const encodeId = (init: InterfaceEncodeId) => {
  if (isUndefined(init.tile_column)) {
    const message = 'encodeId <tile_column> is required'
    debug.error(message)
    throw new Error(message)

  } else if (isUndefined(init.tile_row)) {
    const message = 'encodeId <tile_row> is required'
    debug.error(message)
    throw new Error(message)

  } else if (isUndefined(init.scheme)) {
    const message = 'encodeId <scheme> is required'
    debug.error(message)
    throw new Error(message)

  } else if (isUndefined(init.zoom_level)) {
    const message = 'encodeId <zoom_level> is required'
    debug.error(message)
    throw new Error(message)
  }
  return Base64.encode(
    `zoom_level=${ init.zoom_level };tile_column=${ init.tile_column };tile_row=${ init.tile_row };scheme=${ init.scheme }`)
}

/**
 * Decodes Tile ID string
 *
 * @name decodeId
 * @param {String} id
 * @return {Object} Tile
 */
export const decodeId = (id: string) : InterfaceTile => {
  const tile: any  = {}
  const decoded = Base64.decode(id)
  decoded.split(';').map(item => {
    const pattern = /([a-z]*)=(.*)/
    const [, key, value] = item.match(pattern)
    tile[key] = value
  })
  return tile
}

/**
 * Tile contains all the essentials for an individual Google/ArcGIS/Bing Tile
 *
 * @class Tile
 */
export default class Tile {
  public name: string = 'Tile'
  public x: number
  public y: number
  public tile_row: number
  public tile_column: number
  public zoom: number
  public zoom_level: number
  public scheme: string
  public quadkey: string
  public url: string
  public id: string
  public bbox: number[]
  public tms: InterfaceTMS
  public geometry: { type: string, coordinates: number[][][] }

  constructor(init: InterfaceTile) {
    // Define Tile attributes
    if (init) {
      this.x = init.x
      this.y = init.y
      this.zoom = init.zoom ? init.zoom : init.zoom_level
      this.scheme = init.scheme
      this.quadkey = init.quadkey
      this.tile_row = init.tile_row
      this.tile_column = init.tile_column
    }
    // Add missing attributes
    if (!this.x || !this.y) {
      const google = mercator.TileGoogle({
        tx: this.tile_column,
        ty: this.tile_row,
        zoom: this.zoom,
      })
      this.x = google.x
      this.y = google.y
    }
    if (!this.tile_column || !this.tile_row) {
      const tms = mercator.GoogleTile({
        x: this.x,
        y: this.y,
        zoom: this.zoom,
      })
      this.tile_column = tms.tx
      this.tile_row = tms.ty
    }
    if (!this.quadkey) {
      this.quadkey = mercator.TileQuadKey({
        tx: this.tile_column,
        ty: this.tile_row,
        zoom: this.zoom,
      })
    }

    // Extra Properties
    this.bbox = mercator.GoogleLatLonBounds({ x: this.x, y: this.y, zoom: this.zoom })
    this.geometry = turf.bboxPolygon(this.bbox).geometry

    // Handle URL
    this.url = parseUrl(this)
    this.id = encodeId({
      scheme: this.scheme,
      tile_column: this.tile_column,
      tile_row: this.tile_row,
      zoom_level: this.zoom,
    })

    // Validation
    validateTile(init)
  }
  /**
   * Download Tile
   * 
   * @param {String} url (default=this.url)
   * @returns {Promise} => {Buffer}
   */
  public async download(url: string = this.url) {
    const buffer = await downloadTile(url)
    return buffer
  }
}

/* istanbul ignore next */
async function main() {
  const SCHEME = 'http://ecn.t{switch:0,1,2,3}.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=1512&n=z'
  // const TILE = {
  //   scheme: SCHEME,
  //   tile_column: 8,
  //   tile_row: 8,
  //   zoom: 4,
  // }
  const GOOGLE_TILE = {
    scheme: SCHEME,
    x: 3,
    y: 3,
    zoom: 3,
  }
  const tile = new Tile(GOOGLE_TILE)
  debug.log(tile)
}
if (require.main === module) { main() }
