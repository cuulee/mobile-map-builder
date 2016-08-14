import debug from './debug'
import models from '../models'
import * as filesize from 'filesize'
import { range } from 'lodash'
import * as Sequelize from 'sequelize'
import Tile, { InterfaceTile } from './Tile'

interface InterferfaceSequelizeModel extends Sequelize.Model<{}, {}> {
  init?: any
}

/**
 * Metadata Interface for MBTiles.metadata
 */
export interface InterfaceMetadata {
  name: string
  bounds: number[]
  type: string
  description: string
  format: string
  minzoom?: number
  maxzoom?: number
  author?: string
  attribution?: string
  center?: number[]
  scheme?: string
}

/**
 * Map Interface for MBTiles SQL Model
 */
export interface InterfaceMapSQL {
  zoom_level?: number
  tile_row?: number
  tile_column?: number
  tile_id?: string
}

/**
 * Images Interface for MBTiles SQL Model
 */
export interface InterfaceImagesSQL {
  tile_data?: Buffer
  tile_id?: string
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
export const parseCenter = (center: number[]): string => {
  if (center.length < 2 || center.length > 3) { throw new Error('[center] must contain at 2 or 3 numbers')}
  const [x, y] = center
  if (y < -90 || y > 90) {throw new Error('[y] must be within -90 to 90 degrees')}
  if (x < -180 || x > 180) { throw new Error('[x] must be within -180 to 180 degrees')}
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
export const parseBounds = (bounds: number[]) => {
  if (bounds.length !== 4) { throw new Error('[bounds] must have 4 numbers')}
  const [x1, y1, x2, y2] = bounds
  parseCenter([x1, y1])
  parseCenter([x2, y2])
  return bounds.join(',')
}

/**
 * Gets File size in Unix mode
 *
 * @name getFileSize
 * @param {Buffer} data
 * @return {String}
 * @example
 * const size = getFileSize(<buffer>)
 * //= '12.6K'
 */
export const getFileSize = (data: Buffer) => {
  return filesize(data.length, { unix: true })
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
  public attribution: string
  public author: string
  public bounds: number[]
  public center: number[]
  public description: string
  public db: string
  public name: string
  public minzoom: number
  public maxzoom: number
  public version: string
  public scheme: string
  public format: string
  public type: string
  private mapSQL: InterferfaceSequelizeModel
  private imagesSQL: InterferfaceSequelizeModel

  /**
   * Creates an instance of MBTiles.
   * 
   * @param {String} db
   * @example
   * const mbtiles = new MBTiles('tiles.mbtiles')
   */
  constructor(db: string = 'tiles.mbtiles') {
    this.db = db
    this.name = 'OpenStreetMap'
    this.version = '1.1.0'
    this.type = 'baselayer'
    this.attribution = 'Map data © OpenStreetMap'
    this.description = 'Tiles from OSM'
  }

  /**
   * Builds Indexes for MBTiles SQL db
   * 
   * @name index
   * @returns {Object} Status message
   * @example
   */
  public async index() {
    // Connect SQL
    debug.index('building')
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

    debug.index('created')
    return { message: 'Indexes created', ok: true, status: 'OK' }
  }

  /**
   * Connect to MBTiles SQL db
   * 
   * @name connect
   * @returns {Object} Sequelize connection Class
   * @example
   */
  public connect() {
    const options = {
      define: { freezeTableName: true, timestamps: false },
      logging: false,
      pool: { idle: 10000, max: 5, min: 0 },
    }
    return new Sequelize(`sqlite://${ this.db }`, options)
  }

  /**
   * Builds metadata to MBTile database
   * 
   * @name metadata
   * @param {Number[x,y]} center (Required)
   * @param {Number[x1,y1,x2,y2]} bounds (Required)
   * @param {Number} minzoom (Required)
   * @param {Number} maxzoom (Required)
   * @param {String} name (Required)
   * @param {String} type (Required)
   * @param {String} format (Required)
   * @param {String} attribution (Optional)
   * @param {String} description (Optional)
   * @param {String} author (Optional)
   * @param {String} scheme (Optional)
   * @returns {Object} Status message
   * @example
   * mbtiles.metadata({
   *   name: 'OpenStreetMap',
   *   format: 'png',
   *   type: 'baselayer',
   *   attribution: 'Map data © OpenStreetMap',
   *   description: 'Tiles from OSM',
   *   scheme: 'http://tile-{switch:a,b,c}.openstreetmap.fr/hot/{zoom}/{x}/{y}.png',
   *   center: [-18.7, 65, 7],
   *   bounds: [-27, 62, -11, 67.5],
   *   minzoom: 1,
   *   maxzoom: 18
   * }).then(status => console.log(status))
   */
  public async metadata(init: InterfaceMetadata) {
    // Connect SQL
    debug.metadata('building')
    const sequelize = this.connect()
    const metadataSQL = await sequelize.define('metadata', models.Metadata)
    await metadataSQL.sync({ force: true })

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
    this.type = init.type ? init.type : this.type

    // Metadata required key/values
    /* istanbul ignore next */
    if (!this.name) {
      const message = 'metadata <mbtiles.name> is required'
      debug.error(message)
      throw new Error(message)
    /* istanbul ignore next */
    } else if (!this.type) {
      const message = 'metadata <mbtiles.type> is required'
      debug.error(message)
      throw new Error(message)
    /* istanbul ignore next */
    } else if (!this.version) {
      const message = 'metadata <mbtiles.version> is required'
      debug.error(message)
      throw new Error(message)
    /* istanbul ignore next */
    } else if (!this.description) {
      const message = 'metadata <mbtiles.description> is required'
      debug.error(message)
      throw new Error(message)
    /* istanbul ignore next */
    } else if (!this.format) {
      const message = 'metadata <mbtiles.format> is required'
      debug.error(message)
      throw new Error(message)
    /* istanbul ignore next */
    } else if (!this.bounds) {
      const message = 'metadata <mbtiles.bounds> is required'
      debug.error(message)
      throw new Error(message) }

    // Metadata Validation
    if (!['overlay', 'baselayer'].find(item => item === this.type)) {
      const message = 'metadata <mbtiles.type> must be [overlay or baselayer]'
      debug.error(message)
      throw new Error(message)
    }  else if (!['png', 'jpg'].find(item => item === this.format)) {
      const message = 'metadata <mbtiles.format> must be [png or jpg]'
      debug.error(message)
      throw new Error(message)}

    // Save Metadata to SQL
    await metadataSQL.create({ name: 'name', value: this.name })
    await metadataSQL.create({ name: 'version', value: this.version })
    await metadataSQL.create({ name: 'attribution', value: this.attribution })
    await metadataSQL.create({ name: 'description', value: this.description })
    await metadataSQL.create({ name: 'bounds', value: parseBounds(this.bounds) })
    await metadataSQL.create({ name: 'center', value: parseCenter(this.center) })
    await metadataSQL.create({ name: 'minzoom', value: String(this.minzoom) })
    await metadataSQL.create({ name: 'maxzoom', value: String(this.maxzoom) })
    if (this.format) { await metadataSQL.create({ name: 'format', value: this.format }) }
    if (this.author) { await metadataSQL.create({ name: 'author', value: this.author }) }
    if (this.scheme) { await metadataSQL.create({ name: 'scheme', value: this.scheme }) }

    debug.metadata('created')
    return { message: 'Metadata created', ok: true, status: 'OK' }
  }

  /**
   * Saves map tile data to MBTile database
   * 
   * @name map
   * @returns {Object} Tile Class
   * @example
   */
  public async map(init: InterfaceTile) {
    // Connect SQL
    if (!this.mapSQL) {
      const sequelize = this.connect()
      this.mapSQL = sequelize.define('map', models.Map)
      await this.mapSQL.sync()
    }

    // Build tile
    const tile = new Tile(init)

    // Retrieve existing ID if exists
    const findOne: InterfaceMapSQL = await this.mapSQL.findOne({
      where: {
        tile_column: tile.tileColumn,
        tile_row: tile.tileRow,
        zoom_level: tile.zoom,
      },
    })

    // Append existing Tile with new ID
    if (findOne) {
      tile.id = findOne.tile_id
    } else {
      // Add Tile to MBTiles SQL db
      // Not async/await since <tile_id> is alredy in Tile Class
      this.mapSQL.create({
        tile_column: tile.tileColumn,
        tile_id: tile.id,
        tile_row: tile.tileRow,
        zoom_level: tile.zoom,
      })
    }
    return tile
  }

  /**
   * Download and saves tile buffer to MBTiles SQL db
   * 
   * @name download
   * @returns {Object} Tile Class
   * @example
   */
  public async download(tile: Tile) {
    // Connect SQL
    if (!this.imagesSQL) {
      const sequelize = this.connect()
      this.imagesSQL = sequelize.define('images', models.Images)
      await this.imagesSQL.sync()
    }

    // Retrieve existing ID if exists
    const findOne: InterfaceImagesSQL = await this.imagesSQL.findOne({
      where: {
        tile_id: tile.id,
      },
    })

    // Skip download if tile exist in <images.tile_data>
    if (findOne) {
      debug.skipped(`${ tile.id } (${ getFileSize(findOne.tile_data) })`)
    } else {
      // Download Tile from default settings
      const data = await tile.download()
      debug.download(`${ tile.url } (${ getFileSize(data) })`)
      // Save Tile to SQL
      await this.imagesSQL.create({
        tile_data: data,
        tile_id: tile.id,
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
  public async save(init: InterfaceTile) {
    const tile = await this.map(init)
    await this.download(tile)
    return { id: tile.id, message: 'Tile saved', ok: true, status: 'OK' }
  }
}

/* istanbul ignore next */
async function main() {
  // Initialize
  const mbtiles = new MBTiles('tiles.mbtiles')

  // Save Metadata
  const SCHEME = 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{zoom}/{y}/{x}'
  // const SCHEME = 'https://tile-{switch:a,b,c}.openstreetmap.fr/hot/{zoom}/{x}/{y}.png'
  // const SCHEME = 'https://maps.wikimedia.org/osm-intl/{zoom}/{x}/{y}.png'
  const METADATA = {
    attribution: 'Map data © OpenStreetMap',
    bounds: [
      -76.72851562499999,
      45.644768217751924,
      -75.58593749999999,
      46.437856895024204,
    ],
    center: [-75.975252, 46.379730],
    description: 'Tiles from OSM',
    format: 'png',
    maxzoom: 13,
    minzoom: 13,
    name: 'OpenStreetMap',
    scheme: SCHEME,
    type: 'baselayer',
  }
  await mbtiles.metadata(METADATA)
  await mbtiles.index()

  // Save Multiple Tiles
  range(2350, 2375).map(x => {
    range(2900, 2925).map(y => {
      const TILE = {
        scheme: SCHEME,
        x: x,
        y: y,
        zoom: 13,
      }
      mbtiles.save(TILE)
    })
  })
  // Save single Tile
  // const TILE = {
  //   scheme: SCHEME,
  //   x: 56,
  //   y: 34,
  //   zoom: 7,
  // }
  // await mbtiles.save(TILE)
}

/* istanbul ignore next */
if (require.main === module) {
  main()
}
