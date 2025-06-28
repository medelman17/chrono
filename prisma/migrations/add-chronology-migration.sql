-- CreateTable
CREATE TABLE "Chronology" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT,
    "caseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chronology_pkey" PRIMARY KEY ("id")
);

-- AddColumn to ChronologyEntry
ALTER TABLE "ChronologyEntry" ADD COLUMN "chronologyId" TEXT;

-- CreateIndex
CREATE INDEX "Chronology_caseId_idx" ON "Chronology"("caseId");
CREATE INDEX "Chronology_userId_idx" ON "Chronology"("userId");
CREATE UNIQUE INDEX "Chronology_caseId_isDefault_key" ON "Chronology"("caseId", "isDefault");
CREATE INDEX "ChronologyEntry_chronologyId_idx" ON "ChronologyEntry"("chronologyId");

-- AddForeignKey
ALTER TABLE "Chronology" ADD CONSTRAINT "Chronology_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Chronology" ADD CONSTRAINT "Chronology_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChronologyEntry" ADD CONSTRAINT "ChronologyEntry_chronologyId_fkey" FOREIGN KEY ("chronologyId") REFERENCES "Chronology"("id") ON DELETE CASCADE ON UPDATE CASCADE;