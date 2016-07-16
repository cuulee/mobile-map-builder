import { range } from 'lodash'
import cluster from 'cluster'
import { PORT, SECRET, CORES } from './config'

if (cluster.isMaster) {
  // Fork workers.
  range(CORES, 0).map(i => cluster.fork())

  cluster.on('online', (worker) => {
    console.log(`[${ worker.process.pid }] Web Worker started ${ worker.id }`)
  })
  console.log(`HTTP [PORT]: ${ PORT }`)
  console.log(`JWT [SECRET]: ${ SECRET }`)
  console.log(`CPU Cores: ${ CORES }`)

} else { require('./server') }
