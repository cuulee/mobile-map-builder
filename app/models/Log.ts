import { STRING, JSON, DefineAttributes } from 'sequelize'

const scheme:DefineAttributes = {
  ip: STRING,
  url: STRING,
  method: STRING,
  body: JSON,
  auth: STRING
}

export default scheme