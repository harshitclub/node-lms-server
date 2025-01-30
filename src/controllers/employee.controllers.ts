// employee.controllers.ts
import { Request, Response, NextFunction } from 'express'
import {
    employeeChangePasswordSchema,
    employeeEmailSchema,
    employeeLoginSchema,
    employeePasswordSchema,
    employeeUpdateSchema
} from '../validator/employee.validator'
import httpResponse from '../utils/httpResponse'
import { PrismaClient } from '@prisma/client'
import apiMessages from '../constants/apiMessages'
import comparePassword from '../utils/password/comparePassword'
import { UserPayload } from '../types/tokens.type'
import { generateForgetPasswordToken, generateTokens, verifyForgetPasswordToken } from '../utils/tokens/tokens'
import httpError from '../utils/httpError'
import { hashPassword } from '../utils/password/hashPassword'
import forgetPasswordMail from '../services/emails/general/forgetPassword'
const prisma = new PrismaClient()

// Controller for employee login
export const employeeLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = await employeeLoginSchema.parseAsync(req.body)

        const employee = await prisma.employee.findUnique({
            where: {
                email
            }
        })
        if (!employee) {
            return httpResponse(req, res, 404, apiMessages.employee.employeeNotFound)
        }

        const isPasswordCorrect = await comparePassword(password, employee.password)

        if (!isPasswordCorrect) {
            return httpResponse(req, res, 401, apiMessages.auth.wrongCredentials)
        }

        const payload: UserPayload = {
            id: employee.id,
            role: employee.role,
            accountType: employee.accountType
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
                id: employee.id,
                fullName: employee.fullName,
                email: employee.email,
                phone: employee.phone,
                address: employee.address,
                accountType: employee.accountType,
                social: employee.socialLinks,
                description: employee.description,
                role: employee.role,
                status: employee.status,
                isVerified: employee.isVerified,
                userAgent: employee.userAgent,
                createdAt: employee.createdAt,
                token: accessToken
            }
        })
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}

export const employeeLogout = (req: Request, res: Response, next: NextFunction) => {
    try {
        res.clearCookie('refreshToken', {
            httpOnly: true, // Important: must match cookie options from setting
            // secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict', // Important: must match cookie options from setting
            path: '/' // If your cookie had a path set, include it here
        })

        return httpResponse(req, res, 200, apiMessages.success.loggedOut, { data: [] })
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}

// Controller for getting the current employee's profile
export const employeeProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: apiMessages.error.unauthorized }) // Use clear unauthorized message
        }
        const { id } = req.user as UserPayload

        const user = await prisma.employee.findUnique({
            where: { id }
        })

        return httpResponse(req, res, 200, apiMessages.success.fetched, user)
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}

// Controller for updating the current employee's profile
export const employeeUpdate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: apiMessages.error.unauthorized }) // Use clear unauthorized message
        }
        const { id } = req.user as UserPayload // Destructure user ID for clarity

        const employeeData = await employeeUpdateSchema.parseAsync(req.body)

        const updatedEmployee = await prisma.employee.update({
            where: {
                id: id
            },
            data: employeeData
        })

        return httpResponse(req, res, 200, apiMessages.success.updated, updatedEmployee)
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}

export const employeeChangePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Ensure user object exists on request (check for authentication middleware)
        if (!req.user) {
            res.status(401).json({ message: apiMessages.error.unauthorized }) // Use clear unauthorized message
        }
        const { id } = req.user as UserPayload // Destructure user ID for clarity
        const { oldPassword, newPassword } = await employeeChangePasswordSchema.parseAsync(req.body)

        const employee = await prisma.employee.findUnique({
            where: { id }
        })

        if (!employee) {
            return httpResponse(req, res, 404, apiMessages.employee.employeeNotFound)
        }

        // check password
        const isPasswordCorrect = await comparePassword(oldPassword, employee.password)

        if (!isPasswordCorrect) {
            return httpResponse(req, res, 401, apiMessages.auth.wrongCredentials)
        }

        const hashedPassword = await hashPassword(newPassword)

        await prisma.employee.updateMany({
            where: {
                id: employee.id
            },
            data: { password: hashedPassword }
        })
        return httpResponse(req, res, 200, apiMessages.success.passwordChanged)
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}

export const sendEmployeeResetPasswordMail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = await employeeEmailSchema.parseAsync(req.body)

        if (!email) {
            return httpResponse(req, res, 400, apiMessages.error.invalidInput)
        }

        const user = await prisma.employee.findUnique({
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

        await prisma.employee.update({
            where: { id: user.id },
            data: { forgetPasswordToken: forgetPassToken }
        })

        await forgetPasswordMail({ email, forgetPassToken })

        return httpResponse(req, res, 200, apiMessages.success.forgetPasswordSent)
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}

export const resetEmployeePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token } = req.params

        const { password } = await employeePasswordSchema.parseAsync(req.body)

        if (!token) {
            return httpResponse(req, res, 404, apiMessages.auth.noTokenProvided)
        }

        const decoded = verifyForgetPasswordToken(token) as UserPayload
        if (!decoded) {
            return httpResponse(req, res, 400, apiMessages.auth.invalidToken)
        }

        const user = await prisma.employee.findUnique({
            where: { id: decoded.id }
        })

        if (!user) {
            return httpResponse(req, res, 404, apiMessages.user.userNotFound)
        }

        const hashedPassword = await hashPassword(password)

        await prisma.employee.updateMany({
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
