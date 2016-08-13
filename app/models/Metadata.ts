import { TEXT, DefineAttributes } from 'sequelize'

const scheme:DefineAttributes = {
  name: { type: TEXT, unique: true, primaryKey: true },
  value: { type: TEXT, allowNull: false }
}

export default scheme