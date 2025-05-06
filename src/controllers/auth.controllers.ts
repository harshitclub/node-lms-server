import { PrismaClient } from '@prisma/client'
import { NextFunction, Request, Response } from 'express'
import { unifiedLoginSchema } from '../validator/unifiedValidator'
import { generateTokens } from '../utils/tokens/tokens'
import { UserPayload } from '../types/tokens.type'
import httpResponse from '../utils/httpResponse'
import apiMessages from '../constants/apiMessages'
import comparePassword from '../utils/password/comparePassword'
import { z } from 'zod'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { logger } from '../utils/logger'
import httpError from '../utils/httpError'

const prisma = new PrismaClient()

async function handleLoginSuccess(req: Request, res: Response, user: any, role: string): Promise<void> {
    const payload: UserPayload = {
        id: user.id,
        role: role,
        accountType: user.accountType
    }

    const { refreshToken, accessToken } = generateTokens(payload)

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 * 1000
    })

    let userData: any = {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        accountType: user.accountType,
        address: user.address,
        role: role,
        status: user.status,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        token: accessToken
    }

    if (role === 'admin') {
        const adminData = await prisma.admin.findUnique({ where: { id: user.id } })
        if (adminData) {
            userData = { ...userData }
        }
    } else if (role === 'company') {
        const companyData = await prisma.company.findUnique({ where: { id: user.id } })
        if (companyData) {
            userData = {
                ...userData,
                industry: companyData.industry,
                social: companyData.socialLinks,
                description: companyData.description,
                website: companyData.website,
                plan: companyData.plan,
                maxEmployees: companyData.maxEmployees,
                logo: companyData.companyLogo
            }
        }
    } else if (role === 'employee') {
        const employeeData = await prisma.employee.findUnique({ where: { id: user.id } })
        if (employeeData) {
            userData = {
                ...userData
            }
        }
    } else if (role === 'individual') {
        const individualData = await prisma.individual.findUnique({ where: { id: user.id } })
        if (individualData) {
            userData = {
                ...userData
            }
        }
    }

    return httpResponse(req, res, 200, apiMessages.success.loggedIn, { user: userData })
}

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        console.log('Database URL:', process.env.DATABASE_URL)
        const { email, password } = await unifiedLoginSchema.parseAsync(req.body)
        // 1. Admin Check
        let admin = await prisma.admin.findUnique({ where: { email } })
        if (admin) {
            const passwordMatch = await comparePassword(password, admin.password)
            if (passwordMatch) {
                return handleLoginSuccess(req, res, admin, 'admin')
            }
        }

        // 2. Company Check
        let company = await prisma.company.findUnique({ where: { email } })
        if (company) {
            const passwordMatch = await comparePassword(password, company.password)
            if (passwordMatch) {
                return handleLoginSuccess(req, res, company, 'company')
            }
        }

        // 3. Employee Check
        let employee = await prisma.employee.findUnique({ where: { email } })
        if (employee) {
            const passwordMatch = await comparePassword(password, employee.password)
            if (passwordMatch) {
                return handleLoginSuccess(req, res, employee, 'employee')
            }
        }

        // 4. Individual Check
        let individual = await prisma.individual.findUnique({ where: { email } })
        if (individual) {
            const passwordMatch = await comparePassword(password, individual.password)
            if (passwordMatch) {
                return handleLoginSuccess(req, res, individual, 'individual')
            }
        }

        // No match found
        return httpResponse(req, res, 401, apiMessages.auth.wrongCredentials)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return httpResponse(req, res, 400, apiMessages.error.validationError, { errors: error.errors })
        }
        if (error instanceof PrismaClientKnownRequestError) {
            logger.error(`Prisma error during unified login: ${error.message}`, error)
            return httpError(next, error, req, 500)
        }
        logger.error(`Error during unified login: ${error}`, error)
        return httpError(next, error, req, 500)
    }
}
