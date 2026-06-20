"use client";

import axios from "axios";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Plus,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createCustomVenueDateSlotApi,
  deleteVenueDateSlotApi,
  listVenueDateSlotsApi,
  updateVenueDateSlotApi,
} from "./venues-api";
import type { VenueDateSlot } from "./types";

type VenueCalendarAvailabilityManagerProps = {
  venueId: string;
  accessToken: string | null;
};

type DateSlotForm = {
  mode: "add" | "edit";
  slot?: VenueDateSlot;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message ?? fallback;
  }

  return error instanceof Error ? error.message : fallback;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatDateOnly(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateOnly(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getMonthEnd(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function monthTitle(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function getMonthGrid(monthDate: Date) {
  const first = getMonthStart(monthDate);
  const last = getMonthEnd(monthDate);
  const cells: (Date | null)[] = Array(first.getDay()).fill(null);

  for (let day = 1; day <= last.getDate(); day += 1) {
    cells.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function isTimeBefore(startTime: string, endTime: string) {
  return startTime < endTime;
}

function isPastDate(dateString: string) {
  return parseDateOnly(dateString) < parseDateOnly(formatDateOnly(new Date()));
}

function formatHumanDate(dateString: string) {
  return parseDateOnly(dateString).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function normalizeSlotDate(slotDate: string) {
  return slotDate.slice(0, 10);
}

export function VenueCalendarAvailabilityManager({
  venueId,
  accessToken,
}: VenueCalendarAvailabilityManagerProps) {
  const today = formatDateOnly(new Date());
  const [visibleMonth, setVisibleMonth] = useState(() =>
    getMonthStart(new Date())
  );
  const visibleFrom = formatDateOnly(getMonthStart(visibleMonth));
  const visibleTo = formatDateOnly(getMonthEnd(visibleMonth));

  const [dateSlots, setDateSlots] = useState<VenueDateSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dayModalDate, setDayModalDate] = useState<string | null>(null);
  const [dateSlotForm, setDateSlotForm] = useState<DateSlotForm | null>(null);

  const bulkHref = `/owner/venues/${venueId}/availability/bulk`;

  const slotsByDate = useMemo(() => {
    const grouped = new Map<string, VenueDateSlot[]>();

    for (const slot of dateSlots) {
      const key = normalizeSlotDate(slot.date);
      grouped.set(key, [...(grouped.get(key) ?? []), slot]);
    }

    for (const [key, slots] of grouped) {
      grouped.set(
        key,
        slots.sort((a, b) => a.startTime.localeCompare(b.startTime))
      );
    }

    return grouped;
  }, [dateSlots]);

  async function loadDateSlots() {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      setDateSlots(
        await listVenueDateSlotsApi(venueId, visibleFrom, visibleTo, accessToken)
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load availability"));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDateSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, venueId, visibleFrom, visibleTo]);

  function goToPreviousMonth() {
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1)
    );
  }

  function goToNextMonth() {
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1)
    );
  }

  function goToCurrentMonth() {
    setVisibleMonth(getMonthStart(new Date()));
  }

  function openDayModal(dateString: string) {
    setDayModalDate(dateString);
    setDateSlotForm(null);
  }

  function openAddCustomSlot(dateString: string) {
    setDateSlotForm({
      mode: "add",
      startTime: "",
      endTime: "",
      isAvailable: true,
    });
    setDayModalDate(dateString);
  }

  function openEditDateSlot(slot: VenueDateSlot) {
    setDateSlotForm({
      mode: "edit",
      slot,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isAvailable: slot.isAvailable,
    });
  }

  async function handleSaveDateSlot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken || !dayModalDate || !dateSlotForm) return;

    if (!dateSlotForm.startTime || !dateSlotForm.endTime) {
      toast.error("Start and end time are required");
      return;
    }

    if (!isTimeBefore(dateSlotForm.startTime, dateSlotForm.endTime)) {
      toast.error("Start time must be before end time");
      return;
    }

    setIsSaving(true);
    try {
      if (dateSlotForm.mode === "add") {
        await createCustomVenueDateSlotApi(
          venueId,
          {
            date: dayModalDate,
            startTime: dateSlotForm.startTime,
            endTime: dateSlotForm.endTime,
          },
          accessToken
        );
        toast.success("Custom slot added");
      } else if (dateSlotForm.slot) {
        await updateVenueDateSlotApi(
          venueId,
          dateSlotForm.slot.id,
          {
            startTime: dateSlotForm.startTime,
            endTime: dateSlotForm.endTime,
            isAvailable: dateSlotForm.isAvailable,
          },
          accessToken
        );
        toast.success("Date slot updated");
      }

      setDateSlotForm(null);
      await loadDateSlots();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to save date slot"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteDateSlot(slot: VenueDateSlot) {
    if (!accessToken) return;
    const confirmed = window.confirm(`Delete ${slot.startTime} - ${slot.endTime}?`);
    if (!confirmed) return;

    try {
      await deleteVenueDateSlotApi(venueId, slot.id, accessToken);
      toast.success("Date slot deleted");
      await loadDateSlots();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete date slot"));
    }
  }

  function renderCalendar() {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-850 dark:bg-zinc-900/50">
        <div className="grid grid-cols-7 gap-1 text-center text-2xs font-bold uppercase text-zinc-400">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="py-1">
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {getMonthGrid(visibleMonth).map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="min-h-28" />;
            }

            const dateString = formatDateOnly(date);
            const slots = slotsByDate.get(dateString) ?? [];
            const isToday = dateString === today;
            const isPast = isPastDate(dateString);

            return (
              <button
                key={dateString}
                type="button"
                onClick={() => openDayModal(dateString)}
                className={`min-h-28 rounded-xl border p-2 text-left transition-all ${
                  slots.length > 0
                    ? "border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900"
                    : "border-zinc-100 bg-white hover:border-zinc-300 dark:border-zinc-850 dark:bg-zinc-950/30"
                } ${isPast ? "opacity-50" : ""}`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${
                      isToday
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : "text-zinc-800 dark:text-zinc-100"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  <Edit3 className="size-3.5 text-zinc-300" />
                </div>

                <div className="mt-2 space-y-1">
                  {slots.slice(0, 3).map((slot) => (
                    <div
                      key={slot.id}
                      className="truncate rounded-md bg-white px-1.5 py-0.5 text-2xs font-semibold text-zinc-700 shadow-xs dark:bg-zinc-800 dark:text-zinc-200"
                    >
                      {slot.startTime} - {slot.endTime}
                    </div>
                  ))}
                  {slots.length > 3 && (
                    <div className="text-2xs font-bold text-zinc-500">
                      +{slots.length - 3} more
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const daySlots = dayModalDate ? slotsByDate.get(dayModalDate) ?? [] : [];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-850 dark:bg-zinc-900/50">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              <CalendarDays className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Manage Venue Availability
              </h3>
              <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                View and customize this venue&apos;s date-wise availability.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={bulkHref}>
              <Button
                type="button"
                className="h-9 gap-2 bg-zinc-900 text-xs text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                <Settings2 className="size-4" />
                Bulk Setup
              </Button>
            </Link>
            <Button
              type="button"
              onClick={loadDateSlots}
              disabled={isLoading}
              variant="outline"
              className="h-9 border-zinc-200 text-xs dark:border-zinc-800"
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-850 dark:bg-zinc-900/50 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          onClick={goToPreviousMonth}
          variant="outline"
          className="h-9 gap-2 border-zinc-200 text-xs dark:border-zinc-800"
        >
          <ChevronLeft className="size-4" />
          Previous
        </Button>
        <div className="text-center">
          <div className="text-lg font-extrabold text-zinc-950 dark:text-white">
            {monthTitle(visibleMonth)}
          </div>
          <Button
            type="button"
            onClick={goToCurrentMonth}
            variant="ghost"
            className="mt-1 h-7 px-2 text-xs text-zinc-500"
          >
            Today / Current month
          </Button>
        </div>
        <Button
          type="button"
          onClick={goToNextMonth}
          variant="outline"
          className="h-9 gap-2 border-zinc-200 text-xs dark:border-zinc-800"
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="h-[34rem] animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
      ) : (
        renderCalendar()
      )}

      {dayModalDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-zinc-950 dark:text-white">
                  Availability for {formatHumanDate(dayModalDate)}
                </h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Changes here affect only this date.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDayModalDate(null);
                  setDateSlotForm(null);
                }}
                className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {daySlots.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center text-sm font-medium text-zinc-400 dark:border-zinc-800">
                  No slots assigned to this date.
                </div>
              ) : (
                daySlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800"
                  >
                    <div>
                      <div className="text-sm font-bold text-zinc-950 dark:text-white">
                        {slot.startTime} - {slot.endTime}
                      </div>
                      <div className="mt-0.5 text-2xs font-bold uppercase text-zinc-400">
                        {slot.source.toLowerCase()} /{" "}
                        {slot.isAvailable ? "available" : "unavailable"}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        onClick={() => openEditDateSlot(slot)}
                        variant="outline"
                        size="icon"
                        className="size-8 border-zinc-200 dark:border-zinc-800"
                      >
                        <Edit3 className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleDeleteDateSlot(slot)}
                        variant="outline"
                        size="icon"
                        className="size-8 border-zinc-200 text-zinc-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-zinc-800"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {dateSlotForm ? (
              <form
                onSubmit={handleSaveDateSlot}
                className="mt-5 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dateSlotStart">Start time</Label>
                    <Input
                      id="dateSlotStart"
                      type="time"
                      value={dateSlotForm.startTime}
                      onChange={(event) =>
                        setDateSlotForm((prev) =>
                          prev
                            ? { ...prev, startTime: event.target.value }
                            : prev
                        )
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateSlotEnd">End time</Label>
                    <Input
                      id="dateSlotEnd"
                      type="time"
                      value={dateSlotForm.endTime}
                      onChange={(event) =>
                        setDateSlotForm((prev) =>
                          prev ? { ...prev, endTime: event.target.value } : prev
                        )
                      }
                      required
                    />
                  </div>
                </div>

                {dateSlotForm.mode === "edit" && (
                  <label className="mt-4 flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700 dark:border-zinc-800 dark:text-zinc-200">
                    Available
                    <input
                      type="checkbox"
                      checked={dateSlotForm.isAvailable}
                      onChange={(event) =>
                        setDateSlotForm((prev) =>
                          prev
                            ? { ...prev, isAvailable: event.target.checked }
                            : prev
                        )
                      }
                      className="size-4 accent-zinc-900 dark:accent-zinc-100"
                    />
                  </label>
                )}

                <div className="mt-4 flex justify-end gap-3">
                  <Button
                    type="button"
                    onClick={() => setDateSlotForm(null)}
                    disabled={isSaving}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="mt-5">
                <Button
                  type="button"
                  onClick={() => openAddCustomSlot(dayModalDate)}
                  disabled={isPastDate(dayModalDate)}
                  className="h-9 gap-2 bg-zinc-900 text-xs text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  <Plus className="size-4" />
                  Add custom slot
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
