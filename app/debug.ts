import * as debug from 'debug'

export default {
  build: debug('dataGen:build'),
  cli: debug('dataGen:cli'),
  download: debug('dataGen:download'),
  downloadTile: debug('dataGen:downloadTile'),
  error: debug('dataGen:error'),
  grid: debug('dataGen:grid'),
  index: debug('dataGen:index'),
  log: debug('dataGen:log'),
  map: debug('dataGen:map'),
  metadata: debug('dataGen:metadata'),
  save: debug('dataGen:save'),
  skipped: debug('dataGen:skipped'),
  tables: debug('dataGen:tables'),
  warning: debug('dataGen:warning'),
}
