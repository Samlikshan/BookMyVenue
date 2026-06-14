"use client";

import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

export default function AdminOwnersPage() {
  redirect(ROUTES.admin.pendingOwners);
}
