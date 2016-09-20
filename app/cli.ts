import * as program from 'commander'
import * as path from 'path'
import { isUndefined, get, merge } from 'lodash'
import { configs } from './configs'
import debug from './debug'
import MBTiles from './MBTiles'

interface InterfaceCLI extends commander.ICommand {
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

const customHelp = () => {
  console.log(`Examples:

    $ node app/cli.js --provider imagery --bounds "[-75.7,45.4,-75.6,45.5]" --min 8 --max 17 tiles.mbtiles
    `)
}

program
  .version(require(path.join(__dirname, '..', 'package.json')).version)
  .usage('[options] <tiles.mbtile>')
  .description('Creates MBTiles from Web Map Tile Service')
  .option('-b, --bounds <Array<number>>', 'bounds extent in [minX, minY, maxX, maxY] order')
  .option('-p, --provider <string>', 'provider tile server')
  .option('--name [string]', 'Name given to MBTiles DB')
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

// Load custom config YAML
const OPTIONS: any = {}

// Load custom bound
if (cli.bounds) {
  const boundsLookup = configs.bounds[cli.bounds.toLocaleLowerCase()]
  if (boundsLookup) {
    OPTIONS.bounds = boundsLookup
  } else {
    try {
      OPTIONS.bounds = JSON.parse(cli.bounds)
    } catch (e) {
      const message = 'CLI Options <bounds> cannot be parsed or indexed.'
      debug.error(message)
      throw new Error(message)
    }
  }
}
// Load custom provider
if (cli.provider) {
  debug.log(configs.providers)
  debug.log(cli.provider)
  const providerLookup = configs.providers[cli.provider.toLowerCase()]
  if (providerLookup) {
    merge(OPTIONS, providerLookup)
  } else {
    const message = `<provider> does not match index.`
    debug.error(message)
    throw new Error(message)
  }
}
// Overwrite Config with user input
['format', 'maxZoom', 'minZoom', 'scheme', 'attribution'].map(item => {
  const value = get(cli, item)
  if (typeof(value) === 'string') { OPTIONS[item] = value
  } else if (!isUndefined(value)) { OPTIONS[item] = value }
})

// Overwrite Exceptions
if (typeof(cli.description) === 'string') { OPTIONS.description = cli.description }
if (typeof(cli.name) === 'string') { OPTIONS.name = cli.name }

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
