import uuid from 'node-uuid'
import _ from 'lodash'

export const validateTile = ({x, y, zoom}) => {
  let tileCountXY = Math.pow(2, zoom)
  if (x >= tileCountXY || y >= tileCountXY) {
    throw new Error('Illegal parameters for tile')
  }
  return true
}

export const parseSwitch = (url) => {
  let pattern = /{switch:([a-z,\d]*)}/i
  let found = url.match(pattern)
  if (found) {
    let sample = _.sample(found[1].split(','))
    return url.replace(pattern, sample)
  }
  return url
}

export const parseUrl = ({ scheme, x, y, zoom }) => {
  let url = scheme
  url = url.replace(/{zoom}/, zoom)
  url = url.replace(/{z}/, zoom)
  url = url.replace(/{x}/, x)
  url = url.replace(/{y}/, y)
  url = parseSwitch(url)

  return url
}

export default class Tile {
  constructor({ x, y, zoom, scheme }) {
    this.x = x
    this.y = y
    this.zoom = zoom
    this.scheme = scheme
    this.url = parseUrl(this)
    this.id = uuid.v4()
    validateTile(this)
  }
}

if (require.main === module) {
  /* istanbul ignore next */
  const scheme = 'http://tile-{switch:a,b,c}.openstreetmap.fr/hot/{zoom}/{x}/{y}.png'
  /* istanbul ignore next */
  const tile = new Tile({ zoom: 15, x: 83, y: 120, scheme: scheme })
  /* istanbul ignore next */
  console.log(tile)
}
