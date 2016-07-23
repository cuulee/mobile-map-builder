import { STRING, BLOB, NUMBER } from 'sequelize'

const scheme = {
  bounds: BLOB,
  minzoom: NUMBER,
  maxzoom: NUMBER,
  name: STRING,
  version: STRING,
  center: STRING,
  attribution: STRING,
  description: STRING
}

export default scheme