import * as os from 'os'
import * as uuid from 'node-uuid'
import * as fs from 'fs'
import * as yml from 'js-yaml'
import * as validator from 'validator'
import debug from '../app/debug'
import { keys } from 'lodash'
import * as rp from 'request-promise'

//////////////////////////////////////
// Loading Configurations
//////////////////////////////////////

interface InterfaceConfigs {
  bounds: any
  datasets: any
  providers: any
  server: any
}

const loadConfigs = () => {
  const configs: InterfaceConfigs = {
    bounds: {},
    datasets: {},
    providers: {},
    server: {},
  }

  // DATASETS
  if (fs.existsSync(`${ __dirname }/../configs/datasets.yml`)) {
    configs.datasets = yml.safeLoad(fs.readFileSync(`${ __dirname }/../configs/datasets.yml`, { encoding: 'utf-8' }))
    debug.configs('[OK] loaded <configs/datasets.yml>')

  } else if (fs.existsSync(`${ __dirname }/../configs/datasets-example.yml`)) {
    configs.datasets = yml.safeLoad(fs.readFileSync(`${ __dirname }/../configs/datasets-example.yml`, { encoding: 'utf-8' }))
    debug.warning('Configs must be renamed from <configs/datasets-example.yml> to <configs/datasets.yml>')
    debug.configs('[OK] loaded <configs/datasets-example.yml>')

  } else {
    const message = 'Missing datasets configs <configs/datasets.yml>'
    debug.error(message)
    throw new Error(message)
  }

  // SERVER
  if (fs.existsSync(`${ __dirname }/../configs/server.yml`)) {
    configs.server = yml.safeLoad(fs.readFileSync(`${ __dirname }/../configs/server.yml`, { encoding: 'utf-8' }))
    debug.configs('[OK] loaded <configs/server.yml>')

  } else if (fs.existsSync(`${ __dirname }/../configs/server-example.yml`)) {
    configs.server = yml.safeLoad(fs.readFileSync(`${ __dirname }/../configs/server-example.yml`, { encoding: 'utf-8' }))
    debug.warning('Configs must be renamed from <configs/server-example.yml> to <configs/server.yml>')
    debug.configs('[OK] loaded <configs/server-example.yml>')

  } else {
    const message = 'Missing server configs <configs/server.yml>'
    debug.error(message)
    throw new Error(message)
  }

  // PROVIDERS
  if (fs.existsSync(`${ __dirname }/../configs/providers.yml`)) {
    configs.providers = yml.safeLoad(fs.readFileSync(`${ __dirname }/../configs/providers.yml`, { encoding: 'utf-8' }))
    debug.configs('[OK] loaded <configs/providers.yml>')

  } else if (fs.existsSync(`${ __dirname }/../configs/providers-example.yml`)) {
    configs.providers = yml.safeLoad(fs.readFileSync(`${ __dirname }/../configs/providers-example.yml`, { encoding: 'utf-8' }))
    debug.warning('Configs must be renamed from <configs/providers-example.yml> to <configs/providers.yml>')
    debug.configs('[OK] loaded <configs/providers-example.yml>')

  } else {
    const message = 'Missing providers configs <configs/providers.yml>'
    debug.error(message)
    throw new Error(message)
  }

  // BOUNDS
  if (fs.existsSync(`${ __dirname }/../configs/bounds.yml`)) {
    configs.bounds = yml.safeLoad(fs.readFileSync(`${ __dirname }/../configs/bounds.yml`, { encoding: 'utf-8' }))
    debug.configs('[OK] loaded <configs/bounds.yml>')

  } else if (fs.existsSync(`${ __dirname }/../configs/bounds-example.yml`)) {
    configs.bounds = yml.safeLoad(fs.readFileSync(`${ __dirname }/../configs/bounds-example.yml`, { encoding: 'utf-8' }))
    debug.warning('Configs must be renamed from <configs/bounds-example.yml> to <configs/bounds.yml>')
    debug.configs('[OK] loaded <configs/bounds-example.yml>')

  } else {
    const message = 'Missing bounds configs <configs/bounds.yml>'
    debug.error(message)
    throw new Error(message)
  }
  return configs
}

//////////////////////////////////////
// Download Datasets
//////////////////////////////////////

export const downloadDatasets = () => {
  const datasets: any = {}
  keys(configs.datasets).map(key => {
    // Download from URL
    if (validator.isURL(configs.datasets[key], { require_host: true, require_protocol: true })) {
      debug.download(configs.datasets[key])
      rp.get(configs.datasets[key]).then(
        data => {
          datasets[key] = JSON.parse(data)
          debug.server(`[OK] URL dataset: ${ key }`)
        })

    // Require file from File Path (Must be JSON)
    } else if (configs.datasets[key].match(/\.(json|geojson)$/)) {
      if (!fs.existsSync(configs.datasets[key])) {
        const message = 'File Path does not exists'
        debug.error(message)
        throw new Error(message)
      }
      datasets[key] = JSON.parse(fs.readFileSync(configs.datasets[key], { encoding: 'utf-8' }))
      debug.server(`[OK] File dataset: ${ key }`)

    // Catching errors
    } else {
      const message = 'File must be URL or (.json|.geojson) file'
      debug.error(message)
      throw new Error(message)
    }
  })
  return datasets
}
export const configs = loadConfigs()
export const PORT = (process.env.PORT) ? process.env.PORT : (configs.server.PORT) ? configs.server.PORT : 5000
export const SECRET = (process.env.SECRET) ? process.env.SECRET : (configs.server.SECRET) ? configs.server.SECRET : uuid.v4()
export const CORES = (process.env.CORES) ? process.env.CORES : (configs.server.CORES) ? configs.server.CORES : os.cpus().length
