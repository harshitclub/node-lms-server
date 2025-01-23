import dotenvFlow from 'dotenv-flow'

dotenvFlow.config()

export default {
    // General
    ENV: process.env.ENV,
    PORT: process.env.PORT,
    SERVER_URL: process.env.SERVER_URL,

    // Database
    DATABASE_URL: process.env.DATABASE_URL,

    // Tokens
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
    VERIFICATION_TOKEN_SECRET: process.env.VERIFICATION_TOKEN_SECRET,
    FORGET_PASSWORD_TOKEN_SECRET: process.env.FORGET_PASSWORD_TOKEN_SECRET,
    ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY,
    REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY,
    VERIFICATION_TOKEN_EXPIRY: process.env.VERIFICATION_TOKEN_EXPIRY,
    FORGET_PASSWORD_TOKEN_EXPIRY: process.env.FORGET_PASSWORD_TOKEN_EXPIRY,

    // Mail info
    MAIL_NAME: process.env.MAIL_NAME,
    MAIL_HOST: process.env.MAIL_HOST,
    MAIL_USER: process.env.MAIL_USER,
    MAIL_PASSWORD: process.env.MAIL_PASSWORD
}
