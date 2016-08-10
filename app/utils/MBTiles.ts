import * as Sequelize from 'sequelize'
import { Metadata } from '../models/sequelize'

const config = {
  storage: 'tiles.mbtiles'
}

export class MBTiles {
  name:string
  bounds:string
  constructor(name:string='data.mbtiles') {
    this.name = name
    const sequelize = new Sequelize(`sqlite://${ name }`, config)
    const metadata = sequelize.define('metadata', {name : Sequelize.STRING})
    metadata.sync()
      .then(() => {
        return metadata.create({
          name: 'Fred'
        })
      })
  }
}

/* istanbul ignore next */
if (require.main === module) {
  const mbtiles = new MBTiles('tiles.mbtiles')
  console.log(mbtiles)
  //console.log(mbtiles.db)
}