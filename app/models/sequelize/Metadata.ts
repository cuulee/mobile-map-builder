import { STRING, INTEGER, DOUBLE, DefineAttributes } from 'sequelize'

const scheme:DefineAttributes = {
  bounds: STRING,
  minzoom: INTEGER,
  maxzoom: DOUBLE,
  name: STRING,
  version: STRING,
  center: STRING,
  attribution: STRING,
  description: STRING
}

export default scheme