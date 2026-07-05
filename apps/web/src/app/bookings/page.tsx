"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/role-guard";
import { SiteNavbar } from "@/components/layout/site-navbar";
import { Button } from "@/components/ui/button";
import { cancelBookingApi, listMyBookingsApi } from "@/features/bookings/bookings-api";
import type { Booking } from "@/features/bookings/types";
import { getApiErrorMessage } from "@/lib/api";
import { useAppSelector } from "@/store/hooks";

export default function BookingsPage() { const token = useAppSelector((state) => state.auth.accessToken); const [items, setItems] = useState<Booking[]>([]); const [loading, setLoading] = useState(true); const load = async () => { if (!token) return; try { setItems(await listMyBookingsApi(token)); } catch (error) { toast.error(getApiErrorMessage(error)); } finally { setLoading(false); } }; useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps
  async function cancel(id: string) { if (!token) return; try { await cancelBookingApi(id, token); toast.success("Booking cancelled"); await load(); } catch (error) { toast.error(getApiErrorMessage(error)); } }
  return <RoleGuard allowedRoles={["USER"]}><SiteNavbar /><main className="mx-auto max-w-5xl px-6 py-10"><h1 className="text-3xl font-bold">My bookings</h1><div className="mt-8 space-y-4">{loading ? <p>Loading bookings...</p> : items.length === 0 ? <p className="rounded-2xl border p-8 text-zinc-500">No bookings yet.</p> : items.map((booking) => <article key={booking.id} className="rounded-2xl border bg-white p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-lg font-bold">{booking.venue.name}</h2><p className="text-sm text-zinc-500">{booking.bookingDate.slice(0, 10)} · {booking.slots.map((slot) => `${slot.startTime}–${slot.endTime}`).join(", ")}</p></div><span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold">{booking.status.replaceAll("_", " ")}</span></div><div className="mt-5 flex items-center justify-between border-t pt-4"><strong>{new Intl.NumberFormat("en-IN", { style: "currency", currency: booking.currency }).format(booking.totalAmount)}</strong><div className="flex gap-2"><Link href={`/bookings/${booking.id}`}><Button variant="outline">View details</Button></Link>{["PAYMENT_PENDING", "CONFIRMED"].includes(booking.status) && <Button variant="outline" onClick={() => cancel(booking.id)}>Cancel</Button>}</div></div></article>)}</div></main></RoleGuard>;
}
