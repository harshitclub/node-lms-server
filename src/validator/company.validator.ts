import { z } from 'zod'
import { zodSchemas } from './zod.commons'

export const companySignupSchema = z.object({
    fullName: zodSchemas.nameSchema,
    email: zodSchemas.emailSchema,
    phone: zodSchemas.phoneSchema,
    password: zodSchemas.passwordSchema
})
export const companyLoginSchema = z.object({
    email: zodSchemas.emailSchema,
    password: z.string()
})
export const companyUpdateSchema = z.object({
    fullName: zodSchemas.nameSchema.optional(),
    phone: zodSchemas.phoneSchema.optional(),
    address: zodSchemas.addressSchema.optional(),
    socialLinks: zodSchemas.socialLinks.optional(),
    website: zodSchemas.website.optional(),
    description: zodSchemas.description.optional(),
    username: zodSchemas.username.optional(),
    industry: zodSchemas.industry.optional()
})
export const companyChangePasswordSchema = z.object({
    oldPassword: z.string(),
    newPassword: zodSchemas.passwordSchema
})

export const companyEmployeeUpdateSchema = z.object({
    email: zodSchemas.emailSchema.optional(),
    fullName: zodSchemas.nameSchema.optional(),
    department: zodSchemas.department.optional(),
    dateOfBirth: zodSchemas.dateOfBirth.optional(),
    address: zodSchemas.addressSchema.optional(),
    gender: zodSchemas.gender.optional(),
    jobTitle: zodSchemas.jobTitle.optional(),
    description: zodSchemas.description.optional(),
    phone: zodSchemas.phoneSchema.optional(),
    socialLinks: zodSchemas.socialLinks.optional()
})

export const companyChangeStatus = z.object({
    status: zodSchemas.status
})

export const companyEmailSchema = z.object({
    email: zodSchemas.emailSchema
})

export const companyPasswordSchema = z.object({
    password: zodSchemas.passwordSchema
})
