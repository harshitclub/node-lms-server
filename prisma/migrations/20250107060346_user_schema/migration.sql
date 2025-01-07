-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'INSTRUCTOR', 'STUDENT', 'INDIVIDUAL');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ADMIN', 'COMPANY', 'EMPLOYEE', 'INDIVIDUAL');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "username" TEXT,
    "empID" TEXT,
    "accountType" "AccountType" NOT NULL DEFAULT 'INDIVIDUAL',
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "companyName" TEXT,
    "instituteName" TEXT,
    "gstin" TEXT,
    "website" TEXT,
    "role" "Role" NOT NULL DEFAULT 'INDIVIDUAL',
    "password" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "forgetPasswordToken" TEXT,
    "lastLogin" TIMESTAMP(3),
    "userAgent" TEXT[],
    "profilePicture" TEXT,
    "bio" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "socialLinks" JSONB,
    "contactInfo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
