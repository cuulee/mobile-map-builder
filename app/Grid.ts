import { range, isUndefined } from 'lodash'
import { mercator, LngLatBounds } from './GlobalMercator'
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

export interface InterfaceGridLevel {
  zoom: number
  tile_rows: number[]
  tile_columns: number[]
}

export function buildGridLevels(init: InterfaceGrid) {
  const levels: InterfaceGridLevel[] = []
  for (let zoom of range(init.minZoom, init.maxZoom + 1)) {
    let [x1, y1, x2, y2] = init.bounds
    let t1 = mercator.LatLngToTile({lat: y1, lng: x1, zoom})
    let t2 = mercator.LatLngToTile({lat: y2, lng: x2, zoom})
    let minty = Math.min(t1.ty, t2.ty)
    let maxty = Math.max(t1.ty, t2.ty)
    let mintx = Math.min(t1.tx, t2.tx)
    let maxtx = Math.max(t1.tx, t2.tx)
    const tile_rows = range(minty, maxty + 1)
    const tile_columns = range(mintx, maxtx + 1)
    levels.push({
      zoom,
      tile_rows,
      tile_columns,
    })
  }
  return levels
}

export const countGrid = (init: InterfaceGrid) => {
  let count = 0
  const levels = buildGridLevels(init)
  for (let level of levels) {
    count += level.tile_rows.length * level.tile_columns.length
  }
  return count
}

export function * buildGridBulk(init: InterfaceGrid, bulk = 50) {
  const grid = buildGrid(init)
  let container: InterfaceTileTMS[] = []
  let i = 0
  while (true) {
    i ++
    const { value, done } = grid.next()
    if (value) { container.push(value) }
    if (i % bulk === 0) {
      yield container
      container = []
    }
    if (done) {
      yield container
      break
    }
  }
}

export function * buildGrid(init: InterfaceGrid) {
  debug.grid('started')
  let count  = 0
  const levels = buildGridLevels(init)
  for (let level of levels) {
    for (let tile_row of level.tile_rows) {
      for (let tile_column of level.tile_columns) {
        const id = encodeId({
          scheme: init.scheme,
          tile_column,
          tile_row,
          zoom_level: level.zoom,
        })
        const item: InterfaceTileTMS = {
          scheme: init.scheme,
          tile_column,
          tile_id: id,
          tile_row,
          zoom_level: level.zoom }
        count ++
        yield item
      }
    }
  }
  debug.grid(`done [${ count } tiles]`)
}

export const validateGrid = (init: InterfaceGrid) => {
  if (init.minZoom < 1) {
    const message = 'Grid <minZoom> cannot be less than 1'
    debug.error(message)
    throw new Error(message)
  } else if (init.maxZoom > 23) {
    const message = 'Grid <maxZoom> cannot be greater than 23'
    debug.error(message)
    throw new Error(message)
  } else if (init.minZoom > init.maxZoom) {
    const message = 'Grid <minZoom> cannot be greater than <maxZoom>'
    debug.error(message)
    throw new Error(message)
  } else if (isUndefined(init.bounds)) {
    const message = 'Grid <bounds> is required'
    debug.error(message)
    throw new Error(message)
  } else if (isUndefined(init.minZoom)) {
    const message = 'Grid <minZoom> is required'
    debug.error(message)
    throw new Error(message)
  } else if (isUndefined(init.maxZoom)) {
    const message = 'Grid <maxZoom> is required'
    debug.error(message)
    throw new Error(message)
  } else if (isUndefined(init.scheme)) {
    const message = 'Grid <scheme> is required'
    debug.error(message)
    throw new Error(message)
  }
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
  public count: number
  public bulk: number
  public tiles: IterableIterator<InterfaceTileTMS>
  public tilesBulk: IterableIterator<InterfaceTileTMS[]>

  constructor(init: InterfaceGrid, bulk = 50000) {
    validateGrid(init)
    this.bulk = bulk
    const { bounds } = new LngLatBounds(init.bounds)
    this.bounds = bounds
    this.minZoom = init.minZoom
    this.maxZoom = init.maxZoom
    this.scheme = init.scheme
    this.count = countGrid(this)
    this.tiles = buildGrid(this)
    this.tilesBulk = buildGridBulk(this, bulk)
  }
}

/* istanbul ignore next */
async function main() {
  const OPTIONS = {
    bounds: [-180.0, -90.0, 180, 90],
    maxZoom: 10,
    minZoom: 3,
    scheme: 'http://tile-{switch:a,b,c}.openstreetmap.fr/hot/{zoom}/{x}/{y}.png',
  }
  const grid = new Grid(OPTIONS, 250000)
  debug.log(grid)
  while (true) {
    const { value, done } = grid.tilesBulk.next()
    if (done) { break }
    debug.log(value.length)
  }
}

/* istanbul ignore next */
if (require.main === module) {
  main()
}
