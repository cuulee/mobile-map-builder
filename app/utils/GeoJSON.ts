import { omit } from 'lodash'
import Tile, { tileInterface } from './Tile'

export default class GeoJSON {
  public name:string = 'GeoJSON'
  public type:string = 'Feature'
  public geometry:any
  public bounds:any
  public id:string
  public properties:{}

  constructor(tile:tileInterface) {
    tile = new Tile(tile)

    this.type = 'Feature'
    //this.geometry = tile.geometry
    //this.bounds = tile.bounds
    this.id = tile.id
    this.properties = omit(tile, ['bounds', 'geometry', 'id'])
  }
}

if (require.main === module) {
  /* istanbul ignore next */
  const { GOOGLE } = require('../../test/globals')
  /* istanbul ignore next */
  const geojson = new GeoJSON(GOOGLE)
  /* istanbul ignore next */
  console.log(geojson)
}
