import * as cluster from 'cluster'
import { range } from 'lodash'
import { PORT, SECRET, CORES } from './config'
import debug from './utils/debug'

if (cluster.isMaster) {
  range(CORES).map(() => cluster.fork())

  cluster.on('online', (worker: any) => {
    debug.log(`[${ worker.process.pid }] Web Worker started ${ worker.id }`)
  })
  debug.log(`HTTP [PORT]: ${ PORT }`)
  debug.log(`JWT [SECRET]: ${ SECRET }`)
  debug.log(`CPU [CORES]: ${ CORES }`)

} else { server() }

function server() {
  require('./server')
}
