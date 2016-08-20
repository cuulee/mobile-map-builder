import { range } from 'lodash'
import { mercator, LatLngBounds } from './GlobalMercator'
import debug from './debug'
import { encodeId, InterfaceTileTMS } from './Tile'

export interface InterfaceGrid {
  bounds: number[]
  minZoom: number
  maxZoom: number
  scheme: string
}

export interface InterfaceGridOptional {
  bounds?: number[]
  minZoom?: number
  maxZoom?: number
  scheme?: string
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
  public scheme: string
  public tiles: InterfaceTileTMS[]

  constructor(init: InterfaceGrid) {
    this.bounds = LatLngBounds(init.bounds)
    this.minZoom = init.minZoom
    this.maxZoom = init.maxZoom
    this.scheme = init.scheme
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
    debug.grid(`building`)
    range(this.minZoom, this.maxZoom + 1).map(zoom => {
      let [x1, y1, x2, y2] = this.bounds
      let t1 = mercator.LatLngToTile({lat: y1, lng: x1, zoom: zoom})
      let t2 = mercator.LatLngToTile({lat: y2, lng: x2, zoom: zoom})
      let minty = Math.min(t1.ty, t2.ty)
      let maxty = Math.max(t1.ty, t2.ty)
      let mintx = Math.min(t1.tx, t2.tx)
      let maxtx = Math.max(t1.tx, t2.tx)

      range(minty, maxty + 1).map(tile_row => {
        range(mintx, maxtx + 1).map(tile_column => {
          const id = encodeId({
            scheme: this.scheme,
            tile_column: tile_column,
            tile_row: tile_row,
            zoom_level: zoom,
          })
          this.tiles.push({
            scheme: this.scheme,
            tile_column: tile_column,
            tile_id: id,
            tile_row: tile_row,
            zoom_level: zoom })
        })
      })
    })
    debug.grid(`created [${ this.tiles.length } tiles]`)
  }
}

/* istanbul ignore next */
async function main() {
  const OPTIONS = {
    bounds: [-66.633234, 45.446628, -66.052350, 45.891202],
    maxZoom: 4,
    minZoom: 4,
    scheme: 'http://tile-{switch:a,b,c}.openstreetmap.fr/hot/{zoom}/{x}/{y}.png',
  }
  const grid = new Grid(OPTIONS)
  debug.log(grid.bounds)
  debug.log(grid.tiles.length)
  debug.log(grid.tiles[0])
}

/* istanbul ignore next */
if (require.main === module) {
  main()
}
