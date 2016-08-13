import * as Sequelize from 'sequelize'
import { INTEGER, STRING } from 'sequelize'
import { range } from 'lodash'
import models from '../models'
import Tile, { tileInterface } from './Tile'

interface SequelizeModel extends Sequelize.Model<{}, {}> {
  
}

/**
 * Metadata Interface for MBTiles.metadata
 */
export interface metadataInterface {
  center:number[]
  bounds:number[]
  minzoom:number
  maxzoom:number
  name?:string
  format?:string
  attribution?:string
  description?:string
  scheme?:string
  author?:string
}

/**
 * Map Interface for MBTiles SQL Model
 */
export interface mapSQLInterface {
  zoom_level?:number
  tile_row?:number
  tile_column?:number
  tile_id?:string
}

/**
 * Images Interface for MBTiles SQL Model
 */
export interface imagesSQLInterface {
  tile_data?:any
  tile_id?:string
}

/**
 * Converts & validates bounds coordinates [x1,y1,x2,y2] into proper SQL string
 *
 * @name parseBounds
 * @param {List} center - [x,y] coordinates
 * @return {String}
 * @example
 * const bounds = parseBounds([45.12, -75.34, 46.56, -74.78])
 * //= '45.12,-75.34,46.56,-74.78'
 */
export const parseCenter = (center:number[]):string => {
  if (center.length < 2 || center.length > 3) { throw new Error('[center] must contain at 2 or 3 numbers')}
  const [x, y] = center
  if (y < -90 || y > 90) { throw new Error('[y] must be within -90 to 90 degrees')}
  else if (x < -180 || x > 180) { throw new Error('[x] must be within -180 to 180 degrees')}
  return center.join(',')
}

/**
 * Converts & validates center coordinates [x,y] into proper SQL string
 *
 * @name parseCenter
 * @param {List} bounds - [x1,y1,x2,y2] coordinates
 * @return {String}
 * @example
 * const center = parseBounds([45.12, -75.34])
 * //= '45.12,-75.34'
 */
export const parseBounds = (bounds:number[]) => {
  if (bounds.length != 4) { throw new Error('[bounds] must have 4 numbers')}
  const [x1, y1, x2, y2] = bounds
  parseCenter([x1, y1])
  parseCenter([x2, y2])
  return bounds.join(',')
}

/**
 * Class implementation of Mabpox's MBTile v1.1 specification'
 * 
 * @class MBTiles
 * @param {String} db
 * @example
 * const mbtiles = new MBTiles('tiles.mbtiles')
 */
export default class MBTiles {
  db:string
  name:string
  author:string
  minzoom:number
  maxzoom:number
  version:string
  attribution:string
  description:string
  scheme:string
  format:string
  center:number[]
  bounds:number[]
  sequelize:Sequelize.Sequelize
  mapSQL:SequelizeModel
  imagesSQL:SequelizeModel
  metadataSQL:SequelizeModel

  /**
   * Creates an instance of MBTiles.
   * 
   * @param {String} db
   * @example
   * const mbtiles = new MBTiles('tiles.mbtiles')
   */
  constructor(db:string) {
    this.db = db
    this.name = 'OpenStreetMap'
    this.version = '1.0.0'
    this.attribution = 'Map data © OpenStreetMap'
    this.description = 'Tiles from OSM'
  }

  /**
   * Creates Indexes for MBTiles SQL db
   * 
   * @name index
   * @returns {Object} Status message
   * @example
   */
  async index() {
    const sequelize = this.connect()

    // Build tables
    const metadataSQL = await sequelize.define('metadata', models.Metadata)
    const mapSQL = await sequelize.define('map', models.Map)
    const imagesSQL = await sequelize.define('images', models.Images)
    await metadataSQL.sync()
    await mapSQL.sync()
    await imagesSQL.sync()

    // Build Index
    await sequelize.query('CREATE UNIQUE INDEX IF NOT EXISTS metadata_name on metadata (name)')
    await sequelize.query('CREATE UNIQUE INDEX IF NOT EXISTS map_tile_id on map (tile_id)')
    await sequelize.query('CREATE UNIQUE INDEX IF NOT EXISTS map_tile on map (tile_row, tile_column, zoom_level)')
    await sequelize.query('CREATE UNIQUE INDEX IF NOT EXISTS images_tile_id on images (tile_id)')
    
    // Build View
    await sequelize.query(`CREATE VIEW IF NOT EXISTS tiles AS
  SELECT
    map.zoom_level AS zoom_level,
    map.tile_column AS tile_column,
    map.tile_row AS tile_row,
    images.tile_data AS tile_data
  FROM map
  JOIN images ON images.tile_id = map.tile_id`)

    return { ok: true, status: 'OK', message: 'Indexes created' }
  }

  /**
   * Connect to MBTiles SQL db
   * 
   * @name connect
   * @returns {Object} Sequelize connection Class
   * @example
   */
  connect() {
    const options = {
      define: { timestamps: false, freezeTableName: true },
      pool: { max: 5, min: 0, idle: 10000 }
    }
    return new Sequelize(`sqlite://${ this.db }`, options)
  }

  /**
   * Generates metadata to MBTile database
   * 
   * @name metadata
   * @param {Number[x,y]} center (Required)
   * @param {Number[x1,y1,x2,y2]} bounds (Required)
   * @param {Number} minzoom (Required)
   * @param {Number} maxzoom (Required)
   * @param {String} name (Optional)
   * @param {String} attribution (Optional)
   * @param {String} description (Optional)
   * @param {String} author (Optional)
   * @param {String} scheme (Optional)
   * @returns {Object} Status message
   * @example
   * mbtiles.metadata({
   *   name: 'OpenStreetMap',
   *   attribution: 'Map data © OpenStreetMap',
   *   description: 'Tiles from OSM',
   *   scheme: 'http://tile-{switch:a,b,c}.openstreetmap.fr/hot/{zoom}/{x}/{y}.png',
   *   center: [-18.7, 65, 7],
   *   bounds: [-27, 62, -11, 67.5],
   *   minzoom: 1,
   *   maxzoom: 18
   * }).then(status => console.log(status))
   */
  async metadata(init:metadataInterface) {
    // Connect SQL
    if (!this.metadataSQL) {
      const sequelize = this.connect()
      this.metadataSQL = await sequelize.define('metadata', models.Metadata)
      await this.metadataSQL.sync({ force: true })
    }

    // Define Metadata attributes
    this.name = init.name ? init.name : this.name
    this.bounds = init.bounds ? init.bounds : this.bounds
    this.center = init.center ? init.center : this.center
    this.minzoom = init.minzoom ? init.minzoom : this.minzoom
    this.maxzoom = init.maxzoom ? init.maxzoom : this.maxzoom
    this.scheme = init.scheme ? init.scheme : this.scheme
    this.format = init.format ? init.format : this.format
    this.attribution = init.attribution ? init.attribution : this.attribution
    this.description = init.description ? init.description : this.description
    
    // Save Metadata to SQL
    await this.metadataSQL.create({ name: 'name', value: this.name })
    await this.metadataSQL.create({ name: 'version', value: this.version })
    await this.metadataSQL.create({ name: 'attribution', value: this.attribution })
    await this.metadataSQL.create({ name: 'description', value: this.description })
    await this.metadataSQL.create({ name: 'bounds', value: parseBounds(this.bounds) })
    await this.metadataSQL.create({ name: 'center', value: parseCenter(this.center) })
    await this.metadataSQL.create({ name: 'minzoom', value: String(this.minzoom) })
    await this.metadataSQL.create({ name: 'maxzoom', value: String(this.maxzoom) })
    await this.metadataSQL.create({ name: 'format', value: this.format })
    if (this.author) await this.metadataSQL.create({ name: 'author', value: this.author })
    if (this.scheme) await this.metadataSQL.create({ name: 'scheme', value: this.scheme })

    return { ok: true, status: 'OK', message: 'Metadata updated' }
  }

  /**
   * Saves map tile data to MBTile database
   * 
   * @name map
   * @returns {Object} Tile Class
   * @example
   */
  async map(init:tileInterface) {
    // Connect SQL
    if (!this.mapSQL) {
      const sequelize = this.connect()
      this.mapSQL = sequelize.define('map', models.Map)
      await this.mapSQL.sync()
    }

    // Build tile
    const tile = new Tile(init)

    // Retrieve existing ID if exists
    const findOne:mapSQLInterface = await this.mapSQL.findOne({
      where: {
        zoom_level: tile.zoom,
        tile_column: tile.tile_column,
        tile_row: tile.tile_row
      }
    })
    // Append existing Tile with new ID
    if (findOne) tile.id = findOne.tile_id
    
    // Add Tile to MBTiles SQL db
    // Not async/await since <tile_id> is alredy in Tile Class
    else this.mapSQL.create({
      zoom_level: tile.zoom,
      tile_id: tile.id,
      tile_row: tile.tile_row,
      tile_column: tile.tile_column
    })
    return tile
  }

  /**
   * Download and saves tile buffer to MBTiles SQL db
   * 
   * @name download
   * @returns {Object} Tile Class
   * @example
   */
  async download(tile:Tile) {
    // Connect SQL
    if (!this.imagesSQL) {
      const sequelize = this.connect()
      this.imagesSQL = sequelize.define('images', models.Images)
      await this.imagesSQL.sync()
    }
  
    // Retrieve existing ID if exists
    const findOne:imagesSQLInterface = await this.imagesSQL.findOne({
      where: {
        tile_id: tile.id
      }
    })

    if (findOne) { console.log(`Skipped Download: ${ tile.id }`) }
    else {
      // Download Tile from default settings
      const data = await tile.download()
      console.log(data)
      // Save Tile to SQL
      await this.imagesSQL.create({
        tile_id: tile.id,
        tile_data: data
      })
    }
    return tile
  }

  /**
   * Saves tile to MBTile SQL db
   * 
   * @name save
   * @returns {Object} Status message
   * @example
   */
  async save(init:tileInterface) {
    const tile = await this.map(init)
    await this.download(tile)
    return { ok: true, status: 'OK', message: 'Tile saved', id: tile.id }
  }
}

/* istanbul ignore next */
async function main() {
  // Initialize
  const mbtiles = new MBTiles('tiles.mbtiles')
  
  // Save Metadata
  //const SCHEME = 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{zoom}/{y}/{x}'
  const SCHEME = 'https://tile-{switch:a,b,c}.openstreetmap.fr/hot/{zoom}/{x}/{y}.png'
  //const SCHEME = 'https://maps.wikimedia.org/osm-intl/{zoom}/{x}/{y}.png'
  const METADATA = {
    name: 'OpenStreetMap',
    attribution: 'Map data © OpenStreetMap',
    description: 'Tiles from OSM',
    scheme: SCHEME,
    center: [-75.975252,46.379730],
    bounds: [
     -76.72851562499999,
    45.644768217751924,
    -75.58593749999999,
    46.437856895024204],
    minzoom: 13,
    maxzoom: 13
  }
  mbtiles.metadata(METADATA)
    .then(status => console.log(status))

  // Save Multiple Tiles
  range(2350, 2375).map(x => {
    range(2900, 2925).map(y => {
      const TILE = {
        x: x,
        y: y,
        zoom: 13,
        scheme: SCHEME
      }
      mbtiles.save(TILE)
    })
  })
  // Save single Tile
  /*
  const TILE = {
    x: 56,
    y: 34,
    zoom: 7,
    scheme: SCHEME
  }
  mbtiles.save(TILE)
  */

  // Build indexes
  mbtiles.index()
}

/* istanbul ignore next */
if (require.main === module) {
  main()
}