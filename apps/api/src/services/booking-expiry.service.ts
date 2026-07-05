import type { TransactionClient } from "./venue-calendar-availability.helpers.js";

export async function releaseExpiredPendingBookings(tx: TransactionClient) {
  const expired = await tx.booking.findMany({
    where: { status: "PAYMENT_PENDING", paymentExpiresAt: { lt: new Date() } },
    select: { id: true },
  });
  const ids = expired.map((booking) => booking.id);
  if (ids.length === 0) return 0;

  await tx.bookingSlot.deleteMany({ where: { bookingId: { in: ids } } });
  await tx.booking.updateMany({
    where: { id: { in: ids }, status: "PAYMENT_PENDING" },
    data: { status: "EXPIRED", paymentExpiresAt: null },
  });
  return ids.length;
}
