import { TEXT, DefineAttributes } from 'sequelize'

const scheme: DefineAttributes = {
  name: { primaryKey: true, type: TEXT, unique: true },
  value: { allowNull: false, type: TEXT },
}

export default scheme
