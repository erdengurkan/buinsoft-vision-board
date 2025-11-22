-- AlterTable - Add new columns to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "userRole" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatar" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);

-- Set defaults for existing users
UPDATE "User" SET "userRole" = 'Admin' WHERE "userRole" IS NULL;
UPDATE "User" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;

-- Set NOT NULL constraints after updating existing data
ALTER TABLE "User" ALTER COLUMN "userRole" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "userRole" SET DEFAULT 'User';
ALTER TABLE "User" ALTER COLUMN "updatedAt" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable - Customer table
CREATE TABLE IF NOT EXISTS "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

