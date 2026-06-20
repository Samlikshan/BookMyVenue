CREATE TYPE "VenueDateSlotSource" AS ENUM ('TEMPLATE', 'CUSTOM');

CREATE TABLE "venue_slot_templates" (
    "id" TEXT NOT NULL,
    "venue_id" TEXT NOT NULL,
    "name" TEXT,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venue_slot_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "venue_date_slots" (
    "id" TEXT NOT NULL,
    "venue_id" TEXT NOT NULL,
    "slot_template_id" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "source" "VenueDateSlotSource" NOT NULL DEFAULT 'TEMPLATE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venue_date_slots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "venue_slot_templates_venue_id_idx" ON "venue_slot_templates"("venue_id");
CREATE INDEX "venue_slot_templates_venue_id_is_active_idx" ON "venue_slot_templates"("venue_id", "is_active");

CREATE INDEX "venue_date_slots_venue_id_date_idx" ON "venue_date_slots"("venue_id", "date");
CREATE INDEX "venue_date_slots_venue_id_date_is_available_idx" ON "venue_date_slots"("venue_id", "date", "is_available");
CREATE INDEX "venue_date_slots_venue_id_slot_template_id_idx" ON "venue_date_slots"("venue_id", "slot_template_id");

ALTER TABLE "venue_slot_templates" ADD CONSTRAINT "venue_slot_templates_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "venue_date_slots" ADD CONSTRAINT "venue_date_slots_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "venue_date_slots" ADD CONSTRAINT "venue_date_slots_slot_template_id_fkey" FOREIGN KEY ("slot_template_id") REFERENCES "venue_slot_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
