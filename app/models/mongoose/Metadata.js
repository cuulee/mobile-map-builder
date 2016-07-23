import mongoose, { Schema } from 'mongoose'

const schema = new Schema({
  bounds: Buffer,
  minzoom: Number,
  maxzoom: Number,
  name: String,
  version: String,
  center: String,
  attribution: String,
  description: String
})

export default mongoose.model('metadata', schema)
