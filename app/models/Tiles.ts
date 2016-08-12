import { NUMBER, BLOB, DefineAttributes } from 'sequelize'

const scheme:DefineAttributes = {
  zoom_level: { type: NUMBER },
  tile_column: { type: NUMBER },
  tile_row: { type: NUMBER },
  tile_data: { type: BLOB }
}

export default scheme