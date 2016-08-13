import { TEXT, INTEGER, DefineAttributes } from 'sequelize'

const scheme: DefineAttributes = {
  tile_column: { type: INTEGER },
  tile_id: { primaryKey: true, type: TEXT, unique: true },
  tile_row: { type: INTEGER },
  zoom_level: { type: INTEGER },
}

export default scheme
