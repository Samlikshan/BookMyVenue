-- DropForeignKey
ALTER TABLE "venues" DROP CONSTRAINT IF EXISTS "venues_venue_type_id_fkey";

-- AlterTable
ALTER TABLE "venues" DROP COLUMN IF EXISTS "venue_type_id",
DROP COLUMN IF EXISTS "custom_venue_type";

-- DropTable
DROP TABLE IF EXISTS "venue_types";
