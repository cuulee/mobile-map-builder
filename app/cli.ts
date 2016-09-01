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
    .description('Creates MBTiles from Web Map Tile Service')
    .option('--config <File Path>', 'Config YML file to load CLI Options')
    .option('--provider <File Path>', 'Proivder YML file to load CLI Options')
    .option('--attribution [String]', 'Attribution given to MBTiles DB')
    .option('--bounds <File Path>', 'Bounds given to MBTiles DB')
    .option('--description [String]', 'Description given to MBTiles DB')
    .option('--format [String]', 'Tile image format [png/jpg]')
    .option('--maxZoom [Integer]', 'Maximum Zoom Level', value => JSON.parse(value))
    .option('--minZoom [Integer]', 'Minimum Zoom Level', value => JSON.parse(value))
    .option('--name [String]', 'Name given to MBTiles DB')
    .option('--scheme [String]', 'Scheme given to MBTiles DB')
    .on('--help', customHelp)

  // Parse Program
  const cli: InterfaceCLI = program.parse(process.argv)

  // Validation of CLI options & arguments
  if (!cli.args.length) {
    cli.help()
  }

  // Load providers & bounds YAML indexes
  const providers: any = yaml.safeLoad(fs.readFileSync(`${ __dirname }/configs/providers.yml`, 'utf8'))
  const bounds: any = yaml.safeLoad(fs.readFileSync(`${ __dirname }/configs/bounds.yml`, 'utf8'))

  // Load custom config YAML
  const OPTIONS: any = {}
  if (cli.config) {
    pathExists(cli.config)
    merge(OPTIONS, yaml.safeLoad(fs.readFileSync(cli.config, 'utf8')))
  }

  // Load custom providers & bounds from indexes
  if (cli.bounds) {
    if (bounds[cli.bounds]) {
      set(OPTIONS, 'bounds', bounds[cli.bounds])
    } else { set(OPTIONS, 'bounds', cli.bounds) }
  }
  if (cli.provider) {
    if (providers[cli.provider]) {
      merge(OPTIONS, providers[cli.provider])
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
  const output = cli.args[0]
  const mbtiles = new MBTiles(output)
  mbtiles.save(OPTIONS)
}

/* istanbul ignore next */
if (require.main === module) {
  main()
}
