import { range } from 'lodash'

class LatLng {
  constructor(public lat: number, public lng: number) {
    if (lat < -90 || lat > 90) throw new Error('[lat] must be within -90 <> 90 degrees')
    if (lng < -180 || lng > 180) throw new Error('[lng] must be within -180 <> 180 degrees')
  }
}

class Meters {
  constructor(public x: number, public y: number) {}
}

export default class GlobalMercator {
  public name: string = 'GlobalMercator'
  private initialResolution: number
  private originShift: number

  constructor(public tileSize:number = 256) {
    // Initialize the TMS Global Mercator pyramid
    this.initialResolution = 2 * Math.PI * 6378137 / this.tileSize
    this.originShift = 2 * Math.PI * 6378137 / 2.0
  }

  private Resolution(zoom:number) {
    // Resolution (meters/pixel) for given zoom level (measured at Equator)

    return this.initialResolution / Math.pow(2, zoom)
  }

  /**
   * Converts given lat/lon in WGS84 Datum to XY in Spherical Mercator EPSG:900913
   * @param  {Number} lat
   * @param  {Number} lng
   * @return {Object} Meters
   */
  LatLonToMeters(latlng: { lat: number, lng: number }) {
    const { lat, lng } = latlng
    new LatLng(lat, lng)

    let mx: number = lng * this.originShift / 180.0
    let my: number = Math.log(Math.tan((90 + lat) * Math.PI / 360.0 )) / (Math.PI / 180.0)
    my = my * this.originShift / 180.0

    return new Meters(mx, my)
  }
}

const mercator = new GlobalMercator()
console.log(mercator.LatLonToMeters({ lat: 80, lng: -180 }))
