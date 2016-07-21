import { range } from 'lodash'

export const bounds = (init:number[]) => {
  if (init.length !== 4) { throw new Error('[bounds] Must be an array with 4x Numbers.')}
  return [...init]
}

export class google {
  x: number
  y: number
  zoom: number
  constructor(init: {x:number, y:number, zoom:number}) {
    const {x, y, zoom} = init
    this.x = x
    this.y = y
    this.zoom = zoom
  }
}

export class tile {
  tx: number
  ty: number
  zoom: number
  constructor(init: {tx:number, ty:number, zoom:number}) {
    const {tx, ty, zoom} = init
    this.tx = tx
    this.ty = ty
    this.zoom = zoom
  }
}

export class pixels {
  px: number
  py: number
  zoom: number
  constructor(init: {px:number, py:number, zoom?:number}) {
    const {px, py, zoom} = init
    this.px = px
    this.py = py
    if (zoom) { this.zoom = zoom }
  }
}

export class meters {
  mx: number
  my: number
  zoom: number
  constructor(init: {mx:number, my:number, zoom?:number}) {
    const {mx, my, zoom} = init
    this.mx = mx
    this.my = my
    if (zoom) { this.zoom = zoom }
  }
}

export class latlng {
  lat:number
  lng:number
  zoom:number
  constructor(init: {lat:number, lng:number, zoom?:number}) {
    const {lat, lng, zoom} = init
    this.lat = lat
    this.lng = lng
    this.zoom = zoom
    if (lat < -90 || lat > 90) { throw new Error('[lat] must be within -90 to 90 degrees')}
    if (lng < -180 || lng > 180) { throw new Error('[lng] must be within -180 to 180 degrees')}
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
    const pixels = this.MetersToPixels(new meters(init))

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
   * @returns {tile}
   */
  PixelsToTile(init:pixels) {
    const {px, py, zoom} = new pixels(init)
    const tx = Math.ceil(px / this.tileSize) - 1
    const ty = Math.ceil(py / this.tileSize) - 1

    return new tile({ tx: tx, ty: ty, zoom: zoom })
  }

  /**
   * Returns bounds of the given tile in EPSG:900913 coordinates
   * 
   * @name TileBounds
   * @param {Number} tx
   * @param {Number} ty
   * @param {Number} zoom
   * @returns {bounds}
   */
  TileBounds(init:tile) {
    const {tx, ty, zoom} = new tile(init)
    let min = this.PixelsToMeters({ px: tx * this.tileSize, py: ty * this.tileSize, zoom: zoom })
    let max = this.PixelsToMeters({ px: (tx + 1) * this.tileSize, py: (ty + 1) * this.tileSize, zoom: zoom })

    return bounds([ min.mx, min.my, max.mx, max.my ])
  }

  /**
   * Returns bounds of the given tile in EPSG:900913 coordinates
   * 
   * @name TileLatLonBounds
   * @param {Number} tx
   * @param {Number} ty
   * @param {Number} zoom
   * @returns {bounds}
   */
  TileLatLonBounds(init:tile) {
    const {tx, ty, zoom} = new tile(init)
    const [mx1, my1, mx2, my2] = this.TileBounds({ tx: tx, ty: ty, zoom:zoom })
    const min = this.MetersToLatLon({ mx: mx1, my: my1, zoom:zoom })
    const max = this.MetersToLatLon({ mx: mx2, my: my2, zoom:zoom })
    
    return bounds([ min.lng, min.lat, max.lng, max.lat ])
  }

  /**
   * Converts Google tile system in Mercator bounds (meters)
   * 
   * @name GoogleBounds
   * @param {Number} x
   * @param {Number} y
   * @param {Number} zoom
   * @returns {bounds}
   */
  GoogleBounds(init:google) {
    const tile = this.GoogleTile(init)
    return this.TileBounds(tile)
  }

  /**
   * Converts Google tile system in LatLng bounds (degrees)
   * 
   * @name GoogleLatLonBounds
   * @param {Number} x
   * @param {Number} y
   * @param {Number} zoom
   * @returns {bounds}
   */
  GoogleLatLonBounds(init:google) {
    const tile = this.GoogleTile(init)
    return this.TileLatLonBounds(tile)
  }

  /**
   * Converts TMS tile coordinates to Google Tile coordinates
   * 
   * @name TileGoogle
   * @param {Number} tx
   * @param {Number} ty
   * @param {Number} zoom
   * @returns {bounds}
   */
  TileGoogle(init:tile) {
    const { tx, ty, zoom } = new tile(init)
    const x = tx
    const y = (Math.pow(2, zoom) - 1) - ty

    return new google({ x: x, y: y, zoom: zoom })
  }

  /**
   * Converts Google Tile coordinates to TMS tile coordinates
   * 
   * @name GoogleTile
   * @param {Number} x
   * @param {Number} y
   * @param {Number} zoom
   * @returns {tile}
   */
  GoogleTile(init:google) {
    const { x, y, zoom } = new google(init)
    const tx = x
    const ty = Math.pow(2, zoom) - y - 1
  
    return new tile({ tx: tx, ty: ty, zoom: zoom })
  }

  /**
   * Converts Google Tile coordinates to Microsoft QuadKey
   * 
   * @name GoogleTile
   * @param {Number} x
   * @param {Number} y
   * @param {Number} zoom
   * @returns {quadkey}
   */
  GoogleQuadKey(init:google) {
    const tile = this.GoogleTile(init)
    return this.TileQuadKey(tile)
  }

  /**
   * Converts TMS tile coordinates to Microsoft QuadKey
   * 
   * @name TileQuadKey
   * @param {Number} tx
   * @param {Number} ty
   * @param {Number} zoom
   * @returns {quadkey}
   */
  TileQuadKey(init:tile) {
    let { tx, ty, zoom } = new tile(init)
    let quadkey = ''

    ty = (Math.pow(2, zoom) - 1) - ty
    range(zoom, 0, -1).map(i => {
      let digit:string = '0'
      let mask = 1 << (i - 1)
      if ((tx & mask) != 0) { digit += 1 }
      if ((ty & mask) != 0) { digit += 2 }
      quadkey = quadkey.concat(digit)
    })

    return quadkey
  }

  /**
   * Converts QuadKey to TMS tile coordinates
   * 
   * @name QuadKeyTile
   * @param {String} quadkey
   * @returns {tile}
   */
  QuadKeyTile(quadkey:string) {
    const google = this.QuadKeyGoogle(quadkey)
    return this.GoogleTile(google)
  }

  /**
   * Converts QuadKey to Google tile
   * 
   * @name QuadKeyGoogle
   * @param {String} quadkey
   * @returns {google}
   */
  QuadKeyGoogle(quadkey:string) {
    let x = 0
    let y = 0
    const zoom = quadkey.length

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
    return new google({ x: x, y: y, zoom: zoom })
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
