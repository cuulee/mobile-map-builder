import debug from './debug'
import { range, isUndefined, keys } from 'lodash'

export interface InterfaceMeters {
  mx: number
  my: number
  zoom: number
}

export interface InterfacePixels {
  px: number
  py: number
  zoom: number
}

export interface InterfaceLatLng {
  lat: number
  lng: number
  zoom?: number
  z?: number
}

export interface InterfaceGoogle {
  x: number
  y: number
  zoom: number
}

export interface InterfaceTile {
  tx: number
  ty: number
  zoom: number
}

/**
 * Validate Undefined
 * @name validateUndefined
 * @param {String} name
 * @param {Object} items
 * @example
 * validateUndefined('Meters', Object)
 */
export const validateUndefined = (items: any, name: string) => {
  for (let key of keys(items)) {
    if (isUndefined(items[key])) {
      const message = `${ name } <${ key }> is required.`
      debug.error(message)
      throw new Error(message)
    }
  }
}

/**
 * Validates Tile
 * @name validateTile
 * @example
 * const tile = validateTile({tx: 60, ty: 80, zoom: 5})
 * //= {tx: 60, ty: 80, zoom: 5}
 */
export const validateTile = (init: InterfaceTile, name = 'Tile') => {
  const { tx, ty, zoom } = init
  validateZoom(zoom, 'Tile')
  if (tx < 0) {
    const message = `${ name } <tx> must not be less than 0`
    debug.error(message)
    throw new Error(message)
  } else if (ty < 0) {
    const message = `${ name } <ty> must not be less than 0`
    debug.error(message)
    throw new Error(message)
  }
  return init
}

/**
 * Validates Zoom
 * @name validateZoom
 * @example
 * const zoom = validateZoom(12)
 * //= 12
 */
export const validateZoom = (zoom: number, name: string) => {
  if (zoom < 0) {
    const message = `${ name } <zoom> cannot be less than 0`
    debug.error(message)
    throw new Error(message)
  } else if (zoom > 23) {
    const message = `${ name } <zoom> cannot be greater than 23`
    debug.error(message)
    throw new Error(message)
  }
  return zoom
}

/**
 * Validates Pixels
 * @name validatePixels
 * @example
 * const pixels = validatePixels([-115, 44])
 * //= [-115, 44]
 */
export const validatePixels = (init: number[]) => {
  if (init.length < 2 || init.length > 3) {
    const message = 'Pixels must be an Array of 2 numbers'
    debug.error(message)
    throw new Error(message)
  }
  let [px, py] = init
  if (px % 1 !== 0) {
    px = px - px % 1
    const message = `Pixels [px] has been modified to ${ px }`
    debug.warning(message)
  }
  if (py % 1 !== 0) {
    py = py - py % 1
    const message = `Pixels [py] has been modified to ${ py }`
    debug.warning(message)
  }
  return [px, py]
}

/**
 * Validates Meters
 * @name validateMeters
 * @example
 * const meters = validateMeters([-115, 44])
 * //= [-115, 44]
 */
export const validateMeters = (init: number[]) => {
  if (init.length < 2 || init.length > 3) {
    const message = 'Meters must be an Array of 2 numbers'
    debug.error(message)
    throw new Error(message)
  }
  const max = 20037508.342789244
  const min = -20037508.342789244
  let [mx, my] = init
  if (my > max) {
    my = max
    const message = `Meters [my] has been modified to ${ my }`
    debug.warning(message)
  }
  if (my < min) {
    my = min
    const message = `Meters [my] has been modified to ${ my }`
    debug.warning(message)
  }
  if (mx > max) {
    mx = max
    const message = `Meters [mx] has been modified to ${ mx }`
    debug.warning(message)
  }
  if (mx < min) {
    mx = min
    const message = `Meters [mx] has been modified to ${ mx }`
    debug.warning(message)
  }
  return [mx, my]
}

/**
 * Validates LngLat
 * @name validateLngLat
 * @example
 * const lnglat = validateLngLat([-115, 44])
 * //= [-115, 44]
 */
export const validateLngLat = (init: number[]) => {
  if (init.length < 2 || init.length > 3) {
    const message = 'LngLat must be an Array of 2 numbers'
    debug.error(message)
    throw new Error(message)
  }
  let [lng, lat] = init
  if (lat < -90 || lat > 90) {
    const message = 'LngLat [lat] must be within -90 to 90 degrees'
    debug.error(message)
    throw new Error(message)
  } else if (lng < -180 || lng > 180) {
    const message = 'LngLat [lng] must be within -180 to 180 degrees'
    debug.error(message)
    throw new Error(message)
  }
  if (lat > 85.05112877980659) {
    const message = 'LngLat [lat] has been modified to 85.05112877980659'
    debug.warning(message)
    lat = 85.05112877980659
  }
  if (lat < -85.05112877980659) {
    const message = 'LngLat [lat] has been modified to -85.05112877980659'
    debug.warning(message)
    lat = -85.05112877980659
  }
  return [lng, lat]
}

/**
 * Validates bounds
 * @name bounds
 * @example
 * const bounds = validateBounds([ -75, 44, -74, 45 ])
 * //= [ -75, 44, -74, 45 ]
 */
export const validateBounds = (init: number[]) => {
  if (init.length !== 4) {
    const message = '[bounds] must be an Array of 4 numbers'
    debug.error(message)
    throw new Error(message)
  }
  return [...init]
}

/**
 * LngLatbounds
 * @name LngLatBounds
 * @example
 * const { bounds } = new LngLatBounds([ -75, 44, -74, 45 ])
 * //= [ -75, 44, -74, 45 ]
 */
export class LngLatBounds {
  public x1: number
  public y1: number
  public x2: number
  public y2: number
  public bounds: number[]
  public t1: number[]
  public t2: number[]

  constructor(init: number[]) {
    const [x1, y1, x2, y2] = validateBounds(init)
    this.x1 = x1
    this.y1 = y1
    this.x2 = x2
    this.y2 = y2
    this.t1 = validateLngLat([x1, y1])
    this.t2 = validateLngLat([x2, y2])
    this.bounds = this.t1.concat(this.t2)
  }
}

export class Google {
  public x: number
  public y: number
  public zoom: number

  constructor(init: InterfaceGoogle) {
    const {x, y, zoom} = init
    this.x = x
    this.y = y
    this.zoom = zoom
    validateUndefined(this, 'Google')
  }
}

export class Tile {
  public tx: number
  public ty: number
  public zoom: number

  constructor(init: InterfaceTile) {
    const {tx, ty, zoom} = init
    this.tx = tx
    this.ty = ty
    this.zoom = zoom
    validateUndefined(this, 'Tile')
    validateTile(this)
  }
}

export class Pixels {
  public px: number
  public py: number
  public zoom: number

  constructor(init: InterfacePixels) {
    const [px, py] = validatePixels([init.px, init.py])
    this.px = px
    this.py = py
    if (!isUndefined(init.zoom)) { this.zoom = init.zoom }
    validateUndefined(this, 'Pixels')
  }
}

export class Meters {
  public mx: number
  public my: number
  public zoom: number

  constructor(init: InterfaceMeters) {
    const [mx, my] = validateMeters([init.mx, init.my])
    this.mx = mx
    this.my = my
    this.zoom = init.zoom
    validateUndefined(this, 'Meters')
  }
}

export class LngLat {
  public lat: number
  public lng: number
  public x: number
  public y: number
  public z: number
  public zoom: number
  public xy: number[]
  public xyz: number[]
  public latlng: number[]
  public lnglat: number[]
  constructor(init: InterfaceLatLng) {
    const [lng, lat] = validateLngLat([init.lng, init.lat])
    this.lat = lat
    this.lng = lng
    this.x = lng
    this.y = lat
    this.xy = [lng, lat]
    this.lnglat = [lng, lat]
    this.latlng = [lat, lng]

    if (!isUndefined(init.zoom)) { this.zoom = init.zoom }
    if (!isUndefined(init.z)) { this.z = init.z } else { this.z = 0 }

    this.xyz = [lng, lat, this.z]
    validateUndefined(this, 'LatLng')
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
  public LatLonToMeters(init: InterfaceLatLng) {
    const { lat, lng, zoom } = new LngLat(init)
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
  public MetersToLatLon(init: InterfaceMeters) {
    const { mx, my, zoom } = new Meters(init)
    let lng = (mx / this.originShift) * 180.0
    let lat = (my / this.originShift) * 180.0
    lat = 180 / Math.PI * (2 * Math.atan( Math.exp( lat * Math.PI / 180.0)) - Math.PI / 2.0)

    return new LngLat({ lat, lng, zoom })
  }

  /**
   * Converts EPSG:900913 to pyramid pixel coordinates in given zoom level
   * 
   * @name MetersToPixels
   * @param {Number} mx
   * @param {Number} my
   * @param {Number} zoom
   * @returns {Pixels}
   */
  public MetersToPixels(init: InterfaceMeters) {
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
   * @param {Number} zoom
   * @returns {Tile}
   */
  public LatLngToTile(init: InterfaceLatLng) {
    const meters = this.LatLonToMeters(init)
    const pixels = this.MetersToPixels(meters)
    return this.PixelsToTile(pixels)
  }

  /**
   * Returns Google Tile for given latlng coordinates
   * 
   * @name LatLngToTile
   * @param {Number} lat
   * @param {Number} lng
   * @returns {Google} Google Tile
   */
  public LatLngToGoogle(init: InterfaceLatLng) {
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
    let tx = Math.ceil(px / this.TileSize) - 1
    let ty = Math.ceil(py / this.TileSize) - 1
    if (tx < 0) { tx = 0 }
    if (ty < 0) { ty = 0 }
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

    return validateBounds([ min.mx, min.my, max.mx, max.my ])
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

    return validateBounds([ min.lng, min.lat, max.lng, max.lat ])
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
  // const METERS = { mx: -8348961.809495518, my: 5621521.486192067, zoom: 13 }
  // const lnglat = new LngLat({lat: 45, lng: -75})
  new LngLat({ lat: -220, lng: 120 })
}

/* istanbul ignore next */
if (require.main === module) {
  main()
}
