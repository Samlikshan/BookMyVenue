CREATE TYPE "BookingStatus" AS ENUM ('PAYMENT_PENDING', 'CONFIRMED', 'PAYMENT_FAILED', 'EXPIRED', 'CANCELLED', 'COMPLETED');

ALTER TABLE "venues" ADD COLUMN "base_price_per_slot" DECIMAL(10,2);
ALTER TABLE "venues" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'INR';
UPDATE "venues" SET "base_price_per_slot" = 1.00 WHERE "base_price_per_slot" IS NULL;
ALTER TABLE "venues" ALTER COLUMN "base_price_per_slot" SET NOT NULL;

ALTER TABLE "venue_slot_templates" ADD COLUMN "price_override" DECIMAL(10,2);
ALTER TABLE "venue_date_slots" ADD COLUMN "price_override" DECIMAL(10,2);

CREATE TABLE "bookings" (
  "id" TEXT NOT NULL,
  "user_id" UUID NOT NULL,
  "venue_id" TEXT NOT NULL,
  "owner_id" UUID NOT NULL,
  "booking_date" TIMESTAMP(3) NOT NULL,
  "status" "BookingStatus" NOT NULL DEFAULT 'PAYMENT_PENDING',
  "total_amount" DECIMAL(10,2) NOT NULL,
  "total_slots" INTEGER NOT NULL,
  "payment_expires_at" TIMESTAMP(3),
  "payment_mock_id" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "booking_slots" (
  "id" TEXT NOT NULL,
  "booking_id" TEXT NOT NULL,
  "venue_id" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "start_time" TEXT NOT NULL,
  "end_time" TEXT NOT NULL,
  "price" DECIMAL(10,2) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "booking_slots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bookings_user_id_idx" ON "bookings"("user_id");
CREATE INDEX "bookings_venue_id_idx" ON "bookings"("venue_id");
CREATE INDEX "bookings_owner_id_idx" ON "bookings"("owner_id");
CREATE INDEX "bookings_booking_date_idx" ON "bookings"("booking_date");
CREATE INDEX "bookings_status_idx" ON "bookings"("status");
CREATE INDEX "bookings_payment_expires_at_idx" ON "bookings"("payment_expires_at");
CREATE UNIQUE INDEX "booking_slots_venue_id_date_start_time_end_time_key" ON "booking_slots"("venue_id", "date", "start_time", "end_time");
CREATE INDEX "booking_slots_booking_id_idx" ON "booking_slots"("booking_id");
CREATE INDEX "booking_slots_venue_id_date_idx" ON "booking_slots"("venue_id", "date");

ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "booking_slots" ADD CONSTRAINT "booking_slots_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "booking_slots" ADD CONSTRAINT "booking_slots_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "venues" ADD CONSTRAINT "venues_base_price_positive" CHECK ("base_price_per_slot" > 0);
ALTER TABLE "venue_slot_templates" ADD CONSTRAINT "venue_slot_templates_price_override_positive" CHECK ("price_override" IS NULL OR "price_override" > 0);
ALTER TABLE "venue_date_slots" ADD CONSTRAINT "venue_date_slots_price_override_positive" CHECK ("price_override" IS NULL OR "price_override" > 0);
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_total_amount_nonnegative" CHECK ("total_amount" >= 0);
ALTER TABLE "booking_slots" ADD CONSTRAINT "booking_slots_price_nonnegative" CHECK ("price" >= 0);
