import * as program from 'commander'
import * as fs from 'fs'
import * as yaml from 'js-yaml'
import { isUndefined, get, set } from 'lodash'
import debug from './utils/debug'

interface InterfaceCLI extends commander.ICommand {
  config?: string
  format?: string
  maxZoom?: number
  minZoom?: number
  nameDB?: string
  scheme?: string
  descriptionDB?: string
  center?: number[]
  bounds?: number[]
  attribution?: string
  type?: string
}

const pathExists = (path: string) => {
  if (fs.exists(path)) {
    const message = `Path does not exist [${ path }]`
    debug.error(message)
    throw new Error(message)
  }
  return true
}

const customHelp = () => {
  console.log(`Examples:

    $ node app/cli.js [options] --config config.yml tiles.mbtiles
    `)
}
function main() {
  program
    .version('1.0.0')
    .description('Creates MBTiles from Web Map Tile Service')
    .option('--config <File Path>', '[REQUIRED] Config File to load CLI Options')
    .option('--attribution [String]', 'Attribution given to MBTiles DB')
    .option('--bounds <Array>', 'Bounds given to MBTiles DB', value => JSON.parse(value))
    .option('--center <Array>', 'Center given to MBTiles DB', value => JSON.parse(value))
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
  if (!cli.config) {
    const message = '--config is required'
    debug.error(message)
    throw new Error(message)
  }

  // Validate Config
  pathExists(cli.config)
  const config = yaml.safeLoad(fs.readFileSync(cli.config, 'utf8'))

  // Overwrite Config with options
  const options = ['format', 'maxZoom', 'minZoom', 'scheme', 'attribution', 'bounds', 'center']
  options.map(item => {
    const value = get(cli, item)
    if (typeof(value) === 'string') { config[item] = value
    } else if (!isUndefined(value)) { config[item] = value }
  })

  // Overwrite Exceptions
  if (typeof(cli.description) === 'string') { config.description = cli.description }
  if (typeof(cli.name) === 'string') { config.name = cli.name }

  debug.log(cli.args[0])
  debug.cli(config)
}

/* istanbul ignore next */
if (require.main === module) {
  main()
}
