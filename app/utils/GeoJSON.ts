import { omit } from 'lodash'
import Tile, { tileInterface } from './Tile'

export default class GeoJSON {
  name:string = 'GeoJSON'
  type:string = 'Feature'
  geometry:{type:string, coordinates:number[][][]}
  bbox:number[]
  id:string
  properties:any

  constructor(tile:tileInterface) {
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
if (require.main === module) {
  const { GOOGLE } = require('../../test/globals')
  const geojson = new GeoJSON(GOOGLE)
  console.log(geojson)
}
