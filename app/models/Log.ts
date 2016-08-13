import { TEXT, JSON, DefineAttributes } from 'sequelize'

const scheme: DefineAttributes = {
  auth: TEXT,
  body: JSON,
  ip: TEXT,
  method: TEXT,
  url: TEXT,
}

export default scheme
