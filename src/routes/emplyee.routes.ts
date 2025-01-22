import { Router } from 'express'
import { employeeLogin, employeeLogout, employeeProfile, employeeUpdate } from '../controllers/employee.controllers'
import { protect, protectEmployee } from '../middlewares/auth.middleware'

const employeeRouter = Router()

// Authentication Route (No auth middleware here)
employeeRouter.post('/login', employeeLogin)
employeeRouter.get('/logout', employeeLogout)
// Protected Routes (Require employee authentication)
employeeRouter.use(protect, protectEmployee)

// Self Routes
employeeRouter.route('/me').get(employeeProfile).patch(employeeUpdate)

export default employeeRouter
