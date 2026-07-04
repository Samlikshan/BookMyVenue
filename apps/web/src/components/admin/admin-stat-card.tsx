"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type AdminStatCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  href?: string;
  isLoading?: boolean;
};

export function AdminStatCard({
  label,
  value,
  icon: Icon,
  href,
  isLoading,
}: AdminStatCardProps) {
  const content = (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {label}
        </span>
        <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          <Icon className="size-4.5" />
        </div>
      </div>
      <div className="mt-3">
        {isLoading ? (
          <div className="h-8 w-14 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        ) : (
          <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {value}
          </p>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

type AdminRejectModalProps = {
  title: string;
  description: string;
  submitLabel?: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
};

export function AdminRejectModal({
  title,
  description,
  submitLabel = "Reject",
  isSubmitting,
  onClose,
  onSubmit,
}: AdminRejectModalProps) {
  const [reason, setReason] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = reason.trim();
    if (!trimmed) {
      toast.error("Reason required", {
        description: "Please provide a rejection reason.",
      });
      return;
    }

    await onSubmit(trimmed);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form
        className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
        onSubmit={handleSubmit}
      >
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          {title}
        </h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
        <textarea
          className="mt-4 min-h-28 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:focus-visible:ring-zinc-800"
          placeholder="Explain why this is being rejected..."
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          disabled={isSubmitting}
          required
        />
        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="outline"
            disabled={isSubmitting}
            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/40 dark:hover:bg-red-950/30"
          >
            {isSubmitting ? "Submitting..." : submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
