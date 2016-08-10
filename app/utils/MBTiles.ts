import * as Sequelize from 'sequelize'
import { Metadata } from '../models/sequelize'

export interface mbtilesInterface {
  db:string,
  center:[number, number, number]
  bounds:[number, number, number, number]
}

export class MBTiles {
  db:string
  version:string
  attribution:string
  description:string
  center:[number, number]
  bounds:[number, number, number, number]
  sequelize:Sequelize.Sequelize

  /**
   * Creates an instance of MBTiles.
   * 
   * @param {name} String
   */
  constructor(mbtiles:mbtilesInterface) {
    this.db = mbtiles.db
    this.bounds = mbtiles.bounds
    this.center = mbtiles.center
    this.version = '1.1.0'
    this.attribution = 'Map data © OpenStreetMap'
    this.description = 'Tiles from OSM'
  }
  connect() {

  }
    /*
    this.sequelize = new Sequelize(`sqlite://${ name }`)
    const metadata = this.sequelize.define('metadata', Metadata)


    metadata.sync({force:true})
      .then(() => {
        return metadata.create({
          name: 'Denis',
          version: '1.1.0'
        })
      })
    */
}

/* istanbul ignore next */
if (require.main === module) {
  const db = 'tiles.mbtiles'
  const bounds:[number, number, number, number] = [-27, 62, -11, 67.5]
  const center:[number, number, number] = [-18.7, 65, 7]
  const mbtiles = new MBTiles({ db: db, center: center, bounds: bounds})
  console.log(mbtiles)
}