import * as express from 'express'
import * as multer from 'multer'
import * as bodyParser from 'body-parser'
import routes from './routes'
import { Log } from './models/mongoose'
import { PORT } from './config'

const app = express()
app.use(bodyParser.json())
app.set('json spaces', 2)
app.use(bodyParser.urlencoded({ extended: true }))
app.set('trust proxy', true)

// Logging Middleware
const upload:any = multer({ dest: 'uploads/' })
app.use(upload.array(), (request:any, response:any, next:any) => {
  let log:any = new Log()
  log.ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress
  log.method = request.method
  log.url = request.originalUrl
  log.body = request.body
  log.auth = request.headers.authorization
  console.log(log)
  next()
})

// CORS Middleware
app.use((request:any, response:any, next:any) => {
  response.header('Access-Control-Allow-Origin', '*')
  response.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,Cache-Control,Accept,Accept-Encoding')
  next()
})

// Register Routes
app.use('/', routes.api)

// Start Listening
app.listen(PORT)
console.log(`Listening on PORT ${ PORT }`)
