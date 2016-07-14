import mongoose, { Schema } from 'mongoose'

let schema = new Schema({
  tile_data: Buffer,
  tile_id: String
})

export default mongoose.model('images', schema)
