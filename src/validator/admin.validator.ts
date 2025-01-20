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

export const adminUpdateSchema = z.object({
    fullName: zodSchemas.nameSchema.optional(),
    phone: zodSchemas.phoneSchema.optional(),
    address: zodSchemas.addressSchema.optional()
})

export const adminChangePasswordSchema = z.object({
    oldPassword: z.string(),
    newPassword: zodSchemas.passwordSchema
})

export const adminChangeCompanyPlan = z.object({
    plan: z.enum(['TRIAL', 'BASIC', 'STANDARD', 'PREMIUM'])
})
