import { PrismaClient } from '@prisma/client'
import { Request, Response, NextFunction } from 'express'
import {
    adminChangeCompanyPlan,
    adminChangeStatus,
    adminChangePasswordSchema,
    adminLoginSchema,
    adminSignupSchema,
    adminUpdateSchema,
    adminCreateCompany,
    adminIndividualUpdateSchema
} from '../validator/admin.validator'
import { z } from 'zod'
import httpResponse from '../utils/httpResponse'
import httpError from '../utils/httpError'
import { hashPassword } from '../utils/password/hashPassword'
import apiMessages from '../constants/apiMessages'
import comparePassword from '../utils/password/comparePassword'
import { UserPayload } from '../types/tokens.type'
import { generateTokens } from '../utils/tokens/tokens'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { companyEmployeeUpdateSchema, companyUpdateSchema } from '../validator/company.validator'
import logger from '../utils/logger'
import generateShortId from '../utils/uIds'
import { employeeSignupSchema } from '../validator/employee.validator'
import sendInvitationMail from '../services/emails/company/sendInvitation'
// import config from '../configs/config'
const prisma = new PrismaClient()

// Admin Authentication Controllers
export const adminSignup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Validate and parse request body
        const { fullName, email, phone, password } = await adminSignupSchema.parseAsync(req.body)

        // Check if admin already exists
        const existingAdmin = await prisma.admin.findUnique({
            where: { email }
        })
        if (existingAdmin) {
            return httpResponse(req, res, 400, apiMessages.auth.emailAlreadyInUse)
        }
        const hashedPassword = await hashPassword(password)
        // Create a new admin
        const newAdmin = await prisma.admin.create({
            data: {
                fullName,
                email,
                phone,
                password: hashedPassword
            }
        })

        // Structure the response data
        const adminData = {
            id: newAdmin.id,
            fullName: newAdmin.fullName,
            email: newAdmin.email,
            phone: newAdmin.phone,
            createdAt: newAdmin.createdAt,
            updatedAt: newAdmin.updatedAt
        }

        // Use httpResponse for consistent success responses
        return httpResponse(req, res, 201, apiMessages.admin.adminCreated, adminData)
    } catch (error) {
        // Handle validation errors
        if (error instanceof z.ZodError) {
            return httpResponse(req, res, 400, 'Validation Error', { errors: error.errors })
        }

        // Handle other errors using httpError
        return httpError(next, error, req, 500)
    }
}
export const adminLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, password } = await adminLoginSchema.parseAsync(req.body)

        // Check if admin exists
        const admin = await prisma.admin.findUnique({
            where: {
                email
            }
        })

        if (!admin) {
            return httpResponse(req, res, 404, apiMessages.admin.adminNotFound)
        }

        // check password
        const isPasswordCorrect = await comparePassword(password, admin.password)

        if (!isPasswordCorrect) {
            return httpResponse(req, res, 401, apiMessages.auth.wrongCredentials)
        }

        const payload: UserPayload = {
            id: admin.id,
            role: admin.role,
            accountType: admin.accountType
        }
        const { refreshToken, accessToken } = generateTokens(payload)
        // Set refresh token as HTTP-only cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            // secure: config.ENV === 'production',
            sameSite: 'strict', // recommended for security
            path: '/',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds (or from env)
        })

        return httpResponse(req, res, 200, apiMessages.success.loggedIn, {
            admin: {
                id: admin.id,
                fullName: admin.fullName,
                email: admin.email,
                phone: admin.phone,
                address: admin.address,
                accountType: admin.accountType,
                role: admin.role,
                status: admin.status,
                isVerified: admin.isVerified,
                userAgent: admin.userAgent,
                createdAt: admin.createdAt,
                token: accessToken
            }
        })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return httpResponse(req, res, 400, apiMessages.error.validationError, { errors: error.errors })
        }
        // Handle other errors using httpError
        return httpError(next, error, req, 500)
    }
}
export const adminLogout = (req: Request, res: Response, next: NextFunction): void => {
    try {
        res.clearCookie('refreshToken', {
            httpOnly: true, // Important: must match cookie options from setting
            // secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict', // Important: must match cookie options from setting
            path: '/' // If your cookie had a path set, include it here
        })

        return httpResponse(req, res, 200, apiMessages.success.loggedOut, { data: [] })
    } catch (error) {
        // Handle other errors using httpError
        return httpError(next, error, req, 500)
    }
}

// Admin Self Routes (Profile Management)
export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Ensure user object exists on request (check for authentication middleware)
        if (!req.user) {
            res.status(401).json({ message: apiMessages.error.unauthorized }) // Use clear unauthorized message
        }

        const { id } = req.user as UserPayload // Destructure user ID for clarity

        // Perform efficient user retrieval with type safety using `findUniqueOrThrow`
        const user = await prisma.admin.findUnique({
            where: { id },
            select: {
                fullName: true,
                email: true,
                phone: true,
                address: true,
                accountType: true,
                role: true,
                status: true,
                isVerified: true,
                lastLogin: true,
                createdAt: true
            } // Explicitly select only the required field
        })

        return httpResponse(req, res, 200, apiMessages.success.fetched, user)
    } catch (error) {
        if (error instanceof PrismaClientKnownRequestError) {
            // Handle known Prisma errors (e.g., not found)
            if (error.code === 'P2025') {
                // Handle specific 'not found' error code
                res.status(404).json({ message: apiMessages.admin.adminNotFound }) // Clear "not found" message
            } else {
                // Handle other Prisma errors (e.g., database connection issues)
                console.error('Prisma error:', error)
                return httpError(next, error, req, 500) // Use existing error handler
            }
        } else if (error instanceof z.ZodError) {
            // Handle validation errors with httpResponse
            return httpResponse(req, res, 400, apiMessages.error.validationError, { errors: error.errors })
        } else {
            // Handle unexpected errors using httpError
            return httpError(next, error, req, 500)
        }
    }
}

export const updateMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Ensure user object exists on request (check for authentication middleware)
        if (!req.user) {
            res.status(401).json({ message: apiMessages.error.unauthorized }) // Use clear unauthorized message
        }
        const { id } = req.user as UserPayload // Destructure user ID for clarity

        const adminData = await adminUpdateSchema.parseAsync(req.body)
        const updatedAdmin = await prisma.admin.update({
            where: { id: id },
            data: adminData
        })

        return httpResponse(req, res, 200, apiMessages.success.updated, updatedAdmin)
    } catch (error) {
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
            res.status(404).json({ message: apiMessages.admin.adminNotFound }) // Handle not found
        } else if (error instanceof z.ZodError) {
            return httpResponse(req, res, 400, apiMessages.error.validationError, { errors: error.errors }) // Zod validation errors
        }
        return httpError(next, error, req, 500)
    }
}

export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Ensure user object exists on request (check for authentication middleware)
        if (!req.user) {
            res.status(401).json({ message: apiMessages.error.unauthorized }) // Use clear unauthorized message
        }
        const { id } = req.user as UserPayload // Destructure user ID for clarity
        const { oldPassword, newPassword } = await adminChangePasswordSchema.parseAsync(req.body)

        const admin = await prisma.admin.findUnique({
            where: { id }
        })

        if (!admin) {
            return httpResponse(req, res, 404, apiMessages.admin.adminNotFound)
        }

        // check password
        const isPasswordCorrect = await comparePassword(oldPassword, admin.password)

        if (!isPasswordCorrect) {
            return httpResponse(req, res, 401, apiMessages.auth.wrongCredentials)
        }

        const hashedPassword = await hashPassword(newPassword)

        // Update password using updateMany (if applicable)
        await prisma.admin.updateMany({
            where: { id },
            data: { password: hashedPassword } // Update only the password field
        })

        return httpResponse(req, res, 200, apiMessages.success.passwordChanged)
    } catch (error) {
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
            res.status(404).json({ message: apiMessages.admin.adminNotFound }) // Handle not found
        } else if (error instanceof z.ZodError) {
            return httpResponse(req, res, 400, apiMessages.error.validationError, { errors: error.errors }) // Zod validation errors
        }
        return httpError(next, error, req, 500)
    }
}

// Company Management

/** Create a new company. */
export const createCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { fullName, email, phone, password, industry, username, description, plan, maxEmployees } = await adminCreateCompany.parseAsync(
            req.body
        )

        // Check if comapny already exists
        const company = await prisma.admin.findUnique({
            where: { email }
        })

        if (company) {
            return httpResponse(req, res, 400, apiMessages.auth.emailAlreadyInUse)
        }

        const hashedPassword = await hashPassword(password)
        const compId = generateShortId()

        const newCompany = await prisma.company.create({
            data: {
                fullName,
                email,
                phone,
                companyId: compId,
                password: hashedPassword,
                industry,
                username,
                description,
                plan,
                maxEmployees
            }
        })

        await sendInvitationMail({ fullName, email, password })

        return httpResponse(req, res, 201, apiMessages.company.companyCreated, { data: newCompany })
    } catch (error) {
        // Handle validation errors
        if (error instanceof z.ZodError) {
            return httpResponse(req, res, 400, 'Validation Error', { errors: error.errors })
        }

        // Handle other errors using httpError
        return httpError(next, error, req, 500)
    }
}

/** Get all companies (with optional filters/pagination). */
export const getCompanies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const companies = await prisma.company.findMany({
            select: {
                fullName: true,
                email: true,
                phone: true,
                username: true,
                companyId: true,
                plan: true,
                maxEmployees: true,
                accountType: true,
                role: true,
                status: true,
                isVerified: true
            }
        })

        // Check if companies exist before sending a response
        if (!companies.length) {
            return httpResponse(req, res, 200, apiMessages.admin.noCompaniesFound, { data: [] })
        }

        return httpResponse(req, res, 200, apiMessages.admin.companiesFound, companies)
    } catch (error) {
        return httpError(next, error, req)
    }
}

/** Get a specific company by ID. */
export const getCompanyById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { companyId } = req.params

        if (!companyId) {
            httpResponse(req, res, 400, apiMessages.error.invalidInput)
        }

        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                username: true,
                companyId: true,
                plan: true,
                maxEmployees: true,
                accountType: true,
                role: true,
                status: true,
                isVerified: true
            }
        })

        if (!company) {
            httpResponse(req, res, 404, apiMessages.admin.noCompanyFound)
        }

        return httpResponse(req, res, 200, apiMessages.admin.companyFound, company)
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}

/** Update a company. */
export const updateCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { companyId } = req.params

        if (!companyId) {
            httpResponse(req, res, 400, apiMessages.error.invalidInput)
        }
        const companyData = await companyUpdateSchema.parseAsync(req.body)

        const updatedCompany = await prisma.company.update({
            where: { id: companyId },
            data: companyData
        })

        return httpResponse(req, res, 200, apiMessages.success.updated, updatedCompany)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return httpResponse(req, res, 400, apiMessages.error.validationError, { errors: error.errors }) // Zod validation errors
        }
        return httpError(next, error, req, 500)
    }
}

/** Delete a company. */
export const deleteCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract company ID from request parameters
        const { companyId } = req.params

        // Validate company ID presence
        if (!companyId) {
            return httpResponse(req, res, 400, apiMessages.error.invalidInput) // Handle missing ID
        }

        // Delete the company using Prisma
        await prisma.company.delete({ where: { id: companyId } })

        // Send success response
        return httpResponse(req, res, 200, apiMessages.company.companyDeleted)
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}

/** Block a company. */
export const changeCompanyStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { companyId } = req.params

        if (!companyId) {
            return httpResponse(req, res, 400, apiMessages.error.invalidInput)
        }
        const { status } = await adminChangeStatus.parseAsync(req.body)
        const updatedCompany = await prisma.company.update({
            where: { id: companyId },
            data: { status: status }
        })
        if (!updatedCompany) {
            return httpResponse(req, res, 404, apiMessages.company.companyNotFound)
        }

        let responseMessage: string

        if (updatedCompany.status === 'BLOCKED') {
            responseMessage = apiMessages.company.companyBlock // Assignment (=), not comparison (===)
        } else if (updatedCompany.status === 'ACTIVE') {
            responseMessage = apiMessages.company.companyActive // Assignment (=)
        } else if (updatedCompany.status === 'INACTIVE') {
            responseMessage = apiMessages.company.companyInactive // Assignment (=)
        } else {
            responseMessage = apiMessages.company.companyUpdated // Default message
        }
        return httpResponse(req, res, 200, responseMessage)
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}

/** change company plan. */
export const changeCompanyPlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { companyId } = req.params

        if (!companyId) {
            return httpResponse(req, res, 400, apiMessages.error.invalidInput)
        }
        const { plan, maxEmployees } = await adminChangeCompanyPlan.parseAsync(req.body)

        await prisma.company.update({
            where: { id: companyId },
            data: {
                plan,
                maxEmployees
            }
        })

        return httpResponse(req, res, 200, apiMessages.company.companyPlanChange)
    } catch (error) {
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
            return httpResponse(req, res, 404, apiMessages.company.companyNotFound)
        } else if (error instanceof z.ZodError) {
            return httpResponse(req, res, 400, apiMessages.error.validationError, { errors: error.errors })
        }
        return httpError(next, error, req, 500)
    }
}

/** Get employees of a specific company. */
export const getCompanyEmployees = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { companyId } = req.params

        if (!companyId) {
            return httpResponse(req, res, 400, apiMessages.error.invalidInput)
        }

        const employees = await prisma.employee.findMany({
            where: { companyId: companyId }
        })

        if (!employees) {
            return httpResponse(req, res, 404, apiMessages.employee.employeesNotFound)
        }

        return httpResponse(req, res, 200, apiMessages.employee.employeesFound, employees)
    } catch (error) {
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
            return httpResponse(req, res, 404, apiMessages.company.companyNotFound)
        }
        return httpError(next, error, req, 500)
    }
}

/** Get a specific employee of a specific company. */
export const getCompanyEmployeeById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { companyId, employeeId } = req.params

        if (!companyId && !employeeId) {
            return httpResponse(req, res, 400, apiMessages.error.invalidInput)
        }

        const employee = await prisma.employee.findUnique({
            where: {
                companyId,
                id: employeeId
            }
        })

        if (!employee) {
            return httpResponse(req, res, 404, apiMessages.employee.employeeNotFound)
        }

        return httpResponse(req, res, 200, apiMessages.employee.employeeFound, employee)
    } catch (error) {
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
            return httpResponse(req, res, 404, apiMessages.company.companyNotFound)
        }
        return httpError(next, error, req, 500)
    }
}

// Employee Management (Independent)

/** Create a new employee. */
export const createEmployee = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { companyId } = req.params
        const employeeData = await employeeSignupSchema.parseAsync(req.body)

        // Check if the company exists
        const company = await prisma.company.findUnique({ where: { id: companyId } })
        if (!company) {
            return httpResponse(req, res, 404, apiMessages.company.companyNotFound)
        }

        // Hash the password
        const hashedPassword = await hashPassword(employeeData.password)

        // Create the employee
        const employee = await prisma.employee.create({
            data: {
                ...employeeData,
                password: hashedPassword,
                companyId: company.id
            }
        })

        return httpResponse(req, res, 202, apiMessages.employee.employeeCreated, {
            data: employee
        })
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}

/** Get all employees. */
export const getEmployees = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const employees = await prisma.employee.findMany()

        // Check if employees array is empty, not if it's null/undefined
        if (employees.length === 0) {
            return httpResponse(req, res, 200, apiMessages.employee.employeesNotFound, { data: [] }) // Return empty array with 200 OK
        }

        return httpResponse(req, res, 200, apiMessages.employee.employeesFound, { data: employees }) // Return data in object
    } catch (error) {
        if (error instanceof PrismaClientKnownRequestError) {
            logger.error('Prisma Error in getEmployees:', error)
        }
        return httpError(next, error, req, 500)
    }
}

/** Get a specific employee by ID. */
export const getEmployeeById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { employeeId } = req.params
        if (!employeeId) {
            return httpResponse(req, res, 400, apiMessages.error.invalidInput)
        }

        const employee = await prisma.employee.findUnique({
            where: {
                id: employeeId
            }
        })

        if (!employee) {
            return httpResponse(req, res, 404, apiMessages.employee.employeeNotFound, { data: [] })
        }

        return httpResponse(req, res, 200, apiMessages.employee.employeeFound, { data: employee })
    } catch (error) {
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
            return httpResponse(req, res, 404, apiMessages.employee.employeeNotFound)
        }
        return httpError(next, error, req, 500)
    }
}

/** Update an employee. */
export const updateEmployee = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { employeeId } = req.params
        const employeeData = await companyEmployeeUpdateSchema.parseAsync(req.body)
        const employee = await prisma.employee.findUnique({
            where: {
                id: employeeId
            }
        })

        if (!employee) {
            return httpResponse(req, res, 404, apiMessages.employee.employeeNotFound, { data: [] })
        }

        await prisma.employee.update({
            where: {
                id: employee.id
            },
            data: employeeData
        })

        return httpResponse(req, res, 200, apiMessages.success.updated)
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}

/** Delete an employee. */
export const deleteEmployee = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { employeeId } = req.params
        if (!employeeId) {
            return httpResponse(req, res, 400, apiMessages.error.invalidInput)
        }
        await prisma.employee.delete({
            where: { id: employeeId }
        })
        return httpResponse(req, res, 200, apiMessages.employee.employeeDeleted)
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}

/** change status of employee. */

export const changeEmployeeStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { employeeId } = req.params

        if (!employeeId) {
            return httpResponse(req, res, 400, apiMessages.error.invalidInput)
        }

        const { status } = await adminChangeStatus.parseAsync(req.body)

        const updatedEmployee = await prisma.employee.update({
            where: { id: employeeId },
            data: { status },
            select: { status: true } // Select the updated status
        })

        if (!updatedEmployee) {
            return httpResponse(req, res, 404, apiMessages.employee.employeeNotFound)
        }

        let responseMessage: string

        if (updatedEmployee.status === 'BLOCKED') {
            responseMessage = apiMessages.employee.employeeBlock // Assignment (=), not comparison (===)
        } else if (updatedEmployee.status === 'ACTIVE') {
            responseMessage = apiMessages.employee.employeeActive // Assignment (=)
        } else if (updatedEmployee.status === 'INACTIVE') {
            responseMessage = apiMessages.employee.employeeInactive // Assignment (=)
        } else {
            responseMessage = apiMessages.employee.employeeUpdated // Default message
        }

        return httpResponse(req, res, 200, responseMessage)
    } catch (error) {
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
            return httpResponse(req, res, 404, apiMessages.employee.employeeNotFound)
        }
        return httpError(next, error, req, 500)
    }
}

// Individual Management

/** Get all individuals. */
export const getIndividuals = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const individuals = await prisma.individual.findMany()

        // Check if companies exist before sending a response
        if (!individuals.length) {
            return httpResponse(req, res, 200, apiMessages.user.usersNotFound, { data: [] })
        }

        return httpResponse(req, res, 200, apiMessages.user.usersFound, { data: individuals })
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}

/** Get a specific individual by ID. */
export const getIndividualById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { individualId } = req.params

        const individual = await prisma.individual.findUnique({
            where: { id: individualId }
        })

        if (!individual) {
            return httpResponse(req, res, 200, apiMessages.user.userNotFound, { data: [] })
        }

        return httpResponse(req, res, 200, apiMessages.user.userFound, { data: individual })
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}

/** Update an individual. */
export const updateIndividual = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { individualId } = req.params

        const individual = await prisma.individual.findUnique({
            where: { id: individualId }
        })

        if (!individual) {
            return httpResponse(req, res, 200, apiMessages.user.userNotFound)
        }

        const userData = await adminIndividualUpdateSchema.parseAsync(req.body)

        await prisma.individual.update({
            where: { id: individual.id },
            data: userData
        })

        return httpResponse(req, res, 200, apiMessages.success.updated)
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}

/** Delete an individual. */
export const deleteIndividual = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { individualId } = req.params

        if (!individualId) {
            return httpResponse(req, res, 400, apiMessages.error.invalidInput)
        }

        await prisma.individual.delete({
            where: { id: individualId }
        })

        return httpResponse(req, res, 200, apiMessages.user.userDeleted)
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}
/** Change status of an individual. */
export const changeIndividualStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { individualId } = req.params

        const individual = await prisma.individual.findUnique({
            where: { id: individualId }
        })

        if (!individual) {
            return httpResponse(req, res, 200, apiMessages.user.userNotFound)
        }

        const { status } = await adminChangeStatus.parseAsync(req.body)

        const updatedIndividual = await prisma.individual.update({
            where: { id: individual.id },
            data: { status },
            select: { status: true } // Select the updated status
        })

        let responseMessage: string

        if (updatedIndividual.status === 'BLOCKED') {
            responseMessage = apiMessages.auth.blocked // Assignment (=), not comparison (===)
        } else if (updatedIndividual.status === 'ACTIVE') {
            responseMessage = apiMessages.auth.active // Assignment (=)
        } else if (updatedIndividual.status === 'INACTIVE') {
            responseMessage = apiMessages.auth.deactivate // Assignment (=)
        } else {
            responseMessage = apiMessages.employee.employeeUpdated // Default message
        }

        return httpResponse(req, res, 200, responseMessage)
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}
