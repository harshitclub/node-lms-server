import logger from '../../utils/logger'
import transporter from './emailTransporter'
import forgetPasswordHtml from './templates/forgetPassword'
import emailVerificationHtml from './templates/verificationCode'
const { convert } = require('html-to-text')

export const sendVerificationMail = async () => {
    try {
        const mailOptions = {
            from: `"LMS" noreply@amandaschmutzler.com" `,
            to: `harshitclub@gmail.com`,
            subject: `Verify Your Email - LMS`,
            text: convert(emailVerificationHtml),
            html: emailVerificationHtml
        }

        const mailResponse = await transporter.sendMail(mailOptions)
        logger.info(`Email sent successfully. Message ID: ${mailResponse.messageId}`)
    } catch (error) {
        logger.error('Error sending verification email:', error)
        // Handle errors gracefully, e.g., retry or notify admins
    }
}

export const sendForgetPasswordMail = async () => {
    try {
        const mailOptions = {
            from: `"LMS" noreply@amandaschmutzler.com" `,
            to: `harshitclub@gmail.com`,
            subject: `Forget Password Link - LMS`,
            text: convert(forgetPasswordHtml),
            html: forgetPasswordHtml
        }

        const mailResponse = await transporter.sendMail(mailOptions)
        logger.info(`Email sent successfully. Message ID: ${mailResponse.messageId}`)
    } catch (error) {
        logger.error('Error sending forget password email:', error)
        // Handle errors gracefully, e.g., retry or notify admins
    }
}
