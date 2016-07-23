import { model, Schema } from 'mongoose'

const schema = new Schema({
  ip: String,
  url: String,
  method: String,
  body: Object,
  auth: String
})

export default model('log', schema)
