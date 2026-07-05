"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/role-guard";
import { Button } from "@/components/ui/button";
import { getBookingApi, paymentFailureApi, paymentSuccessApi } from "@/features/bookings/bookings-api";
import type { Booking } from "@/features/bookings/types";
import { getApiErrorMessage } from "@/lib/api";
import { useAppSelector } from "@/store/hooks";

export default function MockPaymentPage() { const id = String(useParams().bookingId); const router = useRouter(); const token = useAppSelector((state) => state.auth.accessToken); const [opening, setOpening] = useState(true); const [submitting, setSubmitting] = useState(false); const [booking, setBooking] = useState<Booking | null>(null);
  useEffect(() => { const timer = setTimeout(() => setOpening(false), 2400); if (token) getBookingApi(id, token).then(setBooking).catch((error) => toast.error(getApiErrorMessage(error))); return () => clearTimeout(timer); }, [id, token]);
  async function finish(success: boolean) { if (!token) return; setSubmitting(true); try { await (success ? paymentSuccessApi(id, token) : paymentFailureApi(id, token)); toast[success ? "success" : "error"](success ? "Payment successful" : "Payment failed"); router.replace(`/bookings/${id}?status=${success ? "success" : "failure"}`); } catch (error) { toast.error(getApiErrorMessage(error)); router.replace("/bookings"); } finally { setSubmitting(false); } }
  return <RoleGuard allowedRoles={["USER"]}><main className="flex min-h-screen items-center justify-center bg-zinc-100 p-6"><section className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-xl"><div className="bg-blue-700 p-6 text-white"><div className="flex items-center gap-2 font-bold"><ShieldCheck className="size-5" />Razorpay Secure</div><p className="mt-2 text-sm text-blue-100">BookMyVenue mock checkout</p></div><div className="p-7">{opening ? <div className="py-14 text-center"><div className="mx-auto mb-5 size-10 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-700" /><p className="font-semibold">Opening secure payment gateway...</p></div> : <><h1 className="text-xl font-bold">Complete payment</h1><p className="mt-2 text-zinc-500">Amount due</p><p className="text-3xl font-extrabold">{booking ? new Intl.NumberFormat("en-IN", { style: "currency", currency: booking.currency }).format(booking.totalAmount) : "—"}</p><div className="mt-8 grid grid-cols-2 gap-3"><Button disabled={submitting} variant="outline" onClick={() => finish(false)}>Failure</Button><Button disabled={submitting} onClick={() => finish(true)}>{submitting ? "Processing..." : "Success"}</Button></div><p className="mt-5 text-center text-xs text-zinc-400">Test payment only. No money will be charged.</p></>}</div></section></main></RoleGuard>;
}
