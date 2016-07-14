import mongoose, { Schema } from 'mongoose'

let schema = new Schema({
  ip: String,
  url: String,
  method: String,
  body: Object,
  auth: String
})

export default mongoose.model('log', schema)
