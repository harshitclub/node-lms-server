import { Router } from 'express'
import {
    getProfile,
    individualChangePassword,
    individualLogin,
    individualLogout,
    individualSignup,
    updateIndividual
} from '../controllers/individual.controller'
import { protect } from '../middlewares/auth.middleware'

const individualRouter = Router()

// Authentication Route (No auth middleware here)
individualRouter.post('/signup', individualSignup)
individualRouter.post('/login', individualLogin)
individualRouter.get('/logout', individualLogout)

individualRouter.use(protect)
individualRouter.route('/me').get(getProfile).patch(updateIndividual)
individualRouter.patch('/change-password', individualChangePassword)

export default individualRouter
