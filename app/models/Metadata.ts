import * as Sequelize from 'sequelize'
import { TEXT, DefineAttributes } from 'sequelize'

/**
 * Metadata Interface for MBTiles SQL Model
 */
export interface InterfaceMetadataAttribute {
  name: string
  value: string
}

/**
 * Metadata Instance for MBTiles SQL Model
 */
export interface InterfaceMetadataInstance extends Sequelize.Instance<InterfaceMetadataAttribute>, InterfaceMetadataAttribute { }

/**
 * Metadata Model for MBTiles SQL Model
 */
export interface InterfaceMetadataModel extends Sequelize.Model<InterfaceMetadataInstance, InterfaceMetadataAttribute> { }

/**
 * Metadata Scheme for MBTiles SQL Model
 */
const scheme: DefineAttributes = {
  name: { primaryKey: true, type: TEXT, unique: true },
  value: { allowNull: false, type: TEXT },
}

export default scheme
