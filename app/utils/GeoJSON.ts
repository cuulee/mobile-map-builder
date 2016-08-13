import debug from './debug'
import { omit } from 'lodash'
import Tile, { InterfaceTile } from './Tile'

export default class GeoJSON {
  public name: string = 'GeoJSON'
  public type: string = 'Feature'
  public geometry: {type: string, coordinates: number[][][]}
  public bbox: number[]
  public id: string
  public properties: any

  constructor(tile: InterfaceTile) {
    tile = new Tile(tile)

    this.properties = '12'
    this.type = 'Feature'
    this.geometry = tile.geometry
    this.bbox = tile.bbox
    this.id = tile.id
    this.properties = omit(tile, ['bbox', 'geometry', 'id'])
  }
}

/* istanbul ignore next */
async function main() {
  const { GOOGLE } = require('../../test/globals')
  const geojson = new GeoJSON(GOOGLE)
  debug.log(geojson)
}

/* istanbul ignore next */
if (require.main === module) {
  main()
}
