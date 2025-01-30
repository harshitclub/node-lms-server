import { PrismaClient } from '@prisma/client'
import { Request, Response, NextFunction } from 'express'
import httpResponse from '../utils/httpResponse'
import httpError from '../utils/httpError'
import { hashPassword } from '../utils/password/hashPassword'
import apiMessages from '../constants/apiMessages'
import comparePassword from '../utils/password/comparePassword'
import {
    individualChangePasswordSchema,
    individualEmailSchema,
    individualLoginSchema,
    individualSignupSchema,
    individualUpdateSchema
} from '../validator/individual.validator'
import { z } from 'zod'
import { UserPayload } from '../types/tokens.type'
import {
    generateForgetPasswordToken,
    generateTokens,
    generateVerificationToken,
    verifyForgetPasswordToken,
    verifyVerificationToken
} from '../utils/tokens/tokens'
import verificationCodeMail from '../services/emails/general/verificationCode'
import forgetPasswordMail from '../services/emails/general/forgetPassword'
import { employeePasswordSchema } from '../validator/employee.validator'

const prisma = new PrismaClient()

// Individual Authentication Controllers
export const individualSignup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { fullName, email, phone, password } = await individualSignupSchema.parseAsync(req.body)

        // Check if individual already exists
        const individual = await prisma.individual.findUnique({
            where: { email }
        })

        if (individual) {
            return httpResponse(req, res, 400, apiMessages.auth.emailAlreadyInUse)
        }

        const hashedPassword = await hashPassword(password)

        const newIndividual = await prisma.individual.create({
            data: {
                fullName,
                email,
                phone,
                password: hashedPassword
            }
        })

        return httpResponse(req, res, 201, apiMessages.success.signupSuccess, {
            data: newIndividual
        })
    } catch (error) {
        // Handle validation errors
        if (error instanceof z.ZodError) {
            return httpResponse(req, res, 400, 'Validation Error', { errors: error.errors })
        }

        // Handle other errors using httpError
        return httpError(next, error, req, 500)
    }
}

export const individualLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, password } = await individualLoginSchema.parseAsync(req.body)

        // Check if individual user exists
        const user = await prisma.individual.findUnique({
            where: {
                email
            }
        })

        if (!user) {
            return httpResponse(req, res, 404, apiMessages.user.userNotFound)
        }

        // Check password using a secure hashing comparison function
        const isPasswordCorrect = await comparePassword(password, user.password)

        if (!isPasswordCorrect) {
            return httpResponse(req, res, 401, apiMessages.auth.wrongCredentials)
        }

        const payload: UserPayload = {
            id: user.id,
            role: user.role, // Assuming individuals have a role property
            accountType: user.accountType // Set account type explicitly
        }

        const { refreshToken, accessToken } = generateTokens(payload)

        // Set refresh token as HTTP-only cookie with appropriate security measures
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            // secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict', // Recommended for security
            path: '/',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds (or from env)
        })

        return httpResponse(req, res, 200, apiMessages.success.loggedIn, {
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone, // Include phone if applicable
                address: user.address, // Include address if applicable
                accountType: user.accountType, // Explicitly set account type
                role: user.role,
                status: user.status,
                isVerified: user.isVerified,
                userAgent: user.userAgent,
                createdAt: user.createdAt,
                token: accessToken
            }
        })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return httpResponse(req, res, 400, apiMessages.error.validationError, { errors: error.errors })
        }
        return httpError(next, error, req, 500)
    }
}

export const individualLogout = (req: Request, res: Response, next: NextFunction) => {
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

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Ensure user object exists on request (check for authentication middleware)
        if (!req.user) {
            res.status(401).json({ message: apiMessages.error.unauthorized }) // Use clear unauthorized message
        }

        const { id } = req.user as UserPayload // Destructure user ID for clarity

        const user = await prisma.individual.findUnique({
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

        return httpResponse(req, res, 200, apiMessages.success.fetched, {
            data: user
        })
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}

export const updateIndividual = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Ensure user object exists on request (check for authentication middleware)
        if (!req.user) {
            res.status(401).json({ message: apiMessages.error.unauthorized }) // Use clear unauthorized message
        }
        const { id } = req.user as UserPayload // Destructure user ID for clarity

        const userData = await individualUpdateSchema.parseAsync(req.body)

        const updatedUser = await prisma.individual.update({
            where: { id: id },
            data: userData
        })

        return httpResponse(req, res, 200, apiMessages.success.updated, { data: updatedUser })
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}

export const individualChangePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: apiMessages.error.unauthorized }) // Use clear unauthorized message
        }
        const { id } = req.user as UserPayload // Destructure user ID for clarity
        const { oldPassword, newPassword } = await individualChangePasswordSchema.parseAsync(req.body)

        const user = await prisma.individual.findUnique({
            where: { id }
        })

        if (!user) {
            return httpResponse(req, res, 404, apiMessages.user.userNotFound)
        }

        // check password
        const isPasswordCorrect = await comparePassword(oldPassword, user.password)

        if (!isPasswordCorrect) {
            return httpResponse(req, res, 401, apiMessages.auth.wrongCredentials)
        }

        const hashedPassword = await hashPassword(newPassword)

        // Update password using updateMany (if applicable)
        await prisma.individual.updateMany({
            where: { id },
            data: { password: hashedPassword } // Update only the password field
        })

        return httpResponse(req, res, 200, apiMessages.success.passwordChanged)
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}

export const sendIndividualVerificationMail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = await individualEmailSchema.parseAsync(req.body)

        if (!email) {
            return httpResponse(req, res, 400, apiMessages.error.invalidInput)
        }

        const user = await prisma.individual.findUnique({
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

        await prisma.individual.update({
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

export const verifyIndividualAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token } = req.params

        if (!token) {
            return httpResponse(req, res, 404, apiMessages.auth.noTokenProvided)
        }

        const decoded = verifyVerificationToken(token) as UserPayload
        if (!decoded) {
            return httpResponse(req, res, 400, apiMessages.auth.invalidToken)
        }

        await prisma.individual.update({
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

export const sendIndividualResetPasswordMail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = await individualEmailSchema.parseAsync(req.body)

        if (!email) {
            return httpResponse(req, res, 400, apiMessages.error.invalidInput)
        }

        const user = await prisma.individual.findUnique({
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

        await prisma.individual.update({
            where: { id: user.id },
            data: { forgetPasswordToken: forgetPassToken }
        })

        await forgetPasswordMail({ email, forgetPassToken })

        return httpResponse(req, res, 200, apiMessages.success.forgetPasswordSent)
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}

export const resetIndividualPassword = async (req: Request, res: Response, next: NextFunction) => {
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

        const user = await prisma.individual.findUnique({
            where: { id: decoded.id }
        })

        if (!user) {
            return httpResponse(req, res, 404, apiMessages.user.userNotFound)
        }

        const hashedPassword = await hashPassword(password)

        await prisma.individual.updateMany({
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
