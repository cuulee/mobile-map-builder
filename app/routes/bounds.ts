import { Router, Request, Response } from 'express'
import { configs } from '../configs'

const router = Router()

/**
 * CONFIGS
 */
router.route('/')
  .all((req: Request, res: Response) => {
    res.json(configs.bounds)
  })

export default router
