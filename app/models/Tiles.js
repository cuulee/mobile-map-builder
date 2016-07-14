import mongoose, { Schema } from 'mongoose'

let schema = new Schema({
  zoom_level: Number,
  tile_column: Number,
  tile_row: Number,
  tile_data: Buffer
})

export default mongoose.model('tiles', schema)
