import * as Sequelize from 'sequelize'
import { BLOB, TEXT, DefineAttributes } from 'sequelize'

/**
 * Images Interface for MBTiles SQL Model
 */
export interface InterfaceImagesAttribute {
  tile_data: Buffer
  tile_id: string
}

/**
 * Images Instance for MBTiles SQL Model
 */
export interface InterfaceImagesInstance extends Sequelize.Instance<InterfaceImagesAttribute>, InterfaceImagesAttribute { }

/**
 * Images Model for MBTiles SQL Model
 */
export interface InterfaceImagesModel extends Sequelize.Model<InterfaceImagesInstance, InterfaceImagesAttribute> { }

/**
 * Images Scheme for MBTiles SQL Model
 */
const scheme: DefineAttributes = {
  tile_data: { type: BLOB },
  tile_id: { primaryKey: true, type: TEXT, unique: true },
}

export default scheme
