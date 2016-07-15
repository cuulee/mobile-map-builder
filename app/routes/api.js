import express from 'express'
import cluster from 'cluster'

const router = express.Router()

router.route('/')
  .all((request, response) => {
    response.json({
      api: 'Data Generator',
      ok: true,
      cluster: cluster.worker.process.pid,
      status: 200,
      message: 'Demonstrates the Data Generator API, yay!!',
      http: [
        { url: '/product', method: 'GET'},
        { url: '/token', method: 'GET'},
        { url: '/user', method: 'GET'}
      ]
    })
  })

export default router
