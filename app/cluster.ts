import * as cluster from 'cluster'
import { range } from 'lodash'
import { PORT, SECRET, CORES } from './config'

if (cluster.isMaster) {
  range(CORES).map(() => cluster.fork())

  cluster.on('online', (worker:any) => {
    console.log(`[${ worker.process.pid }] Web Worker started ${ worker.id }`)
  })
  console.log(`HTTP [PORT]: ${ PORT }`)
  console.log(`JWT [SECRET]: ${ SECRET }`)
  console.log(`CPU [CORES]: ${ CORES }`)

} else { require('./server') }
