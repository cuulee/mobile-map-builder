import { range } from 'lodash'
import { mercator, LatLngBounds } from './GlobalMercator'
import debug from './debug'

export interface InterfaceBasicTile {
  scheme: string
  x: number
  y: number
  zoom: number
}

export interface InterfaceOptions {
  bounds: number[]
  minzoom: number
  maxzoom: number
  scheme: string
}

/**
 * Class implementation of Mabpox's MBTile v1.1 specification'
 * 
 * @class Grid
 * @param {Number[x1,y1,x2,y2]} bounds
 * @param {Number} minzoom
 * @param {Number} maxzoom
 * @example
 * const grid = new Grid(OPTIONS)
 */
export default class Grid {
  public bounds: number[]
  public minzoom: number
  public maxzoom: number
  public scheme: string
  public tiles: InterfaceBasicTile[]

  constructor(init: InterfaceOptions) {
    this.bounds = LatLngBounds(init.bounds)
    this.minzoom = init.minzoom
    this.maxzoom = init.maxzoom
    this.scheme = init.scheme
    this.tiles = []
    this.validate()
    this.build()
  }

  public validate() {
    if (this.minzoom < 0) {
      const message = 'Grid <minzoom> cannot be less than 0'
      debug.error(message)
      throw new Error(message)
    }

    if (this.maxzoom > 23) {
      const message = 'Grid <maxzoom> cannot be greater than 23'
      debug.error(message)
      throw new Error(message)
    }

    if (this.minzoom > this.maxzoom) {
      const message = 'Grid <minzoom> cannot be greater than <maxzoom>'
      debug.error(message)
      throw new Error(message)
    }
  }

  public build() {
    debug.grid(`building`)
    range(this.minzoom, this.maxzoom + 1).map(zoom => {
      let [x1, y1, x2, y2] = this.bounds
      let t1 = mercator.LatLngToGoogle({lat: y1, lng: x1, zoom: zoom})
      let t2 = mercator.LatLngToGoogle({lat: y2, lng: x2, zoom: zoom})
      let minty = Math.min(t1.y, t2.y)
      let maxty = Math.max(t1.y, t2.y)
      let mintx = Math.min(t1.x, t2.x)
      let maxtx = Math.max(t1.x, t2.x)

      // this.bounds = [mintx, minty, maxtx, maxty]

      range(minty, maxty + 1).map(y => {
        range(mintx, maxtx + 1).map(x => {
          this.tiles.push({
            scheme: this.scheme,
            x: x,
            y: y,
            zoom: zoom })
        })
      })
    })
    debug.grid(`created [${ this.tiles.length } tiles]`)
  }
}

/* istanbul ignore next */
async function main() {
  const OPTIONS = {
    bounds: [
      -75.9375,
      45.33670190996811,
      -75.5859375,
      45.58328975600631,
    ],
    maxzoom: 10,
    minzoom: 0,
    scheme: 'http://tile-{switch:a,b,c}.openstreetmap.fr/hot/{zoom}/{x}/{y}.png',
  }
  const grid = new Grid(OPTIONS)
  debug.log(grid.bounds)
  debug.log(grid.tiles.length)
}

/* istanbul ignore next */
if (require.main === module) {
  main()
}
