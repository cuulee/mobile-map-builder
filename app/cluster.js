import cluster from 'cluster'
import { PORT, SECRET, CORES } from './config'

if (cluster.isMaster) {
  // Fork workers.
  for (var i = 0; i < CORES; i++) { cluster.fork() }

  cluster.on('online', (worker) => {
    console.log(`[${ worker.process.pid }] Web Worker started ${ worker.id }`)
  })

  console.log(`HTTP [PORT]: ${ PORT }`)
  console.log(`JWT [SECRET]: ${ SECRET }`)
  console.log(`CPU Cores: ${ CORES }`)

} else {
  require('./server')
}
