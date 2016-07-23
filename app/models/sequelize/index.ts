import images from './Images'
import map from './Map'
import metadata from './Metadata'
import tiles from './Tiles'
import log from './Log'

const models = {
  Images: images,
  Map: map,
  Metadata: metadata,
  Tiles: tiles,
  Log: log
}

export const { Images, Map, Metadata, Tiles, Log } = models
export default models