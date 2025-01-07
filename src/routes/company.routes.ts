import { Router } from 'express'
import {
    createEmployee,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
    blockEmployee,
    activateEmployee,
    deactivateEmployee,
    sendInvitation,
    verifyInvitation,
    companySignup,
    companyLogin,
    companyLogout,
    getCompanyProfile,
    updateCompanyProfile,
    changePassword
} from '../controllers/company.controllers'

const companyRouter = Router()

// Company Authentication Routes (No auth middleware needed here)
companyRouter.post('/signup', companySignup)
companyRouter.post('/login', companyLogin)
companyRouter.post('/logout', companyLogout) // Protect logout

// companyRouter.use(isCompanyAdmin);

// Company Admin Self Routes
companyRouter.get('/profile', getCompanyProfile)
companyRouter.patch('/profile', updateCompanyProfile)
companyRouter.patch('/profile/change-password', changePassword)

// Company Employee Management
companyRouter
    .route('/employees')
    .post(createEmployee) // Create a new employee within the company
    .get(getEmployees) // Get all employees of the company (with optional filters/pagination)

companyRouter
    .route('/employees/:employeeId')
    .get(getEmployeeById) // Get a specific employee of the company
    .patch(updateEmployee) // Update an employee of the company
    .delete(deleteEmployee) // Delete an employee of the company

companyRouter.patch('/employees/:employeeId/block', blockEmployee) // Block an employee of the company
companyRouter.patch('/employees/:employeeId/activate', activateEmployee) // Activate an employee of the company
companyRouter.patch('/employees/:employeeId/deactivate', deactivateEmployee) // Deactivate an employee of the company

// Invitations (For inviting new employees)
companyRouter.post('/invitations', sendInvitation) // Send an invitation to a new employee
companyRouter.get('/invitations/:invitationToken', verifyInvitation) // Verify invitation and redirect to signup
