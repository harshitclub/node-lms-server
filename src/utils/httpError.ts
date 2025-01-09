import { NextFunction, Request } from 'express'
import config from '../configs/config'
import { EApplicationEnvironment } from '../constants/application'
import responseMessage from '../constants/responseMessage'
import logger from './logger'

/**
 * HTTP error handler
 * @param nextFunc - Express NextFunction
 * @param err - Error object or unknown
 * @param req - Express Request object
 * @param errorStatusCode - HTTP status code for the error (default: 500)
 */

const httpError = (nextFunc: NextFunction, err: unknown, req: Request, errorStatusCode: number = 500): void => {
    // Construct the error object
    const errorObj = {
        success: false,
        statusCode: errorStatusCode,
        request: {
            ip: config.ENV === EApplicationEnvironment.PRODUCTION ? null : req.ip, // Hide IP in production
            method: req.method,
            url: req.originalUrl
        },
        message: err instanceof Error ? err.message || responseMessage.SOMETHING_WENT_WRONG : responseMessage.SOMETHING_WENT_WRONG,
        data: null,
        trace: config.ENV === EApplicationEnvironment.PRODUCTION ? null : { error: err instanceof Error ? err.stack : null } // Hide stack trace in production
    }

    // Log the error
    logger.error('CONTROLLER_ERROR', { meta: errorObj })

    // Pass the error to the next middleware
    nextFunc(errorObj)
}

export default httpError
