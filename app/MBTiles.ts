
import * as filesize from 'filesize'
import * as Sequelize from 'sequelize'
import * as ProgressBar from 'progress'
import * as turf from 'turf'
import debug from './debug'
import models from './models'
import { set, isUndefined } from 'lodash'
import { LngLatBounds, LngLat } from './GlobalMercator'
import Tile, { downloadTile } from './Tile'
import Grid from './Grid'
import {
  InterfaceMapAttribute,
  InterfaceMapInstance,
  InterfaceMapModel } from './models/Map'
import {
  InterfaceMetadataAttribute,
  InterfaceMetadataInstance,
  InterfaceMetadataModel } from './models/Metadata'
import {
  InterfaceImagesAttribute,
  InterfaceImagesInstance,
  InterfaceImagesModel } from './models/Images'

/**
 * Metadata Interface for MBTiles.metadata
 */
export interface InterfaceMetadata {
  name: string
  bounds: number[]
  minZoom: number
  maxZoom: number
  scheme: string
  attribution?: string
  description?: string
  format?: string
  type?: string
  center?: number[]
}

/**
 * Images Interface for MBTiles SQL Model
 */
export interface InterfaceImagesSQL {
  tile_data?: Buffer
  tile_id?: string
}

/**
 * Converts Bounds to Center
 *
 * @name boundsToCenter
 * @param {List} bounds- [x1, y1, x2, y2] coordinates
 * @return {List} center - [x, y] coordinates
 * @example
 * const center = boundsToCenter([90, -45, 85, -50])
 * //= [ 87.5, -47.5 ]
 */
export const boundsToCenter = (bounds: number[]) => {
  const poly = turf.bboxPolygon(bounds)
  return turf.centroid(poly).geometry.coordinates
}

/**
 * Converts & validates center coordinates [x,y] into proper SQL string
 *
 * @name stringifyCenter
 * @param {List} center - [x,y] coordinates
 * @return {String}
 * @example
 * const center = stringifyCenter([45.12, -75.34])
 * //= '45.12,-75.34'
 */
export const stringifyCenter = (init: number[]) => {
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
  private sequelize: Sequelize.Sequelize
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
    this.version = '1.1.0'
    this.type = 'baselayer'
    this.format = 'png'
    this.description = ''
    this.attribution = ''

    // Create SQL connections
    this.sequelize = this.connect()
    this.mapSQL = this.sequelize.define<InterfaceMapInstance, InterfaceMapAttribute>('map', models.Map)
    this.imagesSQL = this.sequelize.define<InterfaceImagesInstance, InterfaceImagesAttribute>('images', models.Images)
    this.metadataSQL = this.sequelize.define<InterfaceMetadataInstance, InterfaceMetadataAttribute>('metadata', models.Metadata)
  }

  /**
   * Builds Tables for MBTiles SQL db
   * 
   * @name tables
   * @returns {Object} Status message
   * @example
   */
  public async tables() {
    // Connect SQL
    debug.tables('started')

    await this.imagesSQL.sync()
    await this.metadataSQL.sync()
    await this.mapSQL.sync()

    debug.tables('done')
    return { message: 'Tables created', ok: true, status: 'OK', status_code: 200 }
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

    // Build Index
    await this.sequelize.query('CREATE UNIQUE INDEX IF NOT EXISTS metadata_name on metadata (name)')
    await this.sequelize.query('CREATE UNIQUE INDEX IF NOT EXISTS map_tile_id on map (tile_id)')
    await this.sequelize.query('CREATE UNIQUE INDEX IF NOT EXISTS map_tile on map (tile_row, tile_column, zoom_level)')
    await this.sequelize.query('CREATE UNIQUE INDEX IF NOT EXISTS images_tile_id on images (tile_id)')

    // Build View
    await this.sequelize.query(`CREATE VIEW IF NOT EXISTS tiles AS
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
   * @param {Number[x1,y1,x2,y2]} bounds
   * @param {Number} minZoom
   * @param {Number} maxZoom
   * @param {String} name
   * @param {String} format
   * @param {String} attribution
   * @param {String} description
   * @param {String} scheme
   * @param {String} type
   * @returns {Object} Status message
   * @example
   * mbtiles.metadata({
   *   name: 'OpenStreetMap',
   *   format: 'png',
   *   attribution: 'Map data © OpenStreetMap',
   *   description: 'Tiles from OSM',
   *   scheme: 'http://tile-{switch:a,b,c}.openstreetmap.fr/hot/{zoom}/{x}/{y}.png',
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
      this.center = boundsToCenter(this.bounds)
      this.minZoom = init.minZoom ? init.minZoom : this.minZoom
      this.maxZoom = init.maxZoom ? init.maxZoom : this.maxZoom
      this.scheme = init.scheme ? init.scheme : this.scheme
      this.format = init.format ? init.format : this.format
      this.attribution = init.attribution ? init.attribution : this.attribution
      this.description = init.description ? init.description : this.description
      this.type = init.type ? init.type : this.type
    }

    // Metadata required key/values
    if (isUndefined(this.name)) {
      const message = 'MBTiles.metadata <name> is required'
      debug.error(message)
      throw new Error(message)
    } else if (isUndefined(this.type)) {
      const message = 'MBTiles.metadata <type> is required'
      debug.error(message)
      throw new Error(message)
    } else if (isUndefined(this.version)) {
      const message = 'MBTiles.metadata <version> is required'
      debug.error(message)
      throw new Error(message)
    } else if (isUndefined(this.description)) {
      const message = 'MBTiles.metadata <description> is required'
      debug.error(message)
      throw new Error(message)
    } else if (isUndefined(this.format)) {
      const message = 'MBTiles.metadata <format> is required'
      debug.error(message)
      throw new Error(message)
    } else if (isUndefined(this.bounds)) {
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

    // Remove existing Meta attributes
    await this.metadataSQL.sync({ force: true })

    // Save Metadata to SQL
    const saveItems = [
      { name: 'name', value: this.name },
      { name: 'type', value: this.type },
      { name: 'version', value: this.version },
      { name: 'attribution', value: this.attribution },
      { name: 'description', value: this.description },
      { name: 'bounds', value: stringifyBounds(this.bounds) },
      { name: 'center', value: stringifyCenter(this.center) },
      { name: 'minZoom', value: String(this.minZoom) },
      { name: 'maxZoom', value: String(this.maxZoom) },
    ]
    if (this.format) { saveItems.push({ name: 'format', value: this.format }) }
    if (this.scheme) { saveItems.push({ name: 'scheme', value: this.scheme }) }

    this.metadataSQL.bulkCreate(saveItems)

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
    // Build SQL Table if does not exists
    await this.imagesSQL.sync()

    // Construct Grid
    const grid = new Grid(init, 500)
    const bar = new ProgressBar('  downloading [:bar] :percent (:current/:total)', {
      total: grid.count,
      width: 20,
    })
    debug.download(`started [${ grid.count }]`)

    while (true) {
      // Iterate over Grid
      const { value, done } = grid.tilesBulk.next()
      if (done) { break }

      // Build Index
      const index: any = {}
      const findSelection = value.map(item => { return { tile_id: item.tile_id }})
      const findAll = await this.imagesSQL.findAll({
        attributes: ['tile_id'],
        where: { $or: findSelection },
      })
      findAll.map(item => set(index, item.tile_id, true))

      // Find remaining
      const remaining = value.filter(item => !index[item.tile_id])
      bar.tick(value.length - remaining.length)

      // Download remaining tiles
      for (const item of remaining) {
        const tile = new Tile(item)
        debug.downloadTile(tile)
        const status = await this.downloadTile(tile)
        // Add broken Tile back to queue
        if (status.ok) {
          bar.tick()
        } else {
          debug.error(`broken tile: ${ tile.url }`)
          remaining.push(item)
        }
      }
    }
    debug.download(`done [${ grid.count } tiles]`)
    return { message: 'Download finished', ok: true, status: 'OK', status_code: 200 }
  }

  /**
   * Download single Tile
   * 
   * @name downloadTile
   * @param {Object} Tile
   * @returns {Object} Status message
   * @example
   */
  public async downloadTile(tile: Tile) {
    const data = await downloadTile(tile.url)
    if (data) {
      debug.downloadTile(`${ tile.url } (${ getFileSize(data) })`)
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
    const grid = new Grid(init, 10000)
    const bar = new ProgressBar('  mapping     [:bar] :percent (:current/:total)', {
      total: grid.count,
      width: 20,
    })
    debug.map(`started [${ grid.count }]`)

    // Remove Existing Mapping
    await this.mapSQL.sync({ force: true })

    // Iterate over 100K and Bulk save
    while (true) {
      const { value, done } = grid.tilesBulk.next()
      if (done) { break }
      await this.mapSQL.bulkCreate(value)
      bar.tick(value.length)
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
    await this.download(init)
    await this.map(init)
    await this.index(init)
    return { message: 'MBTiles saved', ok: true, status: 'OK', status_code: 200 }
  }
}

/* istanbul ignore next */
async function main() {
  const mbtiles = new MBTiles('tiles.mbtiles')
  const METADATA = {
    bounds: [-27, 62, -11, 67.5],
    format: 'jpg',
    maxZoom: 3,
    minZoom: 3,
    name: 'OpenStreetMap',
    scheme: 'http://tile-{switch:a,b,c}.openstreetmap.fr/hot/{zoom}/{x}/{y}.png',
  }
  const status = await mbtiles.save(METADATA)
  debug.log(status)
}

if (require.main === module) { main() }
