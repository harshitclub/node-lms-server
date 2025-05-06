import { Request, Response } from 'express'
import config from '../configs/config'
import { EApplicationEnvironment } from '../constants/application'
import { logger } from './logger'

/**
 * HTTP response handler
 * @param req - Express Request object
 * @param res - Express Response object
 * @param statusCode - HTTP status code
 * @param message - Response message
 * @param data - Optional data to include in the response
 */
const httpResponse = (req: Request, res: Response, statusCode: number, message: string, data: unknown = null): void => {
    // Construct the response object
    const response = {
        success: statusCode >= 200 && statusCode < 300, // Determine success based on status code
        statusCode,
        request: {
            ip: config.ENV === EApplicationEnvironment.PRODUCTION ? null : req.ip, // Hide IP in production
            method: req.method,
            url: req.originalUrl
        },
        message,
        data
    }

    // Log the response
    logger.info('CONTROLLER_RESPONSE', { meta: response })

    // Send the response
    res.status(statusCode).json(response)
}

export default httpResponse
