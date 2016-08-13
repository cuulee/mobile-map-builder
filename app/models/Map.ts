import { TEXT, INTEGER, DefineAttributes } from 'sequelize'

const scheme:DefineAttributes = {
  zoom_level: { type: INTEGER },
  tile_column: { type: INTEGER },
  tile_row: { type: INTEGER },
  tile_id: { type: TEXT, unique: true, primaryKey: true }
}

export default scheme