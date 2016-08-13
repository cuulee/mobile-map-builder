import { TEXT, BLOB, DefineAttributes } from 'sequelize'

const scheme: DefineAttributes = {
  tile_data: { type: BLOB },
  tile_id: { primaryKey: true, type: TEXT, unique: true },
}

export default scheme
