// Admin Routes (Recommended Structure)

import { Router } from 'express'
import {
    activateCompany,
    activateEmployee,
    activateIndividual,
    blockCompany,
    blockEmployee,
    blockIndividual,
    createCompany,
    createEmployee,
    deactivateCompany,
    deactivateEmployee,
    deactivateIndividual,
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
    updateCompany,
    updateEmployee,
    updateIndividual
} from '../controllers/admin.controllers'

const adminRouter = Router()

// adminRouter.use(isAdmin); // Apply admin authentication middleware to all routes

// Company Management
adminRouter
    .route('/companies')
    .post(createCompany) // Create a new company
    .get(getCompanies) // Get all companies (or with filters/pagination)

adminRouter
    .route('/companies/:companyId')
    .get(getCompanyById) // Get a specific company by ID
    .patch(updateCompany) // Update a company
    .delete(deleteCompany) // Delete a company

adminRouter.patch('/companies/:companyId/block', blockCompany) // Block a company
adminRouter.patch('/companies/:companyId/activate', activateCompany) // Activate a company
adminRouter.patch('/companies/:companyId/deactivate', deactivateCompany) // Deactivate a company

adminRouter.get('/companies/:companyId/employees', getCompanyEmployees) // Get employees of a company
adminRouter.get('/companies/:companyId/employees/:employeeId', getCompanyEmployeeById) // Get a specific employee of a company

// Employee Management (Independent of Companies)
adminRouter
    .route('/employees')
    .post(createEmployee) // Create a new employee
    .get(getEmployees) // Get all employees

adminRouter
    .route('/employees/:employeeId')
    .get(getEmployeeById) // Get a specific employee
    .patch(updateEmployee) // Update an employee
    .delete(deleteEmployee) // Delete an employee

adminRouter.patch('/employees/:employeeId/block', blockEmployee) // Block an employee
adminRouter.patch('/employees/:employeeId/activate', activateEmployee) // Activate an employee
adminRouter.patch('/employees/:employeeId/deactivate', deactivateEmployee) // Deactivate an employee

// Individual Management
adminRouter.route('/individuals').get(getIndividuals) // Get all individuals

adminRouter
    .route('/individuals/:individualId')
    .get(getIndividualById) // Get a specific individual
    .patch(updateIndividual) // Update an individual
    .delete(deleteIndividual) // Delete an individual

adminRouter.patch('/individuals/:individualId/block', blockIndividual) // Block an individual
adminRouter.patch('/individuals/:individualId/activate', activateIndividual) // Activate an individual
adminRouter.patch('/individuals/:individualId/deactivate', deactivateIndividual) // Deactivate an individual
