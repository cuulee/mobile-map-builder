import * as Sequelize from 'sequelize'
import { TEXT, INTEGER, DefineAttributes } from 'sequelize'

/**
 * Map Interface for MBTiles SQL Model
 */
export interface InterfaceMapAttribute {
  tile_row: number
  tile_column: number
  tile_id?: string
  zoom_level: number
}

/**
 * Map Instance for MBTiles SQL Model
 */
export interface InterfaceMapInstance extends Sequelize.Instance<InterfaceMapAttribute>, InterfaceMapAttribute { }

/**
 * Map Model for MBTiles SQL Model
 */
export interface InterfaceMapModel extends Sequelize.Model<InterfaceMapInstance, InterfaceMapAttribute> { }

/**
 * Map Scheme for MBTiles SQL Model
 */
const scheme: DefineAttributes = {
  tile_column: { type: INTEGER },
  tile_id: { primaryKey: true, type: TEXT, unique: true },
  tile_row: { type: INTEGER },
  zoom_level: { type: INTEGER },
}

export default scheme
