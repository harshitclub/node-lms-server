import { Router } from 'express'
import { health, self } from '../controllers/apiController'

const router = Router()

router.get('/self', self)
router.get('/health', health)

export default router
