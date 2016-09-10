import * as fs from 'fs'
import * as yml from 'js-yaml'
import * as validator from 'validator'
import debug from '../app/debug'
import { keys } from 'lodash'
import * as rp from 'request-promise'

const config: any = yml.safeLoad(fs.readFileSync(`${ __dirname }/data.yml`, { encoding: 'utf-8' }))
const datasets: any = {}
keys(config).map(key => {
  // Download from URL
  if (validator.isURL(config[key], { require_protocol: true })) {
    debug.download(config[key])
    rp.get(config[key]).then(
      data => {
        datasets[key] = JSON.parse(data)
        debug.server(`[OK] URL dataset: ${ key }`)
      })

  // Require file from File Path (Must be JSON)
  } else if (config[key].match(/\.(json|geojson)$/)) {
    if (!fs.existsSync(config[key])) {
      const message = 'File Path does not exists'
      debug.error(message)
      throw new Error(message)
    }
    datasets[key] = JSON.parse(fs.readFileSync(config[key], { encoding: 'utf-8' }))
    debug.server(`[OK] File dataset: ${ key }`)

  // Throw error
  } else {
    const message = 'File must be URL or (.json|.geojson) file'
    debug.error(message)
    throw new Error(message)
  }
})

export default datasets
