import * as program from 'commander'
import * as fs from 'fs'
import * as yaml from 'js-yaml'
import { isUndefined, get, set, keys, merge } from 'lodash'
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
async function main() {
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
    .option('--type [String]', 'Type given to MBTiles DB')
    .on('--help', customHelp)

  // Parse Program
  const cli: InterfaceCLI = program.parse(process.argv)

  // Validation of CLI options & arguments
  if (!cli.args.length) {
    cli.help()
  }

  // Load File Path configurations
  const OPTIONS: any = {}
  if (cli.config) {
    pathExists(cli.config)
    merge(OPTIONS, yaml.safeLoad(fs.readFileSync(cli.config, 'utf8')))
  }
  if (cli.provider) {
    pathExists(cli.provider)
    merge(OPTIONS, yaml.safeLoad(fs.readFileSync(cli.provider, 'utf8')))
  }
  if (cli.bounds) {
    if (fs.existsSync(cli.bounds)) {
      merge(OPTIONS, yaml.safeLoad(fs.readFileSync(cli.bounds, 'utf8')))
    } else { OPTIONS.bounds = JSON.parse(cli.bounds)}
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
  debug.cli(OPTIONS)
  const output = cli.args[0]
  const mbtiles = new MBTiles(output)
  mbtiles.save(OPTIONS)
}

/* istanbul ignore next */
if (require.main === module) {
  main()
}
