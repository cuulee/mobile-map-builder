import { model, Schema } from 'mongoose'

const schema = new Schema({
  zoom_level: Number,
  tile_column: Number,
  tile_row: Number,
  tile_id: String
})

export default model('map', schema)
