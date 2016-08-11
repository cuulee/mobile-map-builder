import * as Sequelize from 'sequelize'
import { INTEGER, STRING } from 'sequelize'
import { Metadata } from '../models/sequelize'
import { get } from 'lodash'

/**
 * Metadata Interface for MBTiles.metadata
 */
export interface metadataInterface {
  center:number[]
  bounds:number[]
  minzoom:number
  maxzoom:number
  name?:string
  attribution?:string
  description?:string
  scheme?:string
  author?:string
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
  center:number[]
  bounds:number[]
  sequelize:Sequelize.Sequelize

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
    this.version = '1.1.0'
    this.attribution = 'Map data © OpenStreetMap'
    this.description = 'Tiles from OSM'
  }

  connect() {
    const options = { define: { timestamps: false } }
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
    // Define Metadata attributes
    this.name = init.name ? init.name : this.name
    this.bounds = init.bounds ? init.bounds : this.bounds
    this.center = init.center ? init.center : this.center
    this.minzoom = init.minzoom ? init.minzoom : this.minzoom
    this.maxzoom = init.maxzoom ? init.maxzoom : this.maxzoom
    this.scheme = init.scheme ? init.scheme : this.scheme
    this.attribution = init.attribution ? init.attribution : this.attribution
    this.description = init.description ? init.description : this.description

    // Save Metadata to SQL
    const sequelize = this.connect()
    const metadata = sequelize.define('metadata', Metadata)
    await metadata.sync({ force:true })
    await metadata.create({ name: 'name', value: this.name })
    await metadata.create({ name: 'version', value: this.version })
    await metadata.create({ name: 'attribution', value: this.attribution })
    await metadata.create({ name: 'description', value: this.description })
    await metadata.create({ name: 'bounds', value: parseBounds(this.bounds) })
    await metadata.create({ name: 'center', value: parseCenter(this.center) })
    await metadata.create({ name: 'minzoom', value: String(this.minzoom) })
    await metadata.create({ name: 'maxzoom', value: String(this.maxzoom) })
    if (this.author) await metadata.create({ name: 'author', value: this.author })
    if (this.scheme) await metadata.create({ name: 'scheme', value: this.scheme })

    return { ok: true, status: 'OK', message: 'Metadata updated' }
  }
}

/* istanbul ignore next */
if (require.main === module) {
  const METADATA = {
    name: 'OpenStreetMap',
    attribution: 'Map data © OpenStreetMap',
    description: 'Tiles from OSM',
    scheme: 'http://tile-{switch:a,b,c}.openstreetmap.fr/hot/{zoom}/{x}/{y}.png',
    center: [-18.7, 65, 7],
    bounds: [-27, 62, -11, 67.5],
    minzoom: 1,
    maxzoom: 18
  }
  const mbtiles = new MBTiles('tiles.mbtiles')
  mbtiles.metadata(METADATA)
    .then(status => console.log(status))
}