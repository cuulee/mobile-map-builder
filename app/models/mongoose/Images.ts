import { model, Schema } from 'mongoose'

const schema = new Schema({
  tile_data: Buffer,
  tile_id: String
})

export default model('images', schema)
