-- CreateEnum
CREATE TYPE "VenueStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'SUSPENDED');

-- CreateTable
CREATE TABLE "venue_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venue_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venue_event_types" (
    "venue_id" TEXT NOT NULL,
    "event_type_id" TEXT NOT NULL,

    CONSTRAINT "venue_event_types_pkey" PRIMARY KEY ("venue_id","event_type_id")
);

-- CreateTable
CREATE TABLE "venue_amenities" (
    "id" TEXT NOT NULL,
    "venue_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "venue_amenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venue_images" (
    "id" TEXT NOT NULL,
    "venue_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "storage_path" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "venue_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venue_videos" (
    "id" TEXT NOT NULL,
    "venue_id" TEXT NOT NULL,
    "video_url" TEXT NOT NULL,
    "storage_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "venue_videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venues" (
    "id" TEXT NOT NULL,
    "owner_id" UUID NOT NULL,
    "venue_type_id" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "short_description" TEXT,
    "description" TEXT,
    "status" "VenueStatus" NOT NULL DEFAULT 'DRAFT',
    "capacity_min" INTEGER,
    "capacity_max" INTEGER,
    "address_line1" TEXT NOT NULL,
    "address_line2" TEXT,
    "city" TEXT NOT NULL,
    "district" TEXT,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "postal_code" TEXT,
    "custom_venue_type" TEXT,
    "rejection_reason" TEXT,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "venue_types_name_key" ON "venue_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "event_types_name_key" ON "event_types"("name");

-- CreateIndex
CREATE INDEX "venue_amenities_venue_id_idx" ON "venue_amenities"("venue_id");

-- CreateIndex
CREATE UNIQUE INDEX "venue_amenities_venue_id_name_key" ON "venue_amenities"("venue_id", "name");

-- CreateIndex
CREATE INDEX "venue_images_venue_id_idx" ON "venue_images"("venue_id");

-- CreateIndex
CREATE INDEX "venue_videos_venue_id_idx" ON "venue_videos"("venue_id");

-- CreateIndex
CREATE UNIQUE INDEX "venues_slug_key" ON "venues"("slug");

-- CreateIndex
CREATE INDEX "venues_owner_id_idx" ON "venues"("owner_id");

-- CreateIndex
CREATE INDEX "venues_status_idx" ON "venues"("status");

-- CreateIndex
CREATE INDEX "venues_city_idx" ON "venues"("city");

-- CreateIndex
CREATE INDEX "venues_state_idx" ON "venues"("state");

-- CreateIndex
CREATE INDEX "venues_deleted_at_idx" ON "venues"("deleted_at");

-- AddForeignKey
ALTER TABLE "venue_event_types" ADD CONSTRAINT "venue_event_types_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venue_event_types" ADD CONSTRAINT "venue_event_types_event_type_id_fkey" FOREIGN KEY ("event_type_id") REFERENCES "event_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venue_amenities" ADD CONSTRAINT "venue_amenities_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venue_images" ADD CONSTRAINT "venue_images_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venue_videos" ADD CONSTRAINT "venue_videos_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venues" ADD CONSTRAINT "venues_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venues" ADD CONSTRAINT "venues_venue_type_id_fkey" FOREIGN KEY ("venue_type_id") REFERENCES "venue_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
