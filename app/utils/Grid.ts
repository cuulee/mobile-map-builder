import { range } from 'lodash'
import { mercator, LatLngBounds } from './GlobalMercator'
import debug from './debug'

export interface InterfaceOptions {
  bounds: number[]
  minZoom: number
  maxZoom: number
}

/**
 * Class implementation of Mabpox's MBTile v1.1 specification'
 * 
 * @class Grid
 * @param {Number[x1,y1,x2,y2]} bounds
 * @param {Number} minZoom
 * @param {Number} maxZoom
 * @example
 * const grid = new Grid(OPTIONS)
 */
export default class Grid {
  public bounds: number[]
  public minZoom: number
  public maxZoom: number
  public tiles: {}[]

  constructor(init: InterfaceOptions) {
    this.bounds = LatLngBounds(init.bounds)
    this.minZoom = init.minZoom
    this.maxZoom = init.maxZoom
    this.tiles = []
    this.validate()
    this.build()
  }

  public validate() {
    if (this.minZoom < 0) {
      const message = 'Grid <minZoom> cannot be less than 0'
      debug.error(message)
      throw new Error(message)
    }

    if (this.maxZoom > 23) {
      const message = 'Grid <maxZoom> cannot be greater than 23'
      debug.error(message)
      throw new Error(message)
    }

    if (this.minZoom > this.maxZoom) {
      const message = 'Grid <minZoom> cannot be greater than <maxZoom>'
      debug.error(message)
      throw new Error(message)
    }
  }

  public build() {
    range(this.minZoom, this.maxZoom + 1).map(zoom => {
      const [x1, y1, x2, y2] = this.bounds
      const t1 = mercator.LatLngToGoogle({lat: y1, lng: x1, zoom: zoom})
      const t2 = mercator.LatLngToGoogle({lat: y2, lng: x2, zoom: zoom})
      const minty = Math.min(t1.y, t2.y)
      const maxty = Math.max(t1.y, t2.y)
      const mintx = Math.min(t1.x, t2.x)
      const maxtx = Math.max(t1.x, t2.x)
      range(minty, maxty + 1).map(y => {
        range(mintx, maxtx + 1).map(x => {
          this.tiles.push({x: x, y: y, zoom: zoom })
        })
      })
    })
  }
}

/* istanbul ignore next */
async function main() {
  const OPTIONS = {
    bounds: [
      -76.72851562499999,
      45.644768217751924,
      -75.58593749999999,
      46.437856895024204,
    ],
    maxZoom: 0,
    minZoom: 0,
  }
  const grid = new Grid(OPTIONS)
  debug.log(grid.tiles)
}

/* istanbul ignore next */
if (require.main === module) {
  main()
}
