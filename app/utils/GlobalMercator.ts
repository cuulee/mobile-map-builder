import { range } from 'lodash'

export class tile {
  public x: number
  public y: number
  public zoom: number
  constructor(init: {x:number, y:number, zoom:number}) {
    const {x, y, zoom} = init
    this.x = x
    this.y = y
    this.zoom = zoom
  }
}

export class pixels {
  public px: number
  public py: number
  public zoom: number
  constructor(init: {px:number, py:number, zoom?:number}) {
    const {px, py, zoom} = init
    this.px = px
    this.py = py
    this.zoom = zoom
  }
}

export class meters {
  public mx: number
  public my: number
  public zoom: number
  constructor(init: {mx:number, my:number, zoom?:number}) {
    const {mx, my, zoom} = init
    this.mx = mx
    this.my = my
    this.zoom = zoom
  }
}

export class latlng {
  public lat:number
  public lng:number
  public zoom:number
  constructor(init: {lat:number, lng:number, zoom?:number}) {
    const {lat, lng, zoom} = init
    this.lat = lat
    this.lng = lng
    this.zoom = zoom
    if (lat > -90 && lat < 90) { throw new Error('[lat] must be within -90 to 90 degrees')}
    if (lng > -180 && lng < 180) { throw new Error('[lng] must be within -180 to 180 degrees')}
  }
}

/**
 * Global Mercator
 * @name GlobalMercator
 * @example
 * const mercator = GlobalMercator()
 * mercator.LatLngToMeters(tile)
 */
export default class GlobalMercator {
  public name:string = 'GlobalMercator'
  private tileSize:number
  private initialResolution:number
  private originShift:number

  /**
   * Initialize the TMS Global Mercator pyramid
   * @param  {Number} tileSize (default=256)
   */
  constructor(tileSize:number = 256) {
    this.tileSize = tileSize
    this.initialResolution = 2 * Math.PI * 6378137 / this.tileSize
    this.originShift = 2 * Math.PI * 6378137 / 2.0
  }

  /**
   * Resolution (meters/pixel) for given zoom level (measured at Equator) 
   * 
   * @name Resolution
   * @param {Number} zoom
   * @returns {Number}
   */
  Resolution(zoom:number) {
    return this.initialResolution / Math.pow(2, zoom)
  }

  /**
   * Converts given lat/lon in WGS84 Datum to XY in Spherical Mercator EPSG:900913
   * 
   * @name LatLonToMeters
   * @param {Number} lat
   * @param {Number} lng
   * @returns {meters}
   */
  LatLonToMeters(init:latlng) {
    const { lat, lng, zoom } = new latlng(init)

    let mx: number = lng * this.originShift / 180.0
    let my: number = Math.log(Math.tan((90 + lat) * Math.PI / 360.0 )) / (Math.PI / 180.0)
    my = my * this.originShift / 180.0

    return new meters({ mx: mx, my: my, zoom:zoom })
  }

  /**
   * Converts XY point from Spherical Mercator EPSG:900913 to lat/lng in WGS84 Datum 
   * 
   * @name MetersToLatLong
   * @param {Number} mx
   * @param {Number} my
   * @returns {latlng}
   */
  MetersToLatLon(init:meters) {
    const {mx, my, zoom} = new meters(init)
    let lng = (mx / this.originShift) * 180.0
    let lat = (my / this.originShift) * 180.0

    lat = 180 / Math.PI * (2 * Math.atan( Math.exp( lat * Math.PI / 180.0)) - Math.PI / 2.0)

    return new latlng({ lat: lat, lng: lng, zoom:zoom })
  }

  /**
   * Converts EPSG:900913 to pyramid pixel coordinates in given zoom level
   * 
   * @name MetersToPixels
   * @param {Number} mx
   * @param {Number} my
   * @returns {pixels}
   */
  MetersToPixels(init:meters) {
    const {mx, my, zoom} = new meters(init)
    const res = this.Resolution(zoom)
    const px = (mx + this.originShift) / res
    const py = (my + this.originShift) / res

    return new pixels({ px: px, py: py, zoom: zoom })
  }

  /**
   * Returns tile for given mercator coordinates
   * 
   * @name MetersToTile
   * @param {Number} mx
   * @param {Number} my
   * @returns {tile}
   */
  MetersToTile(init:meters) {
    const pixels = this.MetersToPixels(init)

    return this.PixelsToTile(pixels)
  }

  /**
   * Converts pixel coordinates in given zoom level of pyramid to EPSG:900913
   * 
   * @name PixelsToMeters
   * @param {Number} px
   * @param {Number} py
   * @param {Number} zoom
   * @returns {meters}
   */
  PixelsToMeters(init:pixels) {
    const {px, py, zoom} = new pixels(init)
    const res = this.Resolution(zoom)
    const mx = px * res - this.originShift
    const my = py * res - this.originShift

    return new meters({ mx: mx, my: my, zoom: zoom })
  }

  /**
   * Returns a tile covering region in given pixel coordinates
   * 
   * @name PixelsToTile
   * @param {Number} px
   * @param {Number} py
   * @param {Number} zoom
   * @returns {px:number, py:number}
   */
  PixelsToTile(init:pixels) {
    const {px, py, zoom} = new pixels(init)

    if (typeof px == 'undefined') { throw new Error('[px] required') }
    if (typeof py == 'undefined') { throw new Error('[py] required') }
    if (typeof zoom == 'undefined') { throw new Error('[zoom] required') }

    let tx = Math.ceil(px / parseFloat(this.tileSize)) - 1
    let ty = Math.ceil(py / parseFloat(this.tileSize)) - 1

    return { tx: tx, ty: ty, zoom: zoom }
  }


  TileBounds({ tx, ty, zoom }) {
    // Returns bounds of the given tile in EPSG:900913 coordinates

    if (typeof tx == 'undefined') { throw new Error('[tx] required') }
    if (typeof ty == 'undefined') { throw new Error('[ty] required') }
    if (typeof zoom == 'undefined') { throw new Error('[zoom] required') }

    let min = this.PixelsToMeters({ px: tx * this.tileSize, py: ty * this.tileSize, zoom: zoom })
    let max = this.PixelsToMeters({ px: (tx + 1) * this.tileSize, py: (ty + 1) * this.tileSize, zoom: zoom })

    return [ min.mx, min.my, max.mx, max.my ]
  }


  TileLatLonBounds({ tx, ty, zoom }) {
    // Returns bounds of the given tile in latutude/longitude using WGS84 datum

    if (typeof tx == 'undefined') { throw new Error('[tx] required') }
    if (typeof ty == 'undefined') { throw new Error('[ty] required') }
    if (typeof zoom == 'undefined') { throw new Error('[zoom] required') }

    let bounds = this.TileBounds({ tx: tx, ty: ty, zoom:zoom })
    let min = this.MetersToLatLon({ mx: bounds[0], my: bounds[1] })
    let max = this.MetersToLatLon({ mx: bounds[2], my: bounds[3] })

    return [ min.lng, min.lat, max.lng, max.lat ]
  }

  GoogleBounds({ x, y, zoom }) {
    // Converts Google tile system in Mercator bounds (meters)

    if (typeof x == 'undefined') { throw new Error('[x] required') }
    if (typeof y == 'undefined') { throw new Error('[y] required') }
    if (typeof zoom == 'undefined') { throw new Error('[zoom] required') }

    let tile = this.GoogleTile({ x: x, y: y, zoom: zoom })
    return this.TileBounds(tile)
  }

  GoogleLatLonBounds({ x, y, zoom }) {
    // Converts Google tile system in LatLng bounds (degrees)

    if (typeof x == 'undefined') { throw new Error('[x] required') }
    if (typeof y == 'undefined') { throw new Error('[y] required') }
    if (typeof zoom == 'undefined') { throw new Error('[zoom] required') }

    let tile = this.GoogleTile({ x: x, y: y, zoom: zoom })
    return this.TileLatLonBounds(tile)
  }

  TileGoogle({ tx, ty, zoom }) {
    // Converts TMS tile coordinates to Google Tile coordinates

    if (typeof tx == 'undefined') { throw new Error('[tx] required') }
    if (typeof ty == 'undefined') { throw new Error('[ty] required') }
    if (typeof zoom == 'undefined') { throw new Error('[zoom] required') }

    let x = tx
    let y = (Math.pow(2, zoom) - 1) - ty

    return { x: x, y: y, zoom: zoom }
  }

  GoogleTile({ x, y, zoom }) {
    // Converts Google Tile coordinates to TMS tile coordinates

    if (typeof x == 'undefined') { throw new Error('[x] required') }
    if (typeof y == 'undefined') { throw new Error('[y] required') }
    if (typeof zoom == 'undefined') { throw new Error('[zoom] required') }

    let tx = x
    let ty = Math.pow(2, zoom) - y - 1

    return { tx: tx, ty: ty, zoom: zoom }
  }

  GoogleQuadKey({ x, y, zoom }) {
    // Converts Google Tile coordinates to Microsoft QuadKey

    if (typeof x == 'undefined') { throw new Error('[x] required') }
    if (typeof y == 'undefined') { throw new Error('[y] required') }
    if (typeof zoom == 'undefined') { throw new Error('[zoom] required') }

    let tile = this.GoogleTile({ x: x, y: y, zoom: zoom })
    return this.TileQuadKey(tile)
  }

  TileQuadKey({ tx, ty, zoom }) {
    // Converts TMS tile coordinates to Microsoft QuadKey

    if (typeof tx == 'undefined') { throw new Error('[tx] required') }
    if (typeof ty == 'undefined') { throw new Error('[ty] required') }
    if (typeof zoom == 'undefined') { throw new Error('[zoom] required') }

    let quadkey = ''
    ty = (Math.pow(2, zoom) - 1) - ty

    range(zoom, 0, -1).map(i => {
      let digit = 0
      let mask = 1 << (i - 1)
      if ((tx & mask) != 0) { digit += 1 }
      if ((ty & mask) != 0) { digit += 2 }
      quadkey = quadkey.concat(digit)
    })

    return quadkey
  }

  QuadKeyTile(quadkey) {
    // Converts QuadKey to TMS tile coordinates

    if (typeof quadkey !== 'string') { throw new Error('[quadkey] must be string') }

    let google = this.QuadKeyGoogle(quadkey)

    return this.GoogleTile(google)
  }

  QuadKeyGoogle(quadkey) {
    // Converts QuadKey to Google tile

    if (typeof quadkey !== 'string') { throw new Error('[quadkey] must be string') }

    let x = 0
    let y = 0
    let zoom = quadkey.length

    range(zoom, 0, -1).map(i => {
      let mask = 1 << (i - 1)

      switch(parseInt(quadkey[zoom - i])) {
      case 0:
        break
      case 1:
        x += mask
        break
      case 2:
        y += mask
        break
      case 3:
        x += mask
        y += mask
        break
      default:
        throw new Error('Invalid QuadKey digit sequence')
      }
    })
    return { x: x, y: y, zoom: zoom }
  }
}
export const mercator = new GlobalMercator()

if (require.main === module) {
  /* istanbul ignore next */
  const { LATLNG, METERS, PIXELS, TILE, GOOGLE, QUADKEY } = require('../../test/globals')
  /* istanbul ignore next */
  const mercator = new GlobalMercator()
  /* istanbul ignore next */
  console.log(mercator.LatLonToMeters(LATLNG))
  /* istanbul ignore next */
  console.log(mercator.MetersToPixels(METERS))
  /* istanbul ignore next */
  console.log(mercator.MetersToLatLon(METERS))
  /* istanbul ignore next */
  console.log(mercator.PixelsToTile(PIXELS))
  /* istanbul ignore next */
  console.log(mercator.MetersToTile(METERS))
  /* istanbul ignore next */
  console.log(mercator.PixelsToMeters(PIXELS))
  /* istanbul ignore next */
  console.log(mercator.TileBounds(TILE))
  /* istanbul ignore next */
  console.log(mercator.TileQuadKey(TILE))
  /* istanbul ignore next */
  console.log(mercator.QuadKeyGoogle(QUADKEY))
  /* istanbul ignore next */
  console.log(mercator.QuadKeyTile(QUADKEY))
  /* istanbul ignore next */
  console.log(mercator.TileGoogle(TILE))
  /* istanbul ignore next */
  console.log(mercator.GoogleTile(GOOGLE))
  /* istanbul ignore next */
  console.log(mercator.GoogleBounds(GOOGLE))
  /* istanbul ignore next */
  console.log(mercator.GoogleLatLonBounds(GOOGLE))
  /* istanbul ignore next */
  console.log(mercator.TileLatLonBounds(TILE))
  /* istanbul ignore next */
  console.log(mercator.GoogleQuadKey(GOOGLE))
}
