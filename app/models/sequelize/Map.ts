import { STRING, NUMBER } from 'sequelize'

const scheme = {
  zoom_level: NUMBER,
  tile_column: NUMBER,
  tile_row: NUMBER,
  tile_id: STRING
}

export default scheme