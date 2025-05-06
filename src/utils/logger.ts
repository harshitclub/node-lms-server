import winston from 'winston'
import path from 'path'

// Define log levels with colors
const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
}

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue'
}

winston.addColors(colors)

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:SSS A' }),
    winston.format.colorize({ all: true }),
    winston.format.printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`)
)
// Define transport options
const transports = [
    new winston.transports.Console(), // log to console
    new winston.transports.File({
        filename: path.join(__dirname, '../../logs/errors.log'),
        level: 'error'
    }), // logs error to the file
    new winston.transports.File({
        filename: path.join(__dirname, '../../logs/info.log'),
        level: 'info'
    }),
    new winston.transports.File({
        filename: path.join(__dirname, '../../logs/http.log'),
        level: 'http'
    }),
    new winston.transports.File({
        filename: path.join(__dirname, '../../logs/combined.log')
    })
]

// create a logger instance
export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info', // Default log level
    levels: logLevels,
    format: logFormat,
    transports
})

// create a stream object for morgan (for integration with Morgan)
export const loggerStream = {
    write: (message: string) => {
        logger.http(message.trim())
    }
}
