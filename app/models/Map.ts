import { STRING, INTEGER, DefineAttributes } from 'sequelize'

const scheme:DefineAttributes = {
  zoom_level: { type: INTEGER },
  tile_column: { type: INTEGER },
  tile_row: { type: INTEGER },
  tile_id: { type: STRING, unique: true, primaryKey: true }
}

export default scheme