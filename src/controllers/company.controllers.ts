import { PrismaClient } from '@prisma/client'
import { Request, Response, NextFunction } from 'express'
import {
    companyChangePasswordSchema,
    companyChangeStatus,
    companyEmailSchema,
    companyEmployeeUpdateSchema,
    companyLoginSchema,
    companyPasswordSchema,
    companySignupSchema,
    companyUpdateSchema
} from '../validator/company.validator'
import apiMessages from '../constants/apiMessages'
import httpResponse from '../utils/httpResponse'
import { hashPassword } from '../utils/password/hashPassword'
import generateShortId from '../utils/uIds'
import { z } from 'zod'
import httpError from '../utils/httpError'
import comparePassword from '../utils/password/comparePassword'
import { UserPayload } from '../types/tokens.type'
import {
    generateForgetPasswordToken,
    generateTokens,
    generateVerificationToken,
    verifyForgetPasswordToken,
    verifyVerificationToken
} from '../utils/tokens/tokens'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { employeeSignupSchema } from '../validator/employee.validator'
import verificationCodeMail from '../services/emails/general/verificationCode'
import forgetPasswordMail from '../services/emails/general/forgetPassword'
import sendInvitationMail from '../services/emails/company/sendInvitation'
const prisma = new PrismaClient()

// Company Authentication Controllers
export const companySignup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Validate and parse request body
        const { fullName, email, phone, password } = await companySignupSchema.parseAsync(req.body)

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
                password: hashedPassword
            }
        })
        const companyData = {
            id: newCompany.id,
            fullName: newCompany.fullName,
            email: newCompany.fullName,
            phone: newCompany.phone,
            companyId: newCompany.companyId,
            createdAt: newCompany.createdAt
        }
        return httpResponse(req, res, 201, apiMessages.company.companyCreated, companyData)
    } catch (error) {
        // Handle validation errors
        if (error instanceof z.ZodError) {
            return httpResponse(req, res, 400, 'Validation Error', { errors: error.errors })
        }

        // Handle other errors using httpError
        return httpError(next, error, req, 500)
    }
}

export const companyLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, password } = await companyLoginSchema.parseAsync(req.body)

        const company = await prisma.company.findUnique({
            where: {
                email
            }
        })
        if (!company) {
            return httpResponse(req, res, 404, apiMessages.company.companyNotFound)
        }

        const isPasswordCorrect = await comparePassword(password, company.password)

        if (!isPasswordCorrect) {
            return httpResponse(req, res, 401, apiMessages.auth.wrongCredentials)
        }

        const payload: UserPayload = {
            id: company.id,
            role: company.role,
            accountType: company.accountType
        }

        const { refreshToken, accessToken } = generateTokens(payload)

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            // secure: config.ENV === 'production',
            sameSite: 'strict', // recommended for security
            path: '/',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds (or from env)
        })

        return httpResponse(req, res, 200, apiMessages.success.loggedIn, {
            company: {
                id: company.id,
                fullName: company.fullName,
                email: company.email,
                phone: company.phone,
                address: company.address,
                accountType: company.accountType,
                industry: company.industry,
                social: company.socialLinks,
                logo: company.companyLogo,
                description: company.description,
                website: company.website,
                plan: company.plan,
                maxEmployees: company.maxEmployees,
                role: company.role,
                status: company.status,
                isVerified: company.isVerified,
                userAgent: company.userAgent,
                createdAt: company.createdAt,
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

export const companyLogout = (req: Request, res: Response, next: NextFunction) => {
    try {
        res.clearCookie('refreshToken', {
            httpOnly: true, // Important: must match cookie options from setting
            // secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict', // Important: must match cookie options from setting
            path: '/' // If your cookie had a path set, include it here
        })

        return httpResponse(req, res, 200, apiMessages.success.loggedOut, { data: [] })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return httpResponse(req, res, 400, apiMessages.error.validationError, { errors: error.errors })
        }
        // Handle other errors using httpError
        return httpError(next, error, req, 500)
    }
}

// Company Admin Self Routes (Profile Management)
export const getCompanyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: apiMessages.error.unauthorized }) // Use clear unauthorized message
        }
        const { id } = req.user as UserPayload

        const user = await prisma.company.findUnique({
            where: { id },
            select: {
                fullName: true,
                email: true,
                phone: true,
                address: true,
                socialLinks: true,
                website: true,
                username: true,
                industry: true,
                description: true,
                companyLogo: true,
                companyId: true,
                plan: true,
                maxEmployees: true,
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

export const updateCompanyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: apiMessages.error.unauthorized }) // Use clear unauthorized message
        }
        const { id } = req.user as UserPayload // Destructure user ID for clarity

        const companyData = await companyUpdateSchema.parseAsync(req.body)

        const updatedCompany = await prisma.company.update({
            where: { id: id },
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

export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: apiMessages.error.unauthorized }) // Use clear unauthorized message
        }
        const { id } = req.user as UserPayload
        const { oldPassword, newPassword } = await companyChangePasswordSchema.parseAsync(req.body)

        const company = await prisma.company.findUnique({
            where: { id }
        })

        if (!company) {
            return httpResponse(req, res, 404, apiMessages.company.companyNotFound)
        }

        // check password
        const isPasswordCorrect = await comparePassword(oldPassword, company.password)

        if (!isPasswordCorrect) {
            return httpResponse(req, res, 401, apiMessages.auth.wrongCredentials)
        }

        const hashedPassword = await hashPassword(newPassword)

        // Update password using updateMany (if applicable)
        await prisma.company.updateMany({
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

// Employee Management
export const createEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: apiMessages.error.unauthorized }) // Use clear unauthorized message
        }
        const { id } = req.user as UserPayload
        const { fullName, email, empId, phone, password, department, dateOfBirth, gender, jobTitle, status } = await employeeSignupSchema.parseAsync(
            req.body
        )
        const company = await prisma.company.findUnique({
            where: { id }
        })

        if (!company) {
            return httpResponse(req, res, 404, apiMessages.company.companyNotFound)
        }

        const hashedPassword = await hashPassword(password)

        const employee = await prisma.employee.create({
            data: {
                fullName,
                email,
                empId,
                phone,
                password: hashedPassword,
                department,
                dateOfBirth,
                gender,
                jobTitle,
                status,
                companyId: company.id
            }
        })

        await sendInvitationMail({ fullName, email, password })

        return httpResponse(req, res, 201, apiMessages.employee.employeeCreated, employee)
    } catch (error) {
        // Handle validation errors
        if (error instanceof z.ZodError) {
            return httpResponse(req, res, 400, 'Validation Error', { errors: error.errors })
        }

        // Handle other errors using httpError
        return httpError(next, error, req, 500)
    }
}

export const getEmployees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: apiMessages.error.unauthorized }) // Use clear unauthorized message
        }
        const { id } = req.user as UserPayload

        const employees = await prisma.employee.findMany({
            where: { companyId: id }
        })
        if (!employees.length) {
            // Check if no employees are found
            return httpResponse(req, res, 200, apiMessages.employee.employeeNotFound, { data: [] }) // Return empty array
        }
        return httpResponse(req, res, 200, apiMessages.employee.employeesFound, { data: employees })
    } catch (error) {
        // Handle other errors using httpError
        return httpError(next, error, req, 500)
    }
}

export const getEmployeeById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: apiMessages.error.unauthorized }) // Use clear unauthorized message
        }
        const { id } = req.user as UserPayload

        const { employeeId } = req.params

        const employee = await prisma.employee.findUnique({
            where: {
                id: employeeId,
                companyId: id
            }
        })
        if (!employee) {
            return httpResponse(req, res, 404, apiMessages.employee.employeeNotFound, { data: [] })
        }

        return httpResponse(req, res, 200, apiMessages.employee.employeeFound, { data: employee })
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}

export const updateEmployee = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: apiMessages.error.unauthorized }) // Use clear unauthorized message
        }
        const { employeeId } = req.params
        const { id } = req.user as UserPayload

        const employeeData = await companyEmployeeUpdateSchema.parseAsync(req.body)

        const employee = await prisma.employee.findUnique({
            where: {
                id: employeeId,
                companyId: id
            }
        })
        if (!employee) {
            return httpResponse(req, res, 404, apiMessages.employee.employeeNotFound, { data: [] })
        }

        await prisma.employee.update({
            where: {
                id: employee.id,
                companyId: id
            },
            data: employeeData
        })

        return httpResponse(req, res, 200, apiMessages.success.updated)
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}

export const deleteEmployee = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: apiMessages.error.unauthorized }) // Use clear unauthorized message
        }
        const { id } = req.user as UserPayload
        const { employeeId } = req.params

        if (!employeeId) {
            return httpResponse(req, res, 400, apiMessages.error.invalidInput)
        }

        await prisma.employee.delete({
            where: {
                id: employeeId,
                companyId: id
            }
        })

        return httpResponse(req, res, 200, apiMessages.employee.employeeDeleted)
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}

export const changeEmployeeStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { employeeId } = req.params

        if (!employeeId) {
            return httpResponse(req, res, 400, apiMessages.error.invalidInput)
        }
        const { status } = await companyChangeStatus.parseAsync(req.body)

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
        return httpError(next, error, req, 500)
    }
}

export const sendCompanyVerificationMail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = await companyEmailSchema.parseAsync(req.body)

        if (!email) {
            return httpResponse(req, res, 400, apiMessages.error.invalidInput)
        }

        const user = await prisma.company.findUnique({
            where: { email }
        })

        if (!user) {
            return httpResponse(req, res, 404, apiMessages.user.userNotFound)
        }

        const payload: UserPayload = {
            id: user.id,
            role: user.role,
            accountType: user.accountType
        }

        const verificationToken = await generateVerificationToken(payload)

        await prisma.company.update({
            where: {
                id: user.id
            },
            data: {
                verificationToken: verificationToken
            }
        })

        await verificationCodeMail({ email, verificationToken })

        return httpResponse(req, res, 200, apiMessages.success.verificationSent)
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}

export const verifyCompanyAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token } = req.params

        if (!token) {
            return httpResponse(req, res, 404, apiMessages.auth.noTokenProvided)
        }
        const decoded = verifyVerificationToken(token) as UserPayload
        if (!decoded) {
            return httpResponse(req, res, 400, apiMessages.auth.invalidToken)
        }

        await prisma.company.update({
            where: {
                id: decoded.id
            },
            data: {
                isVerified: true
            }
        })

        return httpResponse(req, res, 200, apiMessages.success.accountVerified)
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}

export const sendCompanyResetPasswordMail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = await companyEmailSchema.parseAsync(req.body)

        if (!email) {
            return httpResponse(req, res, 400, apiMessages.error.invalidInput)
        }

        const user = await prisma.company.findUnique({
            where: { email }
        })

        if (!user) {
            return httpResponse(req, res, 404, apiMessages.user.userNotFound)
        }

        const payload: UserPayload = {
            id: user.id,
            role: user.role,
            accountType: user.accountType
        }

        const forgetPassToken = generateForgetPasswordToken(payload)

        await prisma.company.update({
            where: { id: user.id },
            data: { forgetPasswordToken: forgetPassToken }
        })

        await forgetPasswordMail({ email, forgetPassToken })

        return httpResponse(req, res, 200, apiMessages.success.forgetPasswordSent)
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}

export const resetCompanyPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token } = req.params
        const { password } = await companyPasswordSchema.parseAsync(req.body)
        if (!token) {
            return httpResponse(req, res, 404, apiMessages.auth.noTokenProvided)
        }
        const decoded = verifyForgetPasswordToken(token) as UserPayload
        if (!decoded) {
            return httpResponse(req, res, 400, apiMessages.auth.invalidToken)
        }

        const user = await prisma.company.findUnique({
            where: { id: decoded.id }
        })

        if (!user) {
            return httpResponse(req, res, 404, apiMessages.user.userNotFound)
        }

        const hashedPassword = await hashPassword(password)

        await prisma.company.updateMany({
            where: { id: decoded.id },
            data: {
                password: hashedPassword
            }
        })
        return httpResponse(req, res, 200, apiMessages.success.passwordChanged)
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}
