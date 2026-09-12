-- Back up the database before running this upgrade.
-- Valid legacy Journal.relatedProductSlug links are preserved before obsolete data is removed.
BEGIN;

ALTER TABLE "Journal" ADD COLUMN IF NOT EXISTS "contentHtml" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "isPreOrder" BOOLEAN;

CREATE TABLE IF NOT EXISTS "ProductJournal" (
  "productId" TEXT NOT NULL,
  "journalId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductJournal_pkey" PRIMARY KEY ("productId", "journalId")
);
CREATE INDEX IF NOT EXISTS "ProductJournal_journalId_idx" ON "ProductJournal"("journalId");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProductJournal_productId_fkey') THEN
    ALTER TABLE "ProductJournal" ADD CONSTRAINT "ProductJournal_productId_fkey"
      FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProductJournal_journalId_fkey') THEN
    ALTER TABLE "ProductJournal" ADD CONSTRAINT "ProductJournal_journalId_fkey"
      FOREIGN KEY ("journalId") REFERENCES "Journal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Journal' AND column_name = 'relatedProductSlug'
  ) THEN
    INSERT INTO "ProductJournal" ("productId", "journalId")
    SELECT p."id", j."id"
    FROM "Journal" j
    JOIN "Product" p ON p."slug" = j."relatedProductSlug"
    WHERE j."relatedProductSlug" IS NOT NULL AND p."deletedAt" IS NULL
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

ALTER TABLE "Journal" DROP COLUMN IF EXISTS "relatedProductSlug";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "storyTitle";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "storyText";
ALTER TABLE "StoreSettings" DROP COLUMN IF EXISTS "flatShippingRate";
DROP TABLE IF EXISTS "Archive" CASCADE;

COMMIT;
