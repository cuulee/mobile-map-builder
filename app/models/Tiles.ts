import { NUMBER, BLOB, DefineAttributes } from 'sequelize'

const scheme: DefineAttributes = {
  tile_column: { type: NUMBER },
  tile_data: { type: BLOB },
  tile_row: { type: NUMBER },
  zoom_level: { type: NUMBER },
}

export default scheme
