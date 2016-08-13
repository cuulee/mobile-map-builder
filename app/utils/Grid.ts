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
  constructor(init: InterfaceOptions) {
    this.bounds = init.bounds
    this.minZoom = init.minZoom
    this.maxZoom = init.maxZoom
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
    maxZoom: 13,
    minZoom: 1,
  }
  const grid = new Grid(OPTIONS)
  debug.log(grid)
}

/* istanbul ignore next */
if (require.main === module) {
  main()
}
