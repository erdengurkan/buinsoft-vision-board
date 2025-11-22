-- AlterTable
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "sharedWithAll" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "sharedWith" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Update existing projects to have sharedWithAll = true
UPDATE "Project" SET "sharedWithAll" = true WHERE "sharedWithAll" IS NULL;
UPDATE "Project" SET "sharedWith" = ARRAY[]::TEXT[] WHERE "sharedWith" IS NULL;

-- AlterTable
ALTER TABLE "Todo" ADD COLUMN IF NOT EXISTS "taskId" TEXT;
ALTER TABLE "Todo" ADD COLUMN IF NOT EXISTS "taskTitle" TEXT;

