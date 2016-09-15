import * as os from 'os'
import * as uuid from 'node-uuid'
import * as fs from 'fs'
import * as yml from 'js-yaml'
import * as validator from 'validator'
import debug from '../app/debug'
import { keys } from 'lodash'
import * as rp from 'request-promise'

const config: any = {}

//////////////////////////////////////
// Loading Configurations
//////////////////////////////////////

// DATA
if (fs.existsSync(`${ __dirname }/../configs/data.yml`)) {
  config.data = yml.safeLoad(fs.readFileSync(`${ __dirname }/../configs/data.yml`, { encoding: 'utf-8' }))
  debug.configs('[OK] loaded <configs/data.yml>')

} else if (fs.existsSync(`${ __dirname }/../configs/data-example.yml`)) {
  config.data = yml.safeLoad(fs.readFileSync(`${ __dirname }/../configs/data-example.yml`, { encoding: 'utf-8' }))
  debug.warning('Configs must be renamed from <configs/data-example.yml> to <configs/data.yml>')
  debug.configs('[OK] loaded <configs/data-example.yml>')

} else {
  const message = 'Missing data configs <configs/data.yml>'
  debug.error(message)
  throw new Error(message)
}

// SERVER
if (fs.existsSync(`${ __dirname }/../configs/server.yml`)) {
  config.server = yml.safeLoad(fs.readFileSync(`${ __dirname }/../configs/server.yml`, { encoding: 'utf-8' }))
  debug.configs('[OK] loaded <configs/server.yml>')

} else if (fs.existsSync(`${ __dirname }/../configs/server-example.yml`)) {
  config.server = yml.safeLoad(fs.readFileSync(`${ __dirname }/../configs/server-example.yml`, { encoding: 'utf-8' }))
  debug.warning('Configs must be renamed from <configs/server-example.yml> to <configs/server.yml>')
  debug.configs('[OK] loaded <configs/server-example.yml>')

} else {
  const message = 'Missing server configs <configs/server.yml>'
  debug.error(message)
  throw new Error(message)
}

// PROVIDERS
if (fs.existsSync(`${ __dirname }/../configs/providers.yml`)) {
  config.providers = yml.safeLoad(fs.readFileSync(`${ __dirname }/../configs/providers.yml`, { encoding: 'utf-8' }))
  debug.configs('[OK] loaded <configs/providers.yml>')

} else if (fs.existsSync(`${ __dirname }/../configs/providers-example.yml`)) {
  config.providers = yml.safeLoad(fs.readFileSync(`${ __dirname }/../configs/providers-example.yml`, { encoding: 'utf-8' }))
  debug.warning('Configs must be renamed from <configs/providers-example.yml> to <configs/providers.yml>')
  debug.configs('[OK] loaded <configs/providers-example.yml>')

} else {
  const message = 'Missing providers configs <configs/providers.yml>'
  debug.error(message)
  throw new Error(message)
}

// BOUNDS
if (fs.existsSync(`${ __dirname }/../configs/bounds.yml`)) {
  config.bounds = yml.safeLoad(fs.readFileSync(`${ __dirname }/../configs/bounds.yml`, { encoding: 'utf-8' }))
  debug.configs('[OK] loaded <configs/bounds.yml>')

} else if (fs.existsSync(`${ __dirname }/../configs/bounds-example.yml`)) {
  config.bounds = yml.safeLoad(fs.readFileSync(`${ __dirname }/../configs/bounds-example.yml`, { encoding: 'utf-8' }))
  debug.warning('Configs must be renamed from <configs/bounds-example.yml> to <configs/bounds.yml>')
  debug.configs('[OK] loaded <configs/bounds-example.yml>')

} else {
  const message = 'Missing bounds configs <configs/bounds.yml>'
  debug.error(message)
  throw new Error(message)
}

//////////////////////////////////////
// Download Datasets
//////////////////////////////////////

export const downloadDatasets = () => {
  const datasets: any = {}
  keys(config.data).map(key => {
    // Download from URL
    if (validator.isURL(config.data[key], { require_host: true, require_protocol: true })) {
      debug.download(config.data[key])
      rp.get(config.data[key]).then(
        data => {
          datasets[key] = JSON.parse(data)
          debug.server(`[OK] URL dataset: ${ key }`)
        })

    // Require file from File Path (Must be JSON)
    } else if (config.data[key].match(/\.(json|geojson)$/)) {
      if (!fs.existsSync(config.data[key])) {
        const message = 'File Path does not exists'
        debug.error(message)
        throw new Error(message)
      }
      datasets[key] = JSON.parse(fs.readFileSync(config.data[key], { encoding: 'utf-8' }))
      debug.server(`[OK] File dataset: ${ key }`)

    // Throw error
    } else {
      const message = 'File must be URL or (.json|.geojson) file'
      debug.error(message)
      throw new Error(message)
    }
  })
  return datasets
}
export const PORT = (process.env.PORT) ? process.env.PORT : (config.server.PORT) ? config.server.PORT : 5000
export const SECRET = (process.env.SECRET) ? process.env.SECRET : (config.server.SECRET) ? config.server.SECRET : uuid.v4()
export const CORES = (process.env.CORES) ? process.env.CORES : (config.server.CORES) ? config.server.CORES : os.cpus().length
