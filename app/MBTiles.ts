import debug from './debug'
import models from './models'
import * as filesize from 'filesize'
import * as Sequelize from 'sequelize'
import Tile, { downloadTile } from './Tile'
import Grid, { InterfaceGridOptional } from './Grid'
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
  minZoom?: number
  maxZoom?: number
  author?: string
  attribution?: string
  center?: number[]
  scheme?: string
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
  if (y < -90 || y > 90) {
    const message = 'parseCenter [y] must be within -90 to 90 degrees'
    debug.error(message)
    throw new Error(message)
  }
  if (x < -180 || x > 180) {
    const message = 'parseCenter [x] must be within -180 to 180 degrees'
    debug.error(message)
    throw new Error(message)
  }
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
      { name: 'bounds', value: parseBounds(this.bounds) },
      { name: 'center', value: parseCenter(this.center) },
      { name: 'minZoom', value: String(this.minZoom) },
      { name: 'maxZoom', value: String(this.maxZoom) },
    ]
    if (this.format) { saveItems.push({ name: 'format', value: this.format }) }
    if (this.author) { saveItems.push({ name: 'author', value: this.author }) }
    if (this.scheme) { saveItems.push({ name: 'scheme', value: this.scheme }) }

    metadataSQL.bulkCreate(saveItems)
    debug.metadata('done')
    return { message: 'Metadata created', ok: true, status: 'OK' }
  }

  /**
   * Builds Grid data to MBTile database
   * 
   * @name build
   * @returns {Object} Grid
   * @example
   */
  public async build(init?: InterfaceGridOptional) {
    // Define Grid attributes
    if (init) {
      this.bounds = init.bounds ? init.bounds : this.bounds
      this.minZoom = init.minZoom ? init.minZoom : this.minZoom
      this.maxZoom = init.maxZoom ? init.maxZoom : this.maxZoom
      this.scheme = init.scheme ? init.scheme : this.scheme
    }

    /* istanbul ignore next */
    if (!this.bounds) {
      const message = 'MBTiles.grid <bounds> is required'
      debug.error(message)
      throw new Error(message)
    /* istanbul ignore next */
    } else if (!this.minZoom) {
      const message = 'MBTiles.grid <minZoom> is required'
      debug.error(message)
      throw new Error(message)
    /* istanbul ignore next */
    } else if (!this.maxZoom) {
      const message = 'MBTiles.grid <maxZoom> is required'
      debug.error(message)
      throw new Error(message)
    /* istanbul ignore next */
    } else if (!this.scheme) {
      const message = 'MBTiles.grid <scheme> is required'
      debug.error(message)
      throw new Error(message)
    }

    // Create Grid
    const grid = new Grid({
      bounds: this.bounds,
      maxZoom: this.maxZoom,
      minZoom: this.minZoom,
      scheme: this.scheme,
    })

    // Build SQL tables
    debug.map('started')
    await this.mapSQL.sync({ force: true })
    await this.mapSQL.bulkCreate(grid.tiles)
    debug.map('done')

    return grid
  }

  /**
   * Download and saves tile buffer to MBTiles SQL db
   * 
   * @name download
   * @returns {Object} Tile Class
   * @example
   */
  public async download(tile: Tile) {
    // Retrieve existing ID if exists
    const findOne: InterfaceImagesSQL = await this.imagesSQL.findOne({
      where: { tile_id: tile.id },
    })

    // Skip download if tile exist in <images.tile_data>
    if (findOne) { debug.skipped(`${ tile.zoom }/${ tile.x }/${ tile.y } [${ getFileSize(findOne.tile_data) }]`)
    } else {
      // Download Tile from default settings
      let data = await downloadTile(tile.url)
      debug.download(`${ tile.url } (${ getFileSize(data) })`)
      // Save Tile to SQL
      await this.imagesSQL.create({
        tile_data: data,
        tile_id: tile.id,
      })
      data = null
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
  public async save(init: InterfaceMetadata) {
    await this.metadata(init)
    await this.index(init)
    const grid = await this.build(init)
    debug.build(`started [${ grid.tiles.length } tiles]`)
    for (let i = 0; i < grid.tiles.length; i ++) {
      const tile = new Tile(grid.tiles[i])
      await this.download(tile)
    }
    debug.build(`done [${ grid.tiles.length } tiles]`)
    return { message: 'MBTiles saved', ok: true, status: 'OK' }
  }
}

/* istanbul ignore next */
async function main() {
  // Initialize
  const mbtiles = new MBTiles('cfb-wainwright.mbtiles')

  // Save Metadata
  // const SCHEME = 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{zoom}/{y}/{x}'
  // const SCHEME = 'https://tile-{switch:a,b,c}.openstreetmap.fr/hot/{zoom}/{x}/{y}.png'
  // const SCHEME = 'https://maps.wikimedia.org/osm-intl/{zoom}/{x}/{y}.png'
  const SCHEME = 'http://ecn.t{switch:0,1,2,3}.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=5250'
  // const SCHEME = 'http://ecn.t{switch:0,1,2,3}.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=1512&n=z'

  // const CANADA = [-141.0027499, 41.6765556, -52.323198, 83.3362128]
  // const SUDBURY = [-81.1507388, 46.3310993, -80.8307388, 46.6510993]
  // const GREATER_SUDBURY = [-81.90, 45.75, -80.15, 47.25]
  const GAGETOWN = [-111.2082, 52.6037, -110.5503, 52.8544]
  const METADATA = {
    attribution: 'Map data © Bing',
    bounds: GAGETOWN,
    center: [-111.2082, 52.6037],
    description: 'Tiles from Bing',
    format: 'jpg',
    maxZoom: 10,
    minZoom: 8,
    name: 'Bing',
    scheme: SCHEME,
    type: 'baselayer',
  }
  const status = await mbtiles.save(METADATA)
  debug.log(status)
}

if (require.main === module) { main() }
