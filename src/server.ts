import express, { Application, NextFunction, Request, Response } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import compression from 'compression'
import hpp from 'hpp'

import router from './routes/api.routes'
import authRouter from './routes/auth.routes'
import adminRouter from './routes/admin.routes'
import companyRouter from './routes/company.routes'
import employeeRouter from './routes/emplyee.routes'
import individualRouter from './routes/individual.routes'

import globalErrorHandler from './middlewares/globalErrorHandler'

import responseMessage from './constants/responseMessage'
import httpError from './utils/httpError'
import { logger, loggerStream } from './utils/logger'

import cookieParser from 'cookie-parser'
import morgan from 'morgan'

const port = process.env.PORT
const app: Application = express()

// Middleware setup
app.use(compression())
app.use(cookieParser())

// Security middleware
app.use(helmet())
app.use(helmet.xssFilter())
app.disable('x-powered-by')

// CORS configuration
const allowedOrigins: string[] = ['http://localhost:5173']
app.use(
    cors({
        origin: allowedOrigins, // Directly use the array
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With'],
        maxAge: 86400
    })
)

// Body parsers
app.use(express.json({ limit: '25kb' }))
app.use(express.urlencoded({ extended: true, limit: '25kb' }))

// Rate limiting
const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes window
    max: 100, // Allow up to 100 requests per IP within the window
    message: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests from this IP, please try again later.'
    }
})
app.use(rateLimiter)

// HPP protection
app.use(hpp())

// Logging middleware
const environment = process.env.NODE_ENV || 'development'
if (environment === 'development') {
    app.use(morgan('dev'))
} else {
    app.use(morgan('combined', { stream: loggerStream }))
}

// Routes
app.use('/api/v1', router)
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/admin', adminRouter)
app.use('/api/v1/company', companyRouter)
app.use('/api/v1/employee', employeeRouter)
app.use('/api/v1/individual', individualRouter)

// 404 handler
app.use((req: Request, _: Response, next: NextFunction) => {
    try {
        throw new Error(responseMessage.NOT_FOUND('route'))
    } catch (err) {
        httpError(next, err, req, 404)
    }
})

// Global error handler
app.use(globalErrorHandler)

// Start the server
// app.listen({ port, host: '0.0.0.0', reusePort: true }, () => {
//     logger.info(`Server started on port ${port} in ${environment} mode`)
// })

app.listen(port, () => {
    logger.info(`Server started on port ${port} in ${environment} mode`)
})

export default app

/*
[] Rate Limiting
[] Helmet js
[] Error Handling
[] Logging
[] Don't Expose Stack Traces in Production
[] Database Connection Pooling
[] Caching
[] Gzip Compression
[] Process Manager (PM2)
[] Monitoring (Prometheus, Grafana, etc)


*****************************
Production Backend Checklist:
*****************************
I. Security:
[x] HTTPS: Enforce HTTPS on all connections.
[x] Input Validation: Use Zod or a similar library to validate all user inputs.
[x] Output Encoding: Encode output to prevent XSS vulnerabilities.
[x] Security Headers: Implement Helmet.js or manually set security headers (CSP, HSTS, X-Frame-Options, etc.).
[x] Rate Limiting: Implement rate limiting to prevent brute-force attacks.
[x] Authentication and Authorization: Use JWTs for authentication and RBAC for authorization.
[x] Password Hashing: Use bcrypt or Argon2 for password hashing.
[x] Regular Security Audits: Conduct regular security assessments.
[x] Dependency Updates: Keep all dependencies up-to-date.
[x] Secrets Management: Store sensitive information (API keys, database passwords) in environment variables or a secrets management service.
------------------------------
II. Performance and Scalability:
[x] Caching: Implement caching using Redis or a similar solution.
[x] Database Optimization: Optimize database queries and use indexes.
[x] Connection Pooling: Use connection pooling for database connections (Prisma handles this).
[x] Load Balancing: Use a load balancer if needed.
[x] Gzip Compression: Enable Gzip compression for responses.
[x] Content Delivery Network (CDN): Use a CDN for static assets (images, videos).
------------------------------
III. Error Handling and Logging:
[x] Centralized Error Handling: Implement a centralized error handling middleware.
[x] Logging: Use a logging library (Winston, Pino) to log errors and important events.
[x] Error Monitoring: Set up error monitoring to be notified of errors in production.
[x] Don't Expose Stack Traces: Avoid sending detailed error information to clients in production.
------------------------------
IV. Deployment and Infrastructure:
[x] Process Manager: Use PM2 or a similar process manager.
[x] Monitoring: Set up monitoring of server resources (CPU, memory, disk usage).
[x] Automated Deployments: Use CI/CD for automated deployments.
[x] Backups: Implement regular database backups.
[x] Infrastructure as Code (IaC): Use IaC tools (Terraform, CloudFormation) to manage your infrastructure.
------------------------------
V. API Design and Documentation:
[x] RESTful API: Follow RESTful API principles.
[x] API Versioning: Implement API versioning.
[x] API Documentation: Document your API using OpenAPI (Swagger).
[x] Rate Limiting Documentation: Document rate limits.
*/
