import express, { Application, NextFunction, Request, Response } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import router from './routes/apiRoutes'
import globalErrorHandler from './middlewares/globalErrorHandler'
import responseMessage from './constants/responseMessage'
import httpError from './utils/httpError'
import adminRouter from './routes/admin.routes'
import companyRouter from './routes/company.routes'
import employeeRouter from './routes/emplyee.routes'

const app: Application = express()

// Middleware
app.use(helmet())
app.use(
    cors({
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
        origin: ['https://client.com'],
        credentials: true
    })
)
app.use(express.json())
// Rate Limiting Configuration (Replace with your desired settings)
const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes window
    max: 100, // Allow up to 100 requests per IP within the window
    message: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests from this IP, please try again later.'
    } // Customize the error message
})

// Apply rate limiting to all routes
app.use(rateLimiter)

// Routes
app.use('/api/v1', router) //testing router
app.use('/api/v1/admin', adminRouter) // admin router
app.use('/api/v1/company', companyRouter) // company router
app.use('/api/v1/employee', employeeRouter) // employee router

// 404 Handler
app.use((req: Request, _: Response, next: NextFunction) => {
    try {
        throw new Error(responseMessage.NOT_FOUND('route'))
    } catch (err) {
        httpError(next, err, req, 404)
    }
})
// Global Error Handler
app.use(globalErrorHandler)

export default app
