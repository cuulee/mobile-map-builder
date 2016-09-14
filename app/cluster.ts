import * as cluster from 'cluster'
import { range } from 'lodash'
import { PORT, SECRET, CORES } from './configs'
import debug from './debug'

if (cluster.isMaster) {
  range(CORES).map(() => cluster.fork())

  cluster.on('online', (worker: any) => {
    debug.server(`[${ worker.process.pid }] Web Worker started ${ worker.id }`)
  })
  debug.server(`HTTP [PORT]: ${ PORT }`)
  debug.server(`JWT [SECRET]: ${ SECRET }`)
  debug.server(`CPU [CORES]: ${ CORES }`)

} else { server() }

function server() {
  require('./server')
}
