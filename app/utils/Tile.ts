import * as uuid from 'node-uuid'
import * as turf from 'turf'
import * as rp from 'request-promise'
import * as fs from 'fs'
import { sample } from 'lodash'
import { mercator } from './GlobalMercator'
import debug from './debug'

export interface InterfaceTile {
  x: number,
  y: number,
  zoom: number,
  tile_row?: number,
  tile_column?: number,
  quadkey?: string,
  scheme?: string,
  id?: string,
  bbox?: number[],
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

export const downloadTile = (url: string) => {
  return rp.get(url, { encoding : 'binary' })
    .then(data => new Buffer(data, 'binary'))
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
  public tileRow: number
  public tileColumn: number
  public zoom: number
  public scheme: string
  public quadkey: string
  public url: string
  public id: string
  public bbox: number[]
  public geometry: { type: string, coordinates: number[][][] }

  constructor(tile: InterfaceTile) {
    // User Input
    this.x = tile.x
    this.y = tile.y
    this.zoom = tile.zoom
    this.scheme = tile.scheme
    this.quadkey = tile.quadkey

    // Extra Properties
    this.bbox = mercator.GoogleLatLonBounds({ x: this.x, y: this.y, zoom: this.zoom })
    this.geometry = turf.bboxPolygon(this.bbox).geometry
    this.quadkey = mercator.GoogleQuadKey({ x: this.x, y: this.y, zoom: this.zoom })
    this.url = parseUrl(tile)
    this.id = uuid.v4()

    // TMS Tiles Scheme
    const tms = mercator.GoogleTile(tile)
    this.tileRow = tms.ty
    this.tileColumn = tms.tx

    // Validation
    validateTile(tile)
  }
  /**
   * Download Tile
   * 
   * @param {String} url (default=this.url)
   * @returns {Promise} => {Buffer}
   */
  public download(url: string = this.url) {
    return downloadTile(url)
  }
}

/* istanbul ignore next */
if (require.main === module) {
  const TILE = {
    scheme: 'http://tile-{switch:a,b,c}.openstreetmap.fr/hot/{zoom}/{x}/{y}.png',
    x: 2375,
    y: 2925,
    zoom: 13,
  }
  const tile = new Tile(TILE)
  debug.log(mercator.GoogleTile(tile))
  debug.log(tile)
  tile.download()
    // .then(data => debug.log(data))
    .then(data => fs.writeFile('image.png', data, 'binary'))
}
