// Admin Routes

import { Router } from 'express'
import {
    adminLogin,
    adminLogout,
    adminSignup,
    changeCompanyPlan,
    changeCompanyStatus,
    changeEmployeeStatus,
    changeIndividualStatus,
    changePassword,
    createCompany,
    createEmployee,
    deleteCompany,
    deleteEmployee,
    deleteIndividual,
    getCompanies,
    getCompanyById,
    getCompanyEmployeeById,
    getCompanyEmployees,
    getEmployeeById,
    getEmployees,
    getIndividualById,
    getIndividuals,
    getMe,
    updateCompany,
    updateEmployee,
    updateIndividual,
    updateMe
} from '../controllers/admin.controllers'
import { protect, protectAdmin } from '../middlewares/auth.middleware'

// Initialize the router
const adminRouter = Router()

// Authentication Routes (No Middleware Applied)
adminRouter.post('/signup', adminSignup) // Admin signup
adminRouter.post('/login', adminLogin) // Admin login
adminRouter.post('/logout', adminLogout) // Admin logout
adminRouter.patch('/verify-account')
adminRouter.patch('/verify/:token')
adminRouter.patch('/forget-password')
adminRouter.patch('/reset-password/:token')

// Apply authentication and admin protection middleware to all routes below
adminRouter.use(protect, protectAdmin)

// Admin Self Management Routes
adminRouter.get('/me', getMe) // Get admin's own details
adminRouter.patch('/me', updateMe) // Update admin's own profile
adminRouter.patch('/me/change-password', changePassword) // Change admin's password

// Company Management Routes
adminRouter
    .route('/companies')
    .post(createCompany) // Create a new company
    .get(getCompanies) // Get all companies with optional filters and pagination

adminRouter
    .route('/companies/:companyId')
    .get(getCompanyById) // Retrieve a company by its ID
    .patch(updateCompany) // Update company details
    .delete(deleteCompany) // Delete a company

adminRouter.patch('/companies/:companyId/change-plan', changeCompanyPlan) // Change company plan
adminRouter.patch('/companies/:companyId/change-status', changeCompanyStatus) // Block or unblock a company

// Company Employee Management Routes
adminRouter
    .route('/companies/:companyId/employees')
    .get(getCompanyEmployees) // Get all employees of a specific company
    .post(createEmployee) // Add a new employee to a company

adminRouter.get('/companies/:companyId/employees/:employeeId', getCompanyEmployeeById) // Get details of a specific employee in a company

// Global Employee Management Routes
adminRouter.route('/employees').get(getEmployees) // Get all employees (independent of company)

adminRouter
    .route('/employees/:employeeId')
    .get(getEmployeeById) // Retrieve an employee's details by ID
    .patch(updateEmployee) // Update employee details
    .delete(deleteEmployee) // Delete an employee

adminRouter.patch('/employees/:employeeId/change-status', changeEmployeeStatus) // Change employee status (e.g., active/inactive)

// Individual User Management Routes
adminRouter.route('/individuals').get(getIndividuals) // Get all individual users

adminRouter
    .route('/individuals/:individualId')
    .get(getIndividualById) // Retrieve details of a specific individual
    .patch(updateIndividual) // Update individual details
    .delete(deleteIndividual) // Delete an individual user

adminRouter.patch('/individuals/:individualId/change-status', changeIndividualStatus) // Block or unblock an individual user

// Export the configured router for use in the application
export default adminRouter
