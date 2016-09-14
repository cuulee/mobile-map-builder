import * as os from 'os'
import * as uuid from 'node-uuid'
import * as fs from 'fs'
import * as yml from 'js-yaml'
import * as validator from 'validator'
import debug from '../app/debug'
import { keys, isUndefined } from 'lodash'
import * as rp from 'request-promise'

const config = {
  data: yml.safeLoad(fs.readFileSync(`${ __dirname }/../configs/data.yml`, { encoding: 'utf-8' })),
  server: yml.safeLoad(fs.readFileSync(`${ __dirname }/../configs/server.yml`, { encoding: 'utf-8' }))
}

export const downloadDatasets = () => {
  const datasets: any = {}
  keys(config.data).map(key => {
    // Download from URL
    if (validator.isURL(config.data[key], { require_protocol: true })) {
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