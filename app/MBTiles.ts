import debug from './debug'
import models from './models'
import * as filesize from 'filesize'
import * as Sequelize from 'sequelize'
import * as ProgressBar from 'progress'
import { LngLatBounds, LngLat } from './GlobalMercator'
import Tile, { downloadTile } from './Tile'
import Grid from './Grid'
import { InterfaceMapAttribute, InterfaceMapInstance, InterfaceMapModel } from './models/Map'
import { InterfaceMetadataAttribute, InterfaceMetadataInstance, InterfaceMetadataModel } from './models/Metadata'
import { InterfaceImagesAttribute, InterfaceImagesInstance, InterfaceImagesModel } from './models/Images'

/**
 * Metadata Interface for MBTiles.metadata
 */
export interface InterfaceMetadata {
  name: string
  bounds: number[]
  type: string
  description: string
  format: string
  minZoom: number
  maxZoom: number
  attribution: string
  center: number[]
  scheme: string
}

/**
 * Images Interface for MBTiles SQL Model
 */
export interface InterfaceImagesSQL {
  tile_data?: Buffer
  tile_id?: string
}

/**
 * Converts & validates center coordinates [x,y] into proper SQL string
 *
 * @name stringifyCenter
 * @param {List} center - [x,y] coordinates
 * @return {String}
 * @example
 * @example
 * const center = stringifyCenter([45.12, -75.34])
 * //= '45.12,-75.34'
 */
export const stringifyCenter = (init: number[]): string => {
  if (init.length < 2 || init.length > 4) {
    const message = '[center] must be an Array of 2 or 3 numbers'
    debug.error(message)
    throw new Error(message)
  }
  const [lng, lat, z] = init
  const { xyz } = new LngLat({lat, lng, z})
  return xyz.join(',')
}

/**
 * Converts & validates bounds coordinates [x1,y1,x2,y2] into proper SQL string
 *
 * @name stringifyBounds
 * @param {List} bounds - [x1,y1,x2,y2] coordinates
 * @return {String} bounds
 * @example
 * const bounds = stringifyBounds([45.12, -75.34, 46.56, -74.78])
 * //= '45.12,-75.34,46.56,-74.78'
 */
export const stringifyBounds = (init: number[]) => {
  const { bounds } = new LngLatBounds(init)
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
  public minZoom: number
  public maxZoom: number
  public version: string
  public scheme: string
  public format: string
  public type: string
  private mapSQL: InterfaceMapModel
  private imagesSQL: InterfaceImagesModel
  private metadataSQL: InterfaceMetadataModel

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
    this.format = 'png'
    this.attribution = 'Map data © OpenStreetMap'
    this.description = 'Tiles from OSM'

    // Create SQL connections
    const sequelize = this.connect()
    this.mapSQL = sequelize.define<InterfaceMapInstance, InterfaceMapAttribute>('map', models.Map)
    this.imagesSQL = sequelize.define<InterfaceImagesInstance, InterfaceImagesAttribute>('images', models.Images)
    this.metadataSQL = sequelize.define<InterfaceMetadataInstance, InterfaceMetadataAttribute>('metadata', models.Metadata)
  }

  /**
   * Builds Indexes for MBTiles SQL db
   * 
   * @name index
   * @returns {Object} Status message
   * @example
   */
  public async index(init: InterfaceMetadata) {
    // Connect SQL
    debug.index('started')
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

    debug.index('done')
    return { message: 'Indexes created', ok: true, status: 'OK', status_code: 200 }
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
   * @param {Number} minZoom (Required)
   * @param {Number} maxZoom (Required)
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
   *   minZoom: 1,
   *   maxZoom: 18
   * }).then(status => console.log(status))
   */
  public async metadata(init?: InterfaceMetadata) {
    debug.metadata('started')

    // Define Metadata attributes
    if (init) {
      this.name = init.name ? init.name : this.name
      this.bounds = init.bounds ? init.bounds : this.bounds
      this.center = init.center ? init.center : this.center
      this.minZoom = init.minZoom ? init.minZoom : this.minZoom
      this.maxZoom = init.maxZoom ? init.maxZoom : this.maxZoom
      this.scheme = init.scheme ? init.scheme : this.scheme
      this.format = init.format ? init.format : this.format
      this.attribution = init.attribution ? init.attribution : this.attribution
      this.description = init.description ? init.description : this.description
      this.type = init.type ? init.type : this.type
    }

    // Metadata required key/values
    /* istanbul ignore next */
    if (!this.name) {
      const message = 'MBTiles.metadata <name> is required'
      debug.error(message)
      throw new Error(message)
    /* istanbul ignore next */
    } else if (!this.type) {
      const message = 'MBTiles.metadata <type> is required'
      debug.error(message)
      throw new Error(message)
    /* istanbul ignore next */
    } else if (!this.version) {
      const message = 'MBTiles.metadata <version> is required'
      debug.error(message)
      throw new Error(message)
    /* istanbul ignore next */
    } else if (!this.description) {
      const message = 'MBTiles.metadata <description> is required'
      debug.error(message)
      throw new Error(message)
    /* istanbul ignore next */
    } else if (!this.format) {
      const message = 'MBTiles.metadata <format> is required'
      debug.error(message)
      throw new Error(message)
    /* istanbul ignore next */
    } else if (!this.bounds) {
      const message = 'MBTiles.metadata <bounds> is required'
      debug.error(message)
      throw new Error(message)
    }

    // Metadata Validation
    if (!['overlay', 'baselayer'].find(item => item === this.type)) {
      const message = 'MBTiles.metadata <type> must be [overlay or baselayer]'
      debug.error(message)
      throw new Error(message)
    }  else if (!['png', 'jpg'].find(item => item === this.format)) {
      const message = 'MBTiles.metadata <format> must be [png or jpg]'
      debug.error(message)
      throw new Error(message)
    }

    // Connect SQL
    const sequelize = this.connect()
    const metadataSQL = await sequelize.define('metadata', models.Metadata)
    await metadataSQL.sync({ force: true })

    // Save Metadata to SQL
    const saveItems = [
      { name: 'name', value: this.name },
      { name: 'version', value: this.version },
      { name: 'attribution', value: this.attribution },
      { name: 'description', value: this.description },
      { name: 'bounds', value: stringifyBounds(this.bounds) },
      { name: 'center', value: stringifyCenter(this.center) },
      { name: 'minZoom', value: String(this.minZoom) },
      { name: 'maxZoom', value: String(this.maxZoom) },
    ]
    if (this.format) { saveItems.push({ name: 'format', value: this.format }) }
    if (this.author) { saveItems.push({ name: 'author', value: this.author }) }
    if (this.scheme) { saveItems.push({ name: 'scheme', value: this.scheme }) }

    metadataSQL.bulkCreate(saveItems)
    debug.metadata('done')
    return { message: 'Metadata created', ok: true, status: 'OK', status_code: 200 }
  }

  /**
   * Download tiles from a Grid and saves them to MBTiles.
   * @name download
   * @returns {Object} Status message
   * @example
   */
  public async download(init: InterfaceMetadata) {
    const grid = new Grid(init, 10)
    const bar = new ProgressBar('  downloading [:bar] :percent (:current/:total)', {
      total: grid.count,
      width: 20,
    })

    // Index used to quickly find existing tile images by [tile_id]
    const keys = await this.imagesSQL.findAll({ attributes: { exclude: ['tile_data'] } })
    let index: any = {}
    for (let key of keys) { index[key.tile_id] = key.tile_id }
    bar.tick(keys.length)

    debug.download(`started [${ keys.length } of ${ grid.count } tiles]`)

    // Iterate over Grid
    while (true) {
      const { value, done } = grid.tiles.next()
      if (done) { break }
      const tile = new Tile(value)

      if (!index[tile.id]) {
        bar.tick() // Update Progress bar
        await this.downloadTile(tile)
      } else {
        debug.skipped(`${ tile.zoom }/${ tile.x }/${ tile.y }`)
      }
    }
    debug.download(`done [${ grid.count } tiles]`)
    return { message: 'Download finished', ok: true, status: 'OK', status_code: 200 }
  }

  public async downloadTile(tile: Tile) {
    let data = await downloadTile(tile.url)
    if (data) {
      debug.download(`${ tile.url } (${ getFileSize(data) })`)
      this.imagesSQL.create({ tile_data: data, tile_id: tile.id })
      return { message: 'Downloaded Tile', ok: true, status: 'OK' }
    }
    return { message: '<ERROR> Download Tile', ok: false, status: 'ERROR', status_code: 500 }
  }
  /**
   * Builds Map to MBTile SQL db
   * 
   * @name map
   * @returns {Object} Status message
   * @example
   */
  public async map(init: InterfaceMetadata) {
    const grid = new Grid(init, 100000)
    debug.map(`started [${ grid.count }]`)

    // Remove Existing Mapping
    await this.mapSQL.sync({ force: true })

    // Iterate over 100K and Bulk save
    while (true) {
      const { value, done } = grid.tilesBulk.next()
      if (done) { break }
      await this.mapSQL.bulkCreate(value)
      debug.map(`saved [${ value.length }]`)
    }
    debug.map(`done [${ grid.count }]`)
    return { message: 'Map created', ok: true, status: 'OK', status_code: 200 }
  }

  /**
   * Saves tile to MBTile SQL db
   * 
   * @name save
   * @returns {Object} Status message
   * @example
   * const METADATA = {...}
   * const status = await mbtiles.save(METADATA)
   */
  public async save(init: InterfaceMetadata) {
    await this.metadata(init)
    await this.index(init)
    await this.download(init)
    await this.map(init)
    return { message: 'MBTiles saved', ok: true, status: 'OK', status_code: 200 }
  }
}

/* istanbul ignore next */
async function main() {
  // Initialize
  const mbtiles = new MBTiles('tiles.mbtiles')
  const METADATA = {
    attribution: 'Map data © OpenStreetMap',
    bounds: [-111.2082, 52.6037, -110.5503, 52.8544],
    center: [-111.2082, 52.6037],
    description: 'Tiles from OpenStreetMap',
    format: 'png',
    maxZoom: 10,
    minZoom: 8,
    name: 'OpenStreetMap',
    scheme: 'https://tile-{switch:a,b,c}.openstreetmap.fr/hot/{zoom}/{x}/{y}.png',
    type: 'baselayer',
  }
  const status = await mbtiles.save(METADATA)
  debug.log(status)
  // debug.log(stringifyCenter([-111.2082, 52.6037]))
  // debug.log(stringifyCenter([-111.2082, 52.6037, 2]))
  // debug.log(stringifyBounds([-27, 62, -11]))
}

if (require.main === module) { main() }
