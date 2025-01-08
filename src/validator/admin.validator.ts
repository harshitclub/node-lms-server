import { z } from 'zod'
import { zodSchemas } from './zod.commons'

export const adminSignupSchema = z.object({
    fullName: zodSchemas.nameSchema,
    email: zodSchemas.emailSchema,
    phone: zodSchemas.phoneSchema,
    password: zodSchemas.passwordSchema
})

export const adminLoginSchema = z.object({
    email: zodSchemas.emailSchema,
    password: z.string()
})
