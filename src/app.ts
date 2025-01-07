import express, { Application, NextFunction, Request, Response } from 'express'
import helmet from 'helmet'
import cors from 'cors'
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

// Routes
app.use('/api/v1', router)
app.use('/api/v1/admin', adminRouter)
app.use('/api/v1/company', companyRouter)
app.use('/api/v1/employee', employeeRouter)

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
