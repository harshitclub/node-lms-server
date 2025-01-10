import { PrismaClient } from '@prisma/client'
import { Request, Response, NextFunction } from 'express'
import { adminLoginSchema, adminSignupSchema } from '../validator/admin.validator'
import { z } from 'zod'
import httpResponse from '../utils/httpResponse'
import httpError from '../utils/httpError'
import { hashPassword } from '../utils/password/hashPassword'
import apiMessages from '../constants/apiMessages'
import comparePassword from '../utils/password/comparePassword'
import { UserPayload } from '../types/tokens.type'
import { generateTokens, verifyAccessToken } from '../utils/tokens/tokens'
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

        const decodedToken = verifyAccessToken(accessToken)

        console.log(decodedToken)

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
export const adminLogout = (_: Request, res: Response, next: NextFunction): void => {
    try {
        res.status(501).json({ message: 'Admin logout not implemented' })
    } catch (error) {
        next(error)
    }
}

// Admin Self Routes (Profile Management)
export const getMe = (_: Request, res: Response, next: NextFunction): void => {
    try {
        res.status(501).json({ message: 'Get admin profile not implemented' })
    } catch (error) {
        next(error)
    }
}

export const updateMe = (_: Request, res: Response, next: NextFunction): void => {
    try {
        res.status(501).json({ message: 'Update admin profile not implemented' })
    } catch (error) {
        next(error)
    }
}

export const changePassword = (_: Request, res: Response, next: NextFunction): void => {
    try {
        res.status(501).json({ message: 'Change admin password not implemented' })
    } catch (error) {
        next(error)
    }
}

// Company Management

/** Create a new company. */
export const createCompany = (_: Request, res: Response, next: NextFunction) => {
    try {
        res.status(501).json({ message: 'Create company not implemented' })
    } catch (error) {
        next(error)
    }
}

/** Get all companies (with optional filters/pagination). */
export const getCompanies = (_: Request, res: Response, next: NextFunction) => {
    try {
        res.status(501).json({ message: 'Get companies not implemented' })
    } catch (error) {
        next(error)
    }
}

/** Get a specific company by ID. */
export const getCompanyById = (_: Request, res: Response, next: NextFunction) => {
    try {
        res.status(501).json({ message: 'Get company by ID not implemented' })
    } catch (error) {
        next(error)
    }
}

/** Update a company. */
export const updateCompany = (_: Request, res: Response, next: NextFunction) => {
    try {
        res.status(501).json({ message: 'Update company not implemented' })
    } catch (error) {
        next(error)
    }
}

/** Delete a company. */
export const deleteCompany = (_: Request, res: Response, next: NextFunction) => {
    try {
        res.status(501).json({ message: 'Delete company not implemented' })
    } catch (error) {
        next(error)
    }
}

/** Block a company. */
export const blockCompany = (_: Request, res: Response, next: NextFunction) => {
    try {
        res.status(501).json({ message: 'Block company not implemented' })
    } catch (error) {
        next(error)
    }
}

/** Activate a company. */
export const activateCompany = (_: Request, res: Response, next: NextFunction) => {
    try {
        res.status(501).json({ message: 'Activate company not implemented' })
    } catch (error) {
        next(error)
    }
}

/** Deactivate a company. */
export const deactivateCompany = (_: Request, res: Response, next: NextFunction) => {
    try {
        res.status(501).json({ message: 'Deactivate company not implemented' })
    } catch (error) {
        next(error)
    }
}

/** Get employees of a specific company. */
export const getCompanyEmployees = (_: Request, res: Response, next: NextFunction) => {
    try {
        res.status(501).json({ message: 'Get company employees not implemented' })
    } catch (error) {
        next(error)
    }
}

/** Get a specific employee of a specific company. */
export const getCompanyEmployeeById = (_: Request, res: Response, next: NextFunction) => {
    try {
        res.status(501).json({ message: 'Get company employee by ID not implemented' })
    } catch (error) {
        next(error)
    }
}

// Employee Management (Independent)

/** Create a new employee. */
export const createEmployee = (_: Request, res: Response, next: NextFunction) => {
    try {
        res.status(501).json({ message: 'Create employee not implemented' })
    } catch (error) {
        next(error)
    }
}

/** Get all employees. */
export const getEmployees = (_: Request, res: Response, next: NextFunction) => {
    try {
        res.status(501).json({ message: 'Get employees not implemented' })
    } catch (error) {
        next(error)
    }
}

/** Get a specific employee by ID. */
export const getEmployeeById = (_: Request, res: Response, next: NextFunction) => {
    try {
        res.status(501).json({ message: 'Get employee by ID not implemented' })
    } catch (error) {
        next(error)
    }
}

/** Update an employee. */
export const updateEmployee = (_: Request, res: Response, next: NextFunction) => {
    try {
        res.status(501).json({ message: 'Update employee not implemented' })
    } catch (error) {
        next(error)
    }
}

/** Delete an employee. */
export const deleteEmployee = (_: Request, res: Response, next: NextFunction) => {
    try {
        res.status(501).json({ message: 'Delete employee not implemented' })
    } catch (error) {
        next(error)
    }
}

/** Block an employee. */
export const blockEmployee = (_: Request, res: Response, next: NextFunction) => {
    try {
        res.status(501).json({ message: 'Block employee not implemented' })
    } catch (error) {
        next(error)
    }
}

/** Activate an employee. */
export const activateEmployee = (_: Request, res: Response, next: NextFunction) => {
    try {
        res.status(501).json({ message: 'Activate employee not implemented' })
    } catch (error) {
        next(error)
    }
}

/** Deactivate an employee. */
export const deactivateEmployee = (_: Request, res: Response, next: NextFunction) => {
    try {
        res.status(501).json({ message: 'Deactivate employee not implemented' })
    } catch (error) {
        next(error)
    }
}

// Individual Management

/** Get all individuals. */
export const getIndividuals = (_: Request, res: Response, next: NextFunction) => {
    try {
        res.status(501).json({ message: 'Get individuals not implemented' })
    } catch (error) {
        next(error)
    }
}

/** Get a specific individual by ID. */
export const getIndividualById = (_: Request, res: Response, next: NextFunction) => {
    try {
        res.status(501).json({ message: 'Get individual by ID not implemented' })
    } catch (error) {
        next(error)
    }
}

/** Update an individual. */
export const updateIndividual = (_: Request, res: Response, next: NextFunction) => {
    try {
        res.status(501).json({ message: 'Update individual not implemented' })
    } catch (error) {
        next(error)
    }
}

/** Delete an individual. */
export const deleteIndividual = (_: Request, res: Response, next: NextFunction) => {
    try {
        res.status(501).json({ message: 'Delete individual not implemented' })
    } catch (error) {
        next(error)
    }
}

/** Block an individual. */
export const blockIndividual = (_: Request, res: Response, next: NextFunction) => {
    try {
        res.status(501).json({ message: 'Block individual not implemented' })
    } catch (error) {
        next(error)
    }
}

/** Activate an individual. */
export const activateIndividual = (_: Request, res: Response, next: NextFunction) => {
    try {
        res.status(501).json({ message: 'Activate individual not implemented' })
    } catch (error) {
        next(error)
    }
}

/** Deactivate an individual. */
export const deactivateIndividual = (_: Request, res: Response, next: NextFunction) => {
    try {
        res.status(501).json({ message: 'Deactivate individual not implemented' })
    } catch (error) {
        next(error)
    }
}
