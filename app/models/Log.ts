import { TEXT, JSON, DefineAttributes } from 'sequelize'

const scheme:DefineAttributes = {
  ip: TEXT,
  url: TEXT,
  method: TEXT,
  body: JSON,
  auth: TEXT
}

export default scheme