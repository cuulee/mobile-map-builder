import { omit } from 'lodash'
import Tile from './Tile'

export default class GeoJSON {
  name = 'GeoJSON'

  constructor({ x, y, zoom, scheme, quadkey }) {
    // Validate Types
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
  const { GOOGLE } = require('../../test/globals')
  /* istanbul ignore next */
  const geojson = new GeoJSON(GOOGLE)
  /* istanbul ignore next */
  console.log(geojson)
}
