import { omit } from 'lodash'
import Tile from './Tile'

export default class GeoJSON {
  constructor({ x, y, zoom, scheme, quadkey }) {

    if (typeof x == 'undefined') { throw new Error('[x] required') }
    if (typeof y == 'undefined') { throw new Error('[y] required') }
    if (typeof zoom == 'undefined') { throw new Error('[zoom] required') }
    if (typeof scheme == 'undefined') { throw new Error('[scheme] required') }
    if (typeof quadkey != 'undefined' && typeof quadkey != 'string') { throw new Error('[quadkey] must be string') }

    const tile = new Tile({ x: x, y: y, zoom: zoom, scheme: scheme, quadkey: quadkey })

    this.type = 'Feature'
    this.geometry = tile.geometry
    this.bounds = tile.bounds
    this.id = tile.id
    this.properties = omit(tile, ['bounds', 'geometry', 'id'])
  }
}

if (require.main === module) {
  /* istanbul ignore next */
  const scheme = 'http://tile-{switch:a,b,c}.openstreetmap.fr/hot/{zoom}/{x}/{y}.png'
  /* istanbul ignore next */
  const geojson = new GeoJSON({ zoom: 13, x: 2389, y: 2946, scheme: scheme, quadkey: '0302321010121' })
  /* istanbul ignore next */
  console.log(geojson)
}
