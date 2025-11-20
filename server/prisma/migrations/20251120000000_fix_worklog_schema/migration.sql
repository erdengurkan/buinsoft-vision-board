-- Drop old WorklogEntry table if it exists with wrong schema
DROP TABLE IF EXISTS "WorklogEntry";

-- Create WorklogEntry with correct schema
CREATE TABLE "WorklogEntry" (
    "id" TEXT NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "stoppedAt" TIMESTAMP(3) NOT NULL,
    "user" TEXT NOT NULL,
    "description" TEXT,
    "taskId" TEXT NOT NULL,

    CONSTRAINT "WorklogEntry_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WorklogEntry" ADD CONSTRAINT "WorklogEntry_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

