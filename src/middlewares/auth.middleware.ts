import { Request, Response, NextFunction } from 'express'
import { generateTokens, verifyAccessToken, verifyRefreshToken } from '../utils/tokens/tokens'
import logger from '../utils/logger'
import { UserPayload } from '../types/tokens.type'
import apiMessages from '../constants/apiMessages'

/*

Building middlewares for specific tasks [[[[[[[[[[]]]]]]]]]]

*/
// Extend Request interface to include tokenValue property
declare module 'express-serve-static-core' {
    interface Request {
        user?: UserPayload
    }
}

export const protect = (req: Request, res: Response, next: NextFunction) => {
    let accessToken
    let refreshToken

    // 1. Check for Access Token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        accessToken = req.headers.authorization.split(' ')[1]
    }

    // 2. Check for Refresh Token in cookies
    if (req.cookies && req.cookies.refreshToken) {
        refreshToken = req.cookies.refreshToken
    }

    // 3. If no tokens are present, return unauthorized
    if (!accessToken && !refreshToken) {
        return res.status(401).json({ message: apiMessages.auth.unauthenticated })
    }

    try {
        if (accessToken) {
            // 4a. Verify Access Token
            const decoded = verifyAccessToken(accessToken)
            if (decoded && typeof decoded === 'object' && 'id' in decoded && 'role' in decoded && 'accountType' in decoded) {
                req.user = decoded as UserPayload
                return next() // Access token is valid, proceed
            }
        }

        if (refreshToken) {
            // 4b. Verify Refresh Token
            const decodedRefreshToken = verifyRefreshToken(refreshToken)

            if (
                decodedRefreshToken &&
                typeof decodedRefreshToken === 'object' &&
                'id' in decodedRefreshToken &&
                'role' in decodedRefreshToken &&
                'accountType' in decodedRefreshToken
            ) {
                //Generate new tokens
                const newTokens = generateTokens({
                    id: decodedRefreshToken.id,
                    role: decodedRefreshToken.role,
                    accountType: decodedRefreshToken.accountType
                })

                // Set new Access Token in Authorization header
                res.setHeader('Authorization', `Bearer ${newTokens.accessToken}`)

                // Set new Refresh Token in httpOnly cookie
                res.cookie('refreshToken', newTokens.refreshToken, {
                    httpOnly: true,
                    // secure: config.ENV === 'production',
                    sameSite: 'strict', // recommended for security
                    path: '/',
                    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds (or from env)
                })

                req.user = decodedRefreshToken as UserPayload
                return next() // Refresh token valid, proceed
            } else {
                res.clearCookie('refreshToken')
                return res.status(401).json({ message: apiMessages.auth.tokenExpired })
            }
        }
        return res.status(401).json({ message: apiMessages.auth.unauthenticated })
    } catch (error) {
        logger.error('JWT Verification Error:', error)
        return res.status(401).json({ message: apiMessages.auth.invalidToken })
    }
}

export const protectAdmin = (req: Request, res: Response, next: NextFunction) => {
    protect(req, res, (err) => {
        if (err) {
            return next(err)
        }
        if (req.user && req.user.role === 'ADMIN') {
            next()
        } else {
            return res.status(403).json({ message: apiMessages.error.unauthorized })
        }
    })
}

export const protectCompany = (req: Request, res: Response, next: NextFunction) => {
    protect(req, res, (err) => {
        if (err) {
            return next(err)
        }
        if (req.user && req.user.role === 'COMPANY') {
            next()
        } else {
            return res.status(403).json({ message: apiMessages.error.unauthorized })
        }
    })
}

export const protectEmployee = (req: Request, res: Response, next: NextFunction) => {
    protect(req, res, (err) => {
        if (err) {
            return next(err)
        }
        if (req.user && req.user.role === 'EMPLOYEE') {
            next()
        } else {
            return res.status(403).json({ message: apiMessages.error.unauthorized })
        }
    })
}
