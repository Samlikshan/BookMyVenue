"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/role-guard";
import { SiteNavbar } from "@/components/layout/site-navbar";
import { Button } from "@/components/ui/button";
import { cancelBookingApi, getBookingApi } from "@/features/bookings/bookings-api";
import type { Booking } from "@/features/bookings/types";
import { getApiErrorMessage } from "@/lib/api";
import { useAppSelector } from "@/store/hooks";

export default function BookingDetailsPage() { const id = String(useParams().bookingId); const token = useAppSelector((state) => state.auth.accessToken); const [booking, setBooking] = useState<Booking | null>(null); const load = async () => { if (!token) return; try { setBooking(await getBookingApi(id, token)); } catch (error) { toast.error(getApiErrorMessage(error)); } }; useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [id, token]); // eslint-disable-line react-hooks/exhaustive-deps
  async function cancel() { if (!token) return; try { await cancelBookingApi(id, token); toast.success("Booking cancelled"); await load(); } catch (error) { toast.error(getApiErrorMessage(error)); } }
  return <RoleGuard allowedRoles={["USER"]}><SiteNavbar /><main className="mx-auto max-w-3xl px-6 py-10">{!booking ? <p>Loading booking...</p> : <section className="rounded-3xl border bg-white p-8 shadow-sm"><div className="flex justify-between gap-4"><div><p className="text-sm text-zinc-500">Booking #{booking.id.slice(0, 8)}</p><h1 className="mt-1 text-3xl font-bold">{booking.venue.name}</h1></div><span className="h-fit rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold">{booking.status.replaceAll("_", " ")}</span></div><dl className="mt-8 grid gap-5 sm:grid-cols-2"><div><dt className="text-sm text-zinc-500">Date</dt><dd className="font-semibold">{booking.bookingDate.slice(0, 10)}</dd></div><div><dt className="text-sm text-zinc-500">Created</dt><dd className="font-semibold">{new Date(booking.createdAt).toLocaleString()}</dd></div></dl><div className="mt-7 border-t pt-6"><h2 className="font-bold">Selected slots</h2>{booking.slots.map((slot) => <div key={slot.id} className="mt-3 flex justify-between"><span>{slot.startTime} – {slot.endTime}</span><span>{new Intl.NumberFormat("en-IN", { style: "currency", currency: booking.currency }).format(slot.price)}</span></div>)}<div className="mt-5 flex justify-between border-t pt-4 text-xl font-bold"><span>Total</span><span>{new Intl.NumberFormat("en-IN", { style: "currency", currency: booking.currency }).format(booking.totalAmount)}</span></div></div>{["PAYMENT_PENDING", "CONFIRMED"].includes(booking.status) && <Button variant="outline" className="mt-8" onClick={cancel}>Cancel booking</Button>}</section>}</main></RoleGuard>;
}
