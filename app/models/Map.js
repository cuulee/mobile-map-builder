import mongoose, { Schema } from 'mongoose'

let schema = new Schema({
  zoom_level: Number,
  tile_column: Number,
  tile_row: Number,
  tile_id: String
})

export default mongoose.model('map', schema)
