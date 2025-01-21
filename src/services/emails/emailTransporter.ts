import nodemailer from 'nodemailer'

// transporter

const transporter = nodemailer.createTransport({
    // @ts-ignore
    name: 'smtp.hostinger.com',
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true,
    auth: {
        user: 'noreply@amandaschmutzler.com',
        pass: 'Harshit@7505'
    }
})

export default transporter
