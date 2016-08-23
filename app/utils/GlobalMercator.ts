import debug from './debug'
import { range } from 'lodash'

export const bounds = (init: number[]) => {
  if (init.length !== 4) {
    const message = '[bounds] Must be an array with 4x Numbers.'
    debug.error(message)
    throw new Error(message)
  }
  return [...init]
}

/**
 * Validates LatLng bounds
 * @name LatLngBounds
 * @example
 * const bounds = LatLngBounds([ -75, 44, -74, 45 ])
 * //= [ -75, 44, -74, 45 ]
 */
export const LatLngBounds = (init: number[]) => {
  const [x1, y1, x2, y2] = bounds(init)
  const t1 = new LatLng({lat: y1, lng: x1})
  const t2 = new LatLng({lat: y2, lng: x2})
  return [t1.lng, t1.lat, t2.lng, t2.lat]
}

export class Google {
  public x: number
  public y: number
  public zoom: number
  constructor(init: {x: number, y: number, zoom: number}) {
    const {x, y, zoom} = init
    this.x = x
    this.y = y
    this.zoom = zoom
  }
}

export class Tile {
  public tx: number
  public ty: number
  public zoom: number
  constructor(init: {tx: number, ty: number, zoom: number}) {
    const {tx, ty, zoom} = init
    this.tx = tx
    this.ty = ty
    this.zoom = zoom
  }
}

export class Pixels {
  public px: number
  public py: number
  public zoom: number
  constructor(init: {px: number, py: number, zoom?: number}) {
    const {px, py, zoom} = init
    this.px = px
    this.py = py
    if (zoom) { this.zoom = zoom }
  }
}

export class Meters {
  public mx: number
  public my: number
  public zoom: number
  constructor(init: {mx: number, my: number, zoom?: number}) {
    const {mx, my, zoom} = init
    this.mx = mx
    this.my = my
    if (zoom) { this.zoom = zoom }
  }
}

export class LatLng {
  public lat: number
  public lng: number
  public zoom: number
  constructor(init: {lat: number, lng: number, zoom?: number}) {
    const {lat, lng, zoom} = init
    this.lat = lat
    this.lng = lng
    if (zoom) { this.zoom = zoom }
    if (lat < -90 || lat > 90) {
      const message = 'LatLng [lat] must be within -90 to 90 degrees'
      debug.error(message)
      throw new Error(message)
    }
    if (lng < -180 || lng > 180) {
      const message = 'LatLng [lng] must be within -180 to 180 degrees'
      debug.error(message)
      throw new Error(message)
    }
  }
}

/**
 * Global Mercator
 * @name GlobalMercator
 * @example
 * const mercator = GlobalMercator()
 * mercator.LatLngToMeters(Tile)
 */
export default class GlobalMercator {
  public name: string = 'GlobalMercator'
  private TileSize: number
  private initialResolution: number
  private originShift: number

  /**
   * Initialize the TMS Global Mercator pyramid
   * @param  {Number} TileSize (default=256)
   */
  constructor(TileSize: number = 256) {
    this.TileSize = TileSize
    this.initialResolution = 2 * Math.PI * 6378137 / this.TileSize
    this.originShift = 2 * Math.PI * 6378137 / 2.0
  }

  /**
   * Resolution (Meters/pixel) for given zoom level (measured at Equator) 
   * 
   * @name Resolution
   * @param {Number} zoom
   * @returns {Number}
   */
  public Resolution(zoom: number) {
    return this.initialResolution / Math.pow(2, zoom)
  }

  /**
   * Converts given lat/lon in WGS84 Datum to XY in Spherical Mercator EPSG:900913
   * 
   * @name LatLonToMeters
   * @param {Number} lat
   * @param {Number} lng
   * @returns {Meters}
   */
  public LatLonToMeters(init: LatLng) {
    const { lat, lng, zoom } = new LatLng(init)
    let mx: number = lng * this.originShift / 180.0
    let my: number = Math.log(Math.tan((90 + lat) * Math.PI / 360.0 )) / (Math.PI / 180.0)
    my = my * this.originShift / 180.0

    return new Meters({ mx, my, zoom })
  }

  /**
   * Converts XY point from Spherical Mercator EPSG:900913 to lat/lng in WGS84 Datum 
   * 
   * @name MetersToLatLong
   * @param {Number} mx
   * @param {Number} my
   * @returns {LatLng}
   */
  public MetersToLatLon(init: Meters) {
    const { mx, my, zoom } = new Meters(init)
    let lng = (mx / this.originShift) * 180.0
    let lat = (my / this.originShift) * 180.0
    lat = 180 / Math.PI * (2 * Math.atan( Math.exp( lat * Math.PI / 180.0)) - Math.PI / 2.0)

    return new LatLng({ lat, lng, zoom })
  }

  /**
   * Converts EPSG:900913 to pyramid pixel coordinates in given zoom level
   * 
   * @name MetersToPixels
   * @param {Number} mx
   * @param {Number} my
   * @returns {Pixels}
   */
  public MetersToPixels(init: Meters) {
    const { mx, my, zoom } = new Meters(init)
    const res = this.Resolution(zoom)
    const px = (mx + this.originShift) / res
    const py = (my + this.originShift) / res

    return new Pixels({ px, py, zoom })
  }

  /**
   * Returns Tile for given latlng coordinates
   * 
   * @name LatLngToTile
   * @param {Number} lat
   * @param {Number} lng
   * @returns {Tile}
   */
  public LatLngToTile(init: LatLng) {
    const Pixels = this.MetersToPixels(this.LatLonToMeters(init))
    return this.PixelsToTile(Pixels)
  }

  /**
   * Returns Google Tile for given latlng coordinates
   * 
   * @name LatLngToTile
   * @param {Number} lat
   * @param {Number} lng
   * @returns {Google} Google Tile
   */
  public LatLngToGoogle(init: LatLng) {
    if (init.zoom === 0) { return new Google({ x: 0, y: 0, zoom: 0 })}
    const tile = this.LatLngToTile(init)
    return this.TileGoogle(tile)
  }

  /**
   * Returns Tile for given mercator coordinates
   * 
   * @name MetersToTile
   * @param {Number} mx
   * @param {Number} my
   * @returns {Tile}
   */
  public MetersToTile(init: Meters) {
    if (init.zoom === 0) { return new Tile({ tx: 0, ty: 0, zoom: 0 })}
    const Pixels = this.MetersToPixels(new Meters(init))
    return this.PixelsToTile(Pixels)
  }

  /**
   * Converts pixel coordinates in given zoom level of pyramid to EPSG:900913
   * 
   * @name PixelsToMeters
   * @param {Number} px
   * @param {Number} py
   * @param {Number} zoom
   * @returns {Meters}
   */
  public PixelsToMeters(init: Pixels) {
    const {px, py, zoom} = new Pixels(init)
    const res = this.Resolution(zoom)
    const mx = px * res - this.originShift
    const my = py * res - this.originShift

    return new Meters({ mx, my, zoom })
  }

  /**
   * Returns a Tile covering region in given pixel coordinates
   * 
   * @name PixelsToTile
   * @param {Number} px
   * @param {Number} py
   * @param {Number} zoom
   * @returns {Tile}
   */
  public PixelsToTile(init: Pixels) {
    if (init.zoom === 0) { return new Tile({ tx: 0, ty: 0, zoom: 0 })}

    const {px, py, zoom} = new Pixels(init)
    const tx = Math.ceil(px / this.TileSize) - 1
    const ty = Math.ceil(py / this.TileSize) - 1

    return new Tile({ tx, ty, zoom })
  }

  /**
   * Returns bounds of the given Tile in EPSG:900913 coordinates
   * 
   * @name TileBounds
   * @param {Number} tx
   * @param {Number} ty
   * @param {Number} zoom
   * @returns {bounds}
   */
  public TileBounds(init: Tile) {
    const {tx, ty, zoom} = new Tile(init)
    let min = this.PixelsToMeters({ px: tx * this.TileSize, py: ty * this.TileSize, zoom })
    let max = this.PixelsToMeters({ px: (tx + 1) * this.TileSize, py: (ty + 1) * this.TileSize, zoom })

    return bounds([ min.mx, min.my, max.mx, max.my ])
  }

  /**
   * Returns bounds of the given Tile in EPSG:900913 coordinates
   * 
   * @name TileLatLonBounds
   * @param {Number} tx
   * @param {Number} ty
   * @param {Number} zoom
   * @returns {bounds}
   */
  public TileLatLonBounds(init: Tile) {
    if (init.zoom === 0) { return [ -180, -85.05112877980659, 180, 85.05112877980659 ] }

    const {tx, ty, zoom} = new Tile(init)
    const [mx1, my1, mx2, my2] = this.TileBounds({ tx, ty, zoom })
    const min = this.MetersToLatLon({ mx: mx1, my: my1, zoom })
    const max = this.MetersToLatLon({ mx: mx2, my: my2, zoom })

    return bounds([ min.lng, min.lat, max.lng, max.lat ])
  }

  /**
   * Converts Google Tile system in Mercator bounds (Meters)
   * 
   * @name GoogleBounds
   * @param {Number} x
   * @param {Number} y
   * @param {Number} zoom
   * @returns {bounds}
   */
  public GoogleBounds(init: Google) {
    const Tile = this.GoogleTile(init)
    return this.TileBounds(Tile)
  }

  /**
   * Converts Google Tile system in LatLng bounds (degrees)
   * 
   * @name GoogleLatLonBounds
   * @param {Number} x
   * @param {Number} y
   * @param {Number} zoom
   * @returns {bounds}
   */
  public GoogleLatLonBounds(init: Google) {
    const Tile = this.GoogleTile(init)
    return this.TileLatLonBounds(Tile)
  }

  /**
   * Converts TMS Tile coordinates to Google Tile coordinates
   * 
   * @name TileGoogle
   * @param {Number} tx
   * @param {Number} ty
   * @param {Number} zoom
   * @returns {bounds}
   */
  public TileGoogle(init: Tile) {
    if (init.zoom === 0) { return new Google({ x: 0, y: 0, zoom: 0 })}

    const { tx, ty, zoom } = new Tile(init)
    const x = tx
    const y = (Math.pow(2, zoom) - 1) - ty

    return new Google({ x, y, zoom })
  }

  /**
   * Converts Google Tile coordinates to TMS Tile coordinates
   * 
   * @name GoogleTile
   * @param {Number} x
   * @param {Number} y
   * @param {Number} zoom
   * @returns {Tile}
   */
  public GoogleTile(init: Google) {
    const { x, y, zoom } = new Google(init)
    const tx = x
    const ty = Math.pow(2, zoom) - y - 1

    return new Tile({ tx, ty, zoom })
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
  public GoogleQuadKey(init: Google) {
    const Tile = this.GoogleTile(init)
    return this.TileQuadKey(Tile)
  }

  /**
   * Converts TMS Tile coordinates to Microsoft QuadKey
   * 
   * @name TileQuadKey
   * @param {Number} tx
   * @param {Number} ty
   * @param {Number} zoom
   * @returns {quadkey}
   */
  public TileQuadKey(init: Tile) {
    // Zoom 0 does not exist for QuadKey
    if (init.zoom === 0) { return '' }

    let { tx, ty, zoom } = new Tile(init)
    let quadkey = ''

    ty = (Math.pow(2, zoom) - 1) - ty
    range(zoom, 0, -1).map(i => {
      let digit: any = 0
      let mask = 1 << (i - 1)
      if ((tx & mask) !== 0) { digit += 1 }
      if ((ty & mask) !== 0) { digit += 2 }
      quadkey = quadkey.concat(digit)
    })

    return quadkey
  }

  /**
   * Converts QuadKey to TMS Tile coordinates
   * 
   * @name QuadKeyTile
   * @param {String} quadkey
   * @returns {Tile}
   */
  public QuadKeyTile(quadkey: string) {
    const Google = this.QuadKeyGoogle(quadkey)
    return this.GoogleTile(Google)
  }

  /**
   * Converts QuadKey to Google Tile
   * 
   * @name QuadKeyGoogle
   * @param {String} quadkey
   * @returns {Google}
   */
  public QuadKeyGoogle(quadkey: string) {
    let x: number = 0
    let y: number = 0
    const zoom = quadkey.length

    range(zoom, 0, -1).map(i => {
      let mask = 1 << (i - 1)

      switch (parseInt(quadkey[zoom - i], 0)) {
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
    return new Google({ x, y, zoom })
  }
}
export const mercator = new GlobalMercator()

/* istanbul ignore next */
async function main() {
  const { LatLng, Meters, Pixels, Tile, Google, QUADKEY } = require('../../test/globals')
  debug.log(mercator.GoogleQuadKey(Google))
  debug.log(mercator.LatLonToMeters(LatLng))
  debug.log(mercator.MetersToPixels(Meters))
  debug.log(mercator.MetersToLatLon(Meters))
  debug.log(mercator.PixelsToTile(Pixels))
  debug.log(mercator.MetersToTile(Meters))
  debug.log(mercator.PixelsToMeters(Pixels))
  debug.log(mercator.TileBounds(Tile))
  debug.log(mercator.TileQuadKey(Tile))
  debug.log(mercator.QuadKeyGoogle(QUADKEY))
  debug.log(mercator.QuadKeyTile(QUADKEY))
  debug.log(mercator.TileGoogle(Tile))
  debug.log(mercator.GoogleTile(Google))
  debug.log(mercator.GoogleBounds(Google))
  debug.log(mercator.GoogleLatLonBounds(Google))
  debug.log(mercator.TileLatLonBounds(Tile))
  debug.log(mercator.GoogleQuadKey(Google))
}

/* istanbul ignore next */
if (require.main === module) {
  main()
}
