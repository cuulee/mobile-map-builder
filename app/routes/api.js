import express from 'express'

const router = express.Router()

router.route('/')
  .all((request, response) => {
    response.json({
      api: 'Data Generator',
      ok: true,
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
