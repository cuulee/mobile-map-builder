import cluster from 'cluster'
import { PORT, SECRET, CORES } from './config'

if (cluster.isMaster) {
  // Fork workers.
  for (var i = 0; i < CORES; i++) { cluster.fork() }
    cluster.fork()
  }

  Object.keys(cluster.workers).map((id) => {
    console.log(`[${ cluster.workers[id].process.pid }] Web Worker started ${ id }`)
  })

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${ worker.process.pid } died`)
  })

  console.log(`HTTP [PORT]: ${ PORT }`)
  console.log(`JWT [SECRET]: ${ SECRET }`)
  console.log(`CPU Cores: ${ CORES }`)

} else {
  require('./app')
}
