import { STRING, NUMBER, DefineAttributes } from 'sequelize'

const scheme:DefineAttributes = {
  bounds: STRING,
  minzoom: NUMBER,
  maxzoom: NUMBER,
  name: STRING,
  version: STRING,
  center: STRING,
  attribution: STRING,
  description: STRING
}

export default scheme