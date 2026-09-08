-- Additive, idempotent upgrade for databases originally created with prisma db push.
BEGIN;
ALTER TABLE "Journal" ADD COLUMN IF NOT EXISTS "contentHtml" TEXT;
ALTER TABLE "Archive" ADD COLUMN IF NOT EXISTS "journalId" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "isPreOrder" BOOLEAN;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Archive_journalId_fkey') THEN
    ALTER TABLE "Archive" ADD CONSTRAINT "Archive_journalId_fkey"
      FOREIGN KEY ("journalId") REFERENCES "Journal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
COMMIT;
