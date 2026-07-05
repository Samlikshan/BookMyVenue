"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CalendarDays, MapPin } from "lucide-react";
import { toast } from "sonner";
import { SiteNavbar } from "@/components/layout/site-navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAvailabilityApi, initiateBookingApi } from "@/features/bookings/bookings-api";
import type { PricedSlot, VenueAvailabilityResponse } from "@/features/bookings/types";
import { listPublicVenuesApi } from "@/features/venues/venues-api";
import type { Venue } from "@/features/venues/types";
import { getApiErrorMessage } from "@/lib/api";
import { useAppSelector } from "@/store/hooks";

const today = () => new Date().toLocaleDateString("en-CA");
const money = (value: number, currency: string) => new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(value);

export default function VenueBookingPage() {
  const venueId = String(useParams().venueId); const router = useRouter();
  const { accessToken, user } = useAppSelector((state) => state.auth);
  const [venue, setVenue] = useState<Venue | null>(null); const [date, setDate] = useState(today());
  const [availability, setAvailability] = useState<VenueAvailabilityResponse | null>(null);
  const [selected, setSelected] = useState<PricedSlot[]>([]); const [loading, setLoading] = useState(true); const [submitting, setSubmitting] = useState(false);

  async function loadAvailability(nextDate = date) { setLoading(true); try { setAvailability(await getAvailabilityApi(venueId, nextDate)); setSelected([]); } catch (error) { toast.error(getApiErrorMessage(error)); } finally { setLoading(false); } }
  useEffect(() => { listPublicVenuesApi().then((venues) => setVenue(venues.find((item) => item.id === venueId) ?? null)); }, [venueId]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAvailability(date);
  }, [date, venueId]); // eslint-disable-line react-hooks/exhaustive-deps
  const total = useMemo(() => selected.reduce((sum, slot) => sum + slot.price, 0), [selected]);
  function toggle(slot: PricedSlot) { if (slot.status !== "AVAILABLE") return; const key = `${slot.startTime}|${slot.endTime}`; setSelected((current) => current.some((item) => `${item.startTime}|${item.endTime}` === key) ? current.filter((item) => `${item.startTime}|${item.endTime}` !== key) : [...current, slot]); }
  async function proceed() {
    if (!accessToken || user?.role !== "USER") { router.push(`/login?next=/venues/${venueId}`); return; }
    setSubmitting(true); try { const booking = await initiateBookingApi({ venueId, date, slots: selected.map(({ startTime, endTime }) => ({ startTime, endTime })) }, accessToken); router.push(`/bookings/payment/${booking.id}`); }
    catch (error) { const message = getApiErrorMessage(error); toast.error(message.includes("no longer available") ? "Sorry, one or more selected slots were just booked. Please select another slot." : message); await loadAvailability(); }
    finally { setSubmitting(false); }
  }
  return <><SiteNavbar /><main className="mx-auto max-w-6xl space-y-8 px-6 py-10">
    <section className="rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm"><h1 className="text-3xl font-bold">{venue?.name ?? "Venue"}</h1><p className="mt-2 flex items-center gap-2 text-zinc-500"><MapPin className="size-4" />{venue ? `${venue.city}, ${venue.state}` : "Loading venue..."}</p><p className="mt-4 max-w-3xl text-zinc-600">{venue?.description ?? venue?.shortDescription}</p></section>
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]"><section className="rounded-3xl border border-zinc-200 bg-white p-6"><label className="mb-2 flex items-center gap-2 font-semibold"><CalendarDays className="size-4" />Select date</label><Input type="date" min={today()} value={date} onChange={(event) => setDate(event.target.value)} className="max-w-xs" />
      <div className="mt-6 grid gap-3 sm:grid-cols-2">{loading ? <p className="text-zinc-500">Loading availability...</p> : availability?.slots.length ? availability.slots.map((slot) => { const active = selected.some((item) => item.startTime === slot.startTime && item.endTime === slot.endTime); return <button key={`${slot.startTime}-${slot.endTime}`} disabled={slot.status !== "AVAILABLE"} onClick={() => toggle(slot)} className={`rounded-2xl border p-4 text-left transition ${active ? "border-zinc-900 bg-zinc-900 text-white" : slot.status === "AVAILABLE" ? "border-zinc-200 hover:border-zinc-500" : "cursor-not-allowed bg-zinc-100 text-zinc-400"}`}><span className="block font-semibold">{slot.startTime} – {slot.endTime}</span><span className="mt-1 block text-sm">{slot.status} · {money(slot.price, availability.currency)}</span></button>; }) : <p className="text-zinc-500">No slots have been published for this date.</p>}</div></section>
      <aside className="h-fit rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Booking summary</h2><p className="mt-3 text-sm text-zinc-500">{date}</p><div className="mt-4 space-y-2">{selected.map((slot) => <div key={slot.startTime} className="flex justify-between text-sm"><span>{slot.startTime} – {slot.endTime}</span><span>{money(slot.price, availability?.currency ?? "INR")}</span></div>)}</div><div className="mt-5 flex justify-between border-t pt-4 text-lg font-bold"><span>Total</span><span>{money(total, availability?.currency ?? "INR")}</span></div><Button className="mt-5 w-full" disabled={!selected.length || submitting} onClick={proceed}>{submitting ? "Locking slots..." : "Proceed to Payment"}</Button><p className="mt-3 text-xs text-zinc-500">Your slots are held for 10 minutes after proceeding.</p></aside></div>
  </main></>;
}
