import * as program from 'commander'
import * as fs from 'fs'
import * as yaml from 'js-yaml'
import { isUndefined, get, set, merge } from 'lodash'
import debug from './debug'
import MBTiles from './MBTiles'

interface InterfaceCLI extends commander.ICommand {
  config?: string
  format?: string
  maxZoom?: number
  minZoom?: number
  nameDB?: string
  scheme?: string
  descriptionDB?: string
  bounds?: string
  provider?: string
  attribution?: string
}

interface InterfaceCLIOptions {
  name: string
  maxZoom: number
  minZoom: number
  scheme: string
  description: string
  bounds: number[]
  attribution: string
  format: string
}

const pathExists = (path: string) => {
  if (!fs.existsSync(path)) {
    const message = `Path does not exist [${ path }]`
    debug.error(message)
    throw new Error(message)
  }
  return true
}

const customHelp = () => {
  console.log(`Examples:

    $ node app/cli.js [OPTIONS] --config config.yml tiles.mbtiles
    `)
}
function main() {
  program
    .version('1.0.0')
    .usage('[options] <tiles.mbtile>')
    .description('Creates MBTiles from Web Map Tile Service')
    .option('--config <File Path>', 'Config YML file to load CLI Options')
    .option('--name [string]', 'Name given to MBTiles DB')
    .option('-b, --bounds <File Path>', 'Bounds given to MBTiles DB')
    .option('-p, --provider <File Path>', 'Proivder YML file to load CLI Options')
    .option('--max, --maxZoom [number]', 'Maximum Zoom Level', value => JSON.parse(value))
    .option('--min, --minZoom [number]', 'Minimum Zoom Level', value => JSON.parse(value))
    .option('--scheme [string]', 'Scheme given to MBTiles DB')
    .option('--attribution [string]', 'Attribution given to MBTiles DB')
    .option('--description [string]', 'Description given to MBTiles DB')
    .option('--format [string]', 'Tile image format [png/jpg]')
    .option('--type [string]', 'Type of MBTiles layer [baselayer/overlay]')
    .on('--help', customHelp)

  // Parse Program
  const cli: InterfaceCLI = program.parse(process.argv)

  // User input for MBTile file path
  let output = ''
  if (!cli.args.length) {
    const message = 'Default CLI Arguments <tiles.mbtiles> will be used.'
    debug.warning(message)
    output = 'tiles.mbtiles'
  } else { output = cli.args[0] }

  // Load providers & bounds YAML indexes
  const providers: any = yaml.safeLoad(fs.readFileSync(`${ __dirname }/../configs/providers.yml`, 'utf8'))
  const bounds: any = yaml.safeLoad(fs.readFileSync(`${ __dirname }/../configs/bounds.yml`, 'utf8'))

  // Load custom config YAML
  const OPTIONS: any = {}
  if (cli.config) {
    pathExists(cli.config)
    merge(OPTIONS, yaml.safeLoad(fs.readFileSync(cli.config, 'utf8')))
  }

  // Load custom providers & bounds from indexes
  if (cli.bounds) {
    const lookupBounds = bounds[cli.bounds.toLocaleLowerCase()]
    if (lookupBounds) {
      set(OPTIONS, 'bounds', lookupBounds)
    } else {
      try {
        set(OPTIONS, 'bounds', JSON.parse(cli.bounds))
      } catch (e) {
        const message = 'CLI Options <bounds> cannot be parsed or indexed.'
        debug.error(message)
        throw new Error(message)
      }
    }
  }
  if (cli.provider) {
    const lookupProvider = providers[cli.provider.toLowerCase()]
    if (lookupProvider) {
      merge(OPTIONS, lookupProvider)
    } else {
      const message = `<provider> does not match index.`
      debug.error(message)
      throw new Error(message)
    }
  }
  // Overwrite Config with user input
  ['format', 'maxZoom', 'minZoom', 'scheme', 'attribution'].map(item => {
    const value = get(cli, item)
    if (typeof(value) === 'string') { set(OPTIONS, item, value)
    } else if (!isUndefined(value)) { set(OPTIONS, item, value) }
  })

  // Overwrite Exceptions
  if (typeof(cli.description) === 'string') { set(OPTIONS, 'description', cli.description) }
  if (typeof(cli.name) === 'string') { set(OPTIONS, 'name', cli.name) }

  // Create MBTiles
  if (isUndefined(OPTIONS.name)) {
    const message = 'CLI Options <name> must be included.'
    debug.error(message)
    throw new Error(message)
  } else if (isUndefined(OPTIONS.bounds)) {
    const message = 'CLI Options <bounds> must be included.'
    debug.error(message)
    throw new Error(message)
  } else if (isUndefined(OPTIONS.minZoom)) {
    const message = 'CLI Options <minZoom> must be included.'
    debug.error(message)
    throw new Error(message)
  } else if (isUndefined(OPTIONS.maxZoom)) {
    const message = 'CLI Options <maxZoom> must be included.'
    debug.error(message)
    throw new Error(message)
  } else if (isUndefined(OPTIONS.scheme)) {
    const message = 'CLI Options <scheme> must be included.'
    debug.error(message)
    throw new Error(message)
  }
  debug.cli(OPTIONS)
  const mbtiles = new MBTiles(output)
  mbtiles.save(OPTIONS)
}

/* istanbul ignore next */
if (require.main === module) {
  main()
}
