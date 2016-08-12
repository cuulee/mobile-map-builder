import { STRING, BLOB, DefineAttributes } from 'sequelize'

const scheme:DefineAttributes = {
  tile_data: { type: BLOB },
  tile_id: { type: STRING, unique: true, primaryKey: true }
}

export default scheme