import { STRING, JSON } from 'sequelize'

const scheme = {
  ip: STRING,
  url: STRING,
  method: STRING,
  body: JSON,
  auth: STRING
}

export default scheme