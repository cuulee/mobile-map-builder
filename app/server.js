import cluster from 'cluster'
import express from 'express'
import multer from 'multer'
import bodyParser from 'body-parser'
import { PORT, SECRET, CORES } from './config'
import routes from './routes'
import { Log } from './models'

if (cluster.isMaster) {
  // Fork workers.
  for (var i = 0; i < CORES; i++) { cluster.fork() }

  console.log(`HTTP [PORT]: ${ PORT }`)
  console.log(`JWT [SECRET]: ${ SECRET }`)
  console.log(`CPU Cores: ${ CORES }`)
} else {
  // Set up Server
  const app = express()
  app.use(bodyParser.json())
  app.set('json spaces', 2)
  app.use(bodyParser.urlencoded({ extended: true }))
  app.set('trust proxy', true)

  // Logging Middleware
  const upload = multer({ dest: 'uploads/' })
  app.use(upload.array(), (request, response, next) => {
    let log = new Log()
    log.ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress
    log.method = request.method
    log.url = request.originalUrl
    log.body = request.body
    log.auth = request.headers.authorization
    console.log(log)
    next()
  })

  // CORS Middleware
  app.use((request, response, next) => {
    response.header('Access-Control-Allow-Origin', '*')
    response.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,Cache-Control,Accept,Accept-Encoding')
    next()
  })

  // Register Routes
  app.use('/', routes.api)

  // Start Listening
  app.listen(PORT)
}
