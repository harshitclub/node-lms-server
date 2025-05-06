-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'COMPANY', 'EMPLOYEE', 'INDIVIDUAL');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ADMIN', 'COMPANY', 'EMPLOYEE', 'INDIVIDUAL');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "Departments" AS ENUM ('Administrative', 'HR', 'Operations_Delivery', 'Product_Service_Development', 'Purchasing', 'Sales', 'Marketing', 'Accounting', 'Finance', 'IT', 'Legal', 'Research_and_Development', 'Customer_Service', 'Training', 'Quality_Assurance', 'Manufacturing', 'Engineering', 'Logistics', 'Facilities', 'Security', 'Project_Management', 'Public_Relations_Communications', 'Investor_Relations', 'Compliance');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('TRIAL', 'BASIC', 'STANDARD', 'PREMIUM', 'CUSTOM');

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" JSONB,
    "password" TEXT NOT NULL,
    "accountType" "AccountType" NOT NULL DEFAULT 'ADMIN',
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "forgetPasswordToken" TEXT,
    "lastLogin" TIMESTAMP(3),
    "userAgent" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "phone" TEXT,
    "username" TEXT,
    "industry" TEXT,
    "address" JSONB,
    "socialLinks" JSONB,
    "companyLogo" TEXT,
    "description" TEXT,
    "website" TEXT,
    "password" TEXT NOT NULL,
    "accountType" "AccountType" NOT NULL DEFAULT 'COMPANY',
    "role" "Role" NOT NULL DEFAULT 'COMPANY',
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "forgetPasswordToken" TEXT,
    "lastLogin" TIMESTAMP(3),
    "userAgent" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "plan" "PlanType" DEFAULT 'TRIAL',
    "maxEmployees" TEXT,
    "contactPersonId" TEXT,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyContact" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "department" "Departments",
    "empId" TEXT,
    "jobTitle" TEXT,
    "profilePicture" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT,

    CONSTRAINT "CompanyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "empId" TEXT,
    "email" TEXT NOT NULL,
    "department" "Departments",
    "dateOfBirth" TIMESTAMP(3),
    "address" JSONB,
    "gender" TEXT,
    "jobTitle" TEXT,
    "profilePicture" TEXT,
    "description" TEXT,
    "phone" TEXT,
    "socialLinks" JSONB,
    "password" TEXT NOT NULL,
    "accountType" "AccountType" NOT NULL DEFAULT 'EMPLOYEE',
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "forgetPasswordToken" TEXT,
    "lastLogin" TIMESTAMP(3),
    "userAgent" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Individual" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "socialLinks" JSONB,
    "department" "Departments",
    "dateOfBirth" TIMESTAMP(3),
    "address" JSONB,
    "jobTitle" TEXT,
    "company" TEXT,
    "institute" TEXT,
    "course" TEXT,
    "profilePicture" TEXT,
    "description" TEXT,
    "gender" TEXT,
    "password" TEXT NOT NULL,
    "accountType" "AccountType" NOT NULL DEFAULT 'INDIVIDUAL',
    "role" "Role" NOT NULL DEFAULT 'INDIVIDUAL',
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "forgetPasswordToken" TEXT,
    "lastLogin" TIMESTAMP(3),
    "userAgent" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Individual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "cover" TEXT,
    "category" TEXT,
    "language" TEXT,
    "duration" TEXT,
    "level" TEXT,
    "viewsCount" INTEGER DEFAULT 0,
    "likesCount" INTEGER DEFAULT 0,
    "dislikesCount" INTEGER DEFAULT 0,
    "tags" TEXT[],
    "prerequisites" TEXT,
    "whatYouWillLearn" TEXT,
    "whoIsThisCourseFor" TEXT,
    "published" BOOLEAN DEFAULT true,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "duration" TEXT,
    "language" TEXT,
    "category" TEXT,
    "thumbnail" TEXT,
    "cover" TEXT,
    "chapter" INTEGER,
    "description" TEXT,
    "order" INTEGER,
    "isPublished" BOOLEAN DEFAULT true,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "questions" JSONB[],
    "courseId" TEXT NOT NULL,
    "videoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Company_email_key" ON "Company"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Company_contactPersonId_key" ON "Company"("contactPersonId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyContact_email_key" ON "CompanyContact"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyContact_companyId_key" ON "CompanyContact"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Individual_email_key" ON "Individual"("email");

-- CreateIndex
CREATE INDEX "Video_courseId_idx" ON "Video"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Assessment_videoId_key" ON "Assessment"("videoId");

-- CreateIndex
CREATE INDEX "Assessment_courseId_idx" ON "Assessment"("courseId");

-- CreateIndex
CREATE INDEX "Assessment_videoId_idx" ON "Assessment"("videoId");

-- AddForeignKey
ALTER TABLE "CompanyContact" ADD CONSTRAINT "CompanyContact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;
