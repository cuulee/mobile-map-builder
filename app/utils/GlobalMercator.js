import { range } from 'lodash'

export default class GlobalMercator {
  constructor({ tileSize=256 } = {}) {
    // Initialize the TMS Global Mercator pyramid

    this.tileSize = tileSize
    this.initialResolution = 2 * Math.PI * 6378137 / this.tileSize
    this.originShift = 2 * Math.PI * 6378137 / 2.0
  }

  Resolution(zoom) {
    // Resolution (meters/pixel) for given zoom level (measured at Equator)

    if (typeof zoom == 'undefined') { throw new Error('[zoom] required') }

    return this.initialResolution / Math.pow(2, zoom)
  }

  LatLonToMeters({ lat, lng }) {
    // Converts given lat/lon in WGS84 Datum to XY in Spherical Mercator EPSG:900913

    if (typeof lat == 'undefined') { throw new Error('[lat] required') }
    if (typeof lng == 'undefined') { throw new Error('[lng] required') }

    let mx = lng * this.originShift / 180.0
    let my = Math.log(Math.tan((90 + lat) * Math.PI / 360.0 )) / (Math.PI / 180.0)
    my = my * this.originShift / 180.0

    return { mx: mx, my: my }
  }

  MetersToLatLon({ mx, my }) {
    // Converts XY point from Spherical Mercator EPSG:900913 to lat/lng in WGS84 Datum

    if (typeof mx == 'undefined') { throw new Error('[mx] required') }
    if (typeof my == 'undefined') { throw new Error('[my] required') }

    let lng = (mx / this.originShift) * 180.0
    let lat = (my / this.originShift) * 180.0

    lat = 180 / Math.PI * (2 * Math.atan( Math.exp( lat * Math.PI / 180.0)) - Math.PI / 2.0)

    return { lat: lat, lng: lng }
  }

  MetersToPixels({ mx, my, zoom }) {
    // Converts EPSG:900913 to pyramid pixel coordinates in given zoom level

    if (typeof mx == 'undefined') { throw new Error('[mx] required') }
    if (typeof my == 'undefined') { throw new Error('[my] required') }
    if (typeof zoom == 'undefined') { throw new Error('[zoom] required') }

    let res = this.Resolution(zoom)
    let px = (mx + this.originShift) / res
    let py = (my + this.originShift) / res

    return { px: px, py: py, zoom: zoom }
  }

  MetersToTile({ mx, my, zoom }) {
    // Returns tile for given mercator coordinates

    if (typeof mx == 'undefined') { throw new Error('[mx] required') }
    if (typeof my == 'undefined') { throw new Error('[my] required') }
    if (typeof zoom == 'undefined') { throw new Error('[zoom] required') }

    let pixels = this.MetersToPixels({ mx, my, zoom })

    return this.PixelsToTile(pixels)
  }

  PixelsToMeters({ px, py, zoom }) {
    // Converts pixel coordinates in given zoom level of pyramid to EPSG:900913

    if (typeof px == 'undefined') { throw new Error('[px] required') }
    if (typeof py == 'undefined') { throw new Error('[py] required') }
    if (typeof zoom == 'undefined') { throw new Error('[zoom] required') }

    let res = this.Resolution(zoom)
    let mx = px * res - this.originShift
    let my = py * res - this.originShift

    return { mx: mx, my: my, zoom: zoom }
  }

  PixelsToTile({ px, py, zoom }) {
    // Returns a tile covering region in given pixel coordinates

    if (typeof px == 'undefined') { throw new Error('[px] required') }
    if (typeof py == 'undefined') { throw new Error('[py] required') }
    if (typeof zoom == 'undefined') { throw new Error('[zoom] required') }

    let tx = parseInt(Math.ceil(px / parseFloat(this.tileSize)) - 1)
    let ty = parseInt(Math.ceil(py / parseFloat(this.tileSize)) - 1)

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

    return { quadkey: quadkey }
  }

  QuadKeyTile({ quadkey }) {
    // Converts QuadKey to TMS tile coordinates

    if (typeof quadkey == 'undefined') { throw new Error('[quadkey] required') }
    if (typeof quadkey !== 'string') { throw new Error('[quadkey] must be string') }

    let google = this.QuadKeyGoogle({ quadkey: quadkey })

    return this.GoogleTile(google)
  }

  QuadKeyGoogle({ quadkey }) {
    // Converts QuadKey to Google tile

    if (typeof quadkey == 'undefined') { throw new Error('[quadkey] required') }
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

/*if (require.main === module) {
  const LATLNG = { lat: 45, lng: -75 }
  const METERS = { mx: -8348961.809495518, my: 5621521.486192067, zoom: 13 }
  const PIXELS = { px: 611669.3333333334, py: 1342753.919383204, zoom: 13 }
  const TILE = { tx: 2389, ty: 5245, zoom: 13 }
  const GOOGLE = { x: 2389, y: 2946, zoom: 13 }
  const QUADKEY = { quadkey: '0302321010121' }

  const mercator = new GlobalMercator()
  console.log(mercator.LatLonToMeters(LATLNG))
  console.log(mercator.MetersToPixels(METERS))
  console.log(mercator.MetersToLatLon(METERS))
  console.log(mercator.PixelsToTile(PIXELS))
  console.log(mercator.MetersToTile(METERS))
  console.log(mercator.PixelsToMeters(PIXELS))
  console.log(mercator.TileBounds(TILE))
  console.log(mercator.TileLatLonBounds(TILE))
  console.log(mercator.TileQuadKey(TILE))
  console.log(mercator.QuadKeyGoogle(QUADKEY))
  console.log(mercator.QuadKeyTile(QUADKEY))
  console.log(mercator.TileGoogle(TILE))
  console.log(mercator.GoogleTile(GOOGLE))
}*/
