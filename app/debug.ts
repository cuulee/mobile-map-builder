import * as debug from 'debug'

export default {
  build: debug('mmb:build'),
  cli: debug('mmb:cli'),
  download: debug('mmb:download'),
  downloadTile: debug('mmb:downloadTile'),
  error: debug('mmb:error'),
  grid: debug('mmb:grid'),
  index: debug('mmb:index'),
  log: debug('mmb:log'),
  map: debug('mmb:map'),
  metadata: debug('mmb:metadata'),
  save: debug('mmb:save'),
  server: debug('mmb:server'),
  skipped: debug('mmb:skipped'),
  tables: debug('mmb:tables'),
  warning: debug('mmb:warning'),
}
