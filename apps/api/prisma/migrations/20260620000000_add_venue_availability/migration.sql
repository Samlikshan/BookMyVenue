CREATE TABLE "venue_availability" (
    "id" TEXT NOT NULL,
    "venue_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venue_availability_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "venue_availability_venue_id_idx" ON "venue_availability"("venue_id");
CREATE INDEX "venue_availability_venue_id_day_of_week_idx" ON "venue_availability"("venue_id", "day_of_week");
CREATE INDEX "venue_availability_venue_id_is_active_idx" ON "venue_availability"("venue_id", "is_active");

ALTER TABLE "venue_availability" ADD CONSTRAINT "venue_availability_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
