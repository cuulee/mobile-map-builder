import { Router } from 'express'
import { worker } from 'cluster'

const router = Router()

router.route('/')
  .all((request: any, response: any) => {
    response.json({
      api: 'Data Generator',
      cluster: worker.process.pid,
      http: [
        { method: 'GET', url: '/product' },
        { method: 'GET', url: '/token' },
        { method: 'GET', url: '/user' },
      ],
      message: 'Demonstrates the Data Generator API, yay!!',
      ok: true,
      status: 200,
    })
  })

export default router
