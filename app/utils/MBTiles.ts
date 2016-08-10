import * as Sequelize from 'sequelize'
import { Metadata } from '../models/sequelize'

export class MBTiles {
  db:any
  constructor(name:string='data.mbtiles') {
    this.db = new Sequelize(`sqlite://${ name }`)
    this.db.define('Metadata', Metadata)
  }
}

/* istanbul ignore next */
if (require.main === module) {
  const mbtiles = new MBTiles('tiles.mbtiles')
  //console.log(mbtiles.db)
}