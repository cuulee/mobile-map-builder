import { STRING, INTEGER, DOUBLE, DefineAttributes } from 'sequelize'

const scheme:DefineAttributes = {
  name: { type: STRING, unique: true, primaryKey: true },
  value: { type: INTEGER, allowNull: false }
}

export default scheme