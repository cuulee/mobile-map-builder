import { Router } from 'express'
import { worker } from 'cluster'

const router = Router()

router.route('/')
  .all((request:any, response:any) => {
    response.json({
      api: 'Data Generator',
      ok: true,
      cluster: worker.process.pid,
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
