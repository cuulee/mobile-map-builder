import uuid from 'node-uuid'
import { sample } from 'lodash'
import GlobalMercator from './GlobalMercator'

const mercator = new GlobalMercator()

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
    let random = sample(found[1].split(','))
    return url.replace(pattern, random)
  }
  return url
}

export const parseUrl = ({ scheme, x, y, zoom, quadkey }) => {
  let url = scheme
  url = url.replace(/{zoom}/, zoom)
  url = url.replace(/{z}/, zoom)
  url = url.replace(/{x}/, x)
  url = url.replace(/{y}/, y)
  url = url.replace(/{quadkey}/, quadkey)
  url = parseSwitch(url)

  return url
}

export default class Tile {
  constructor({ x, y, zoom, scheme }) {
    this.x = x
    this.y = y
    this.zoom = zoom
    this.scheme = scheme
    this.bounds = mercator.GoogleLatLonBounds({ x: x, y: y, zoom: zoom })
    this.quadkey = mercator.GoogleQuadKey({ x: x, y: y, zoom: zoom })
    this.url = parseUrl(this)
    this.id = uuid.v4()
    validateTile(this)
  }
}


/*if (require.main === module) {
  const scheme = 'http://tile-{switch:a,b,c}.openstreetmap.fr/hot/{zoom}/{x}/{y}.png'
  //const scheme = 'http://tile.openstreetmap.fr/hot/{quadkey}.png'
  const tile = new Tile({ zoom: 13, x: 2389, y: 2946, scheme: scheme })
  console.log(tile)
}*/
