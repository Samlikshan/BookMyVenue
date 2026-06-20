"use client";

import axios from "axios";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Edit3,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import {
  applyVenueSlotTemplatesApi,
  createCustomVenueDateSlotApi,
  createVenueSlotTemplateApi,
  deleteVenueDateSlotApi,
  deleteVenueSlotTemplateApi,
  listVenueDateSlotsApi,
  listVenueSlotTemplatesApi,
  updateVenueDateSlotApi,
  updateVenueSlotTemplateApi,
} from "./venues-api";
import type {
  VenueDateSlot,
  VenueSlotTemplate,
} from "./types";

type VenueBulkAvailabilitySetupProps = {
  venueId: string;
  accessToken: string | null;
  backHref: string;
};

type TemplateFormRow = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
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

function monthKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function monthTitle(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function getMonthGrid(monthDate: Date) {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const last = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
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

export function VenueBulkAvailabilitySetup({
  venueId,
  accessToken,
  backHref,
}: VenueBulkAvailabilitySetupProps) {
  const today = formatDateOnly(new Date());
  const currentMonth = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }, []);
  const nextMonth = useMemo(
    () => new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    [currentMonth]
  );
  const visibleFrom = formatDateOnly(currentMonth);
  const visibleTo = formatDateOnly(
    new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0)
  );

  const [templates, setTemplates] = useState<VenueSlotTemplate[]>([]);
  const [dateSlots, setDateSlots] = useState<VenueDateSlot[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateRows, setTemplateRows] = useState<TemplateFormRow[]>([
    { id: crypto.randomUUID(), name: "", startTime: "", endTime: "" },
  ]);
  const [dayModalDate, setDayModalDate] = useState<string | null>(null);
  const [dateSlotForm, setDateSlotForm] = useState<DateSlotForm | null>(null);

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

  async function loadAvailability() {
    if (!accessToken) return;
    setIsLoading(true);

    try {
      const [templateData, slotData] = await Promise.all([
        listVenueSlotTemplatesApi(venueId, accessToken),
        listVenueDateSlotsApi(venueId, visibleFrom, visibleTo, accessToken),
      ]);
      setTemplates(templateData);
      setDateSlots(slotData);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load availability"));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, venueId, visibleFrom, visibleTo]);

  function toggleDate(dateString: string) {
    if (isPastDate(dateString)) {
      toast.error("Past dates cannot be selected");
      return;
    }

    setSelectedDates((prev) =>
      prev.includes(dateString)
        ? prev.filter((date) => date !== dateString)
        : [...prev, dateString].sort()
    );
  }

  function toggleTemplate(templateId: string) {
    setSelectedTemplateIds((prev) =>
      prev.includes(templateId)
        ? prev.filter((id) => id !== templateId)
        : [...prev, templateId]
    );
  }

  function selectMonth(monthDate: Date) {
    const dates = getMonthGrid(monthDate)
      .filter((date): date is Date => Boolean(date))
      .map(formatDateOnly)
      .filter((date) => !isPastDate(date));

    setSelectedDates((prev) => Array.from(new Set([...prev, ...dates])).sort());
  }

  function openTemplateModal() {
    setTemplateRows([
      { id: crypto.randomUUID(), name: "", startTime: "", endTime: "" },
    ]);
    setIsTemplateModalOpen(true);
  }

  function validateTemplateRows() {
    const ranges = new Set<string>();

    for (const row of templateRows) {
      if (!row.startTime || !row.endTime) {
        toast.error("Every slot row needs start and end time");
        return false;
      }

      if (!isTimeBefore(row.startTime, row.endTime)) {
        toast.error("Slot start time must be before end time");
        return false;
      }

      const range = `${row.startTime}-${row.endTime}`;
      if (ranges.has(range)) {
        toast.error("Duplicate time ranges are not allowed in one save");
        return false;
      }
      ranges.add(range);
    }

    return true;
  }

  async function handleCreateTemplates(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken || !validateTemplateRows()) return;

    setIsSaving(true);
    try {
      for (const row of templateRows) {
        await createVenueSlotTemplateApi(
          venueId,
          {
            name: row.name.trim() || null,
            startTime: row.startTime,
            endTime: row.endTime,
          },
          accessToken
        );
      }

      toast.success("Slots added");
      setIsTemplateModalOpen(false);
      await loadAvailability();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to add slots"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteTemplate(template: VenueSlotTemplate) {
    if (!accessToken) return;
    const confirmed = window.confirm(
      `Delete ${template.name || `${template.startTime} - ${template.endTime}`}? Assigned date slots will keep their copied times.`
    );
    if (!confirmed) return;

    try {
      await deleteVenueSlotTemplateApi(venueId, template.id, accessToken);
      setSelectedTemplateIds((prev) => prev.filter((id) => id !== template.id));
      toast.success("Slot template deleted");
      await loadAvailability();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete slot template"));
    }
  }

  async function handleToggleTemplateActive(template: VenueSlotTemplate) {
    if (!accessToken) return;

    try {
      await updateVenueSlotTemplateApi(
        venueId,
        template.id,
        { isActive: !template.isActive },
        accessToken
      );
      await loadAvailability();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update slot template"));
    }
  }

  async function handleApplyTemplates() {
    if (!accessToken) return;
    if (selectedDates.length === 0) {
      toast.error("Select at least one date");
      return;
    }
    if (selectedTemplateIds.length === 0) {
      toast.error("Select at least one slot");
      return;
    }
    if (selectedDates.some(isPastDate)) {
      toast.error("Remove past dates before applying slots");
      return;
    }

    setIsSaving(true);
    try {
      const result = await applyVenueSlotTemplatesApi(
        venueId,
        {
          dates: selectedDates,
          slotTemplateIds: selectedTemplateIds,
          mode: "MERGE",
        },
        accessToken
      );
      toast.success("Slots applied successfully", {
        description:
          result.skippedDuplicates.length > 0
            ? `${result.skippedDuplicates.length} duplicate slots skipped.`
            : undefined,
      });
      setSelectedDates([]);
      await loadAvailability();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to apply slots"));
    } finally {
      setIsSaving(false);
    }
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
      await loadAvailability();
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
      await loadAvailability();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete date slot"));
    }
  }

  function renderMonth(monthDate: Date) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-850 dark:bg-zinc-900/50">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h4 className="text-sm font-bold text-zinc-950 dark:text-white">
            {monthTitle(monthDate)}
          </h4>
          <Button
            type="button"
            onClick={() => selectMonth(monthDate)}
            variant="outline"
            className="h-8 border-zinc-200 text-xs dark:border-zinc-800"
          >
            Select month
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-2xs font-bold uppercase text-zinc-400">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="py-1">
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {getMonthGrid(monthDate).map((date, index) => {
            if (!date) {
              return <div key={`${monthKey(monthDate)}-${index}`} className="min-h-24" />;
            }

            const dateString = formatDateOnly(date);
            const slots = slotsByDate.get(dateString) ?? [];
            const isSelected = selectedDates.includes(dateString);
            const isToday = dateString === today;
            const isPast = isPastDate(dateString);

            return (
              <button
                key={dateString}
                type="button"
                onClick={() => toggleDate(dateString)}
                className={`min-h-24 rounded-xl border p-1.5 text-left transition-all ${
                  isSelected
                    ? "border-zinc-900 bg-zinc-100 ring-1 ring-zinc-900 dark:border-zinc-100 dark:bg-zinc-800 dark:ring-zinc-100"
                    : slots.length > 0
                      ? "border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900"
                      : "border-zinc-100 bg-white hover:border-zinc-300 dark:border-zinc-850 dark:bg-zinc-950/30"
                } ${isPast ? "cursor-not-allowed opacity-45" : ""}`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${
                      isToday
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : "text-zinc-800 dark:text-zinc-100"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  <span
                    onClick={(event) => {
                      event.stopPropagation();
                      setDayModalDate(dateString);
                      setDateSlotForm(null);
                    }}
                    className="rounded-md px-1.5 py-1 text-2xs font-bold text-zinc-400 hover:bg-white hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  >
                    Edit
                  </span>
                </div>

                <div className="mt-1 space-y-1">
                  {slots.slice(0, 2).map((slot) => (
                    <div
                      key={slot.id}
                      className="truncate rounded-md bg-white px-1.5 py-0.5 text-2xs font-semibold text-zinc-700 shadow-xs dark:bg-zinc-800 dark:text-zinc-200"
                    >
                      {slot.startTime} - {slot.endTime}
                    </div>
                  ))}
                  {slots.length > 2 && (
                    <div className="text-2xs font-bold text-zinc-500">
                      +{slots.length - 2} more
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

  const activeTemplates = templates.filter((template) => template.isActive);
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
                Bulk Availability Setup
              </h3>
              <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                Create reusable slots, select calendar dates, and apply those slots in bulk.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={backHref}>
              <Button
                type="button"
                variant="outline"
                className="h-9 gap-2 border-zinc-200 text-xs dark:border-zinc-800"
              >
                <ArrowLeft className="size-4" />
                Back to Availability
              </Button>
            </Link>
            <Button
              type="button"
              onClick={loadAvailability}
              disabled={isLoading}
              variant="outline"
              className="h-9 border-zinc-200 text-xs dark:border-zinc-800"
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-850 dark:bg-zinc-900/50">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-sm font-bold text-zinc-950 dark:text-white">
              Slots
            </h4>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Select one or more reusable slots before applying them to dates.
            </p>
          </div>
          <Button
            type="button"
            onClick={openTemplateModal}
            className="h-9 gap-2 bg-zinc-900 text-xs text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Plus className="size-4" />
            Add Slots
          </Button>
        </div>

        {isLoading ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-20 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800"
              />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center text-sm font-medium text-zinc-400 dark:border-zinc-800">
            No slot templates yet.
          </div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => {
              const selected = selectedTemplateIds.includes(template.id);

              return (
                <div
                  key={template.id}
                  className={`rounded-xl border p-3 transition-all ${
                    selected
                      ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-800/50"
                      : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950/30"
                  } ${!template.isActive ? "opacity-55" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => template.isActive && toggleTemplate(template.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-zinc-950 dark:text-white">
                          {template.name || "Untitled slot"}
                        </div>
                        <div className="mt-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                          {template.startTime} - {template.endTime}
                        </div>
                      </div>
                      {selected && (
                        <span className="flex size-6 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                          <Check className="size-3.5" />
                        </span>
                      )}
                    </div>
                  </button>
                  <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => handleToggleTemplateActive(template)}
                      className="text-2xs font-bold uppercase text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                      {template.isActive ? "Active" : "Inactive"}
                    </button>
                    <Button
                      type="button"
                      onClick={() => handleDeleteTemplate(template)}
                      variant="outline"
                      size="icon"
                      className="size-8 border-zinc-200 text-zinc-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-zinc-800"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-850 dark:bg-zinc-900/50">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            {selectedDates.length} dates selected
            <span className="mx-2 text-zinc-300">/</span>
            {selectedTemplateIds.length} slots selected
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => selectMonth(currentMonth)}
              variant="outline"
              className="h-9 border-zinc-200 text-xs dark:border-zinc-800"
            >
              Select current month
            </Button>
            <Button
              type="button"
              onClick={() => selectMonth(nextMonth)}
              variant="outline"
              className="h-9 border-zinc-200 text-xs dark:border-zinc-800"
            >
              Select next month
            </Button>
            <Button
              type="button"
              onClick={() => setSelectedDates([])}
              variant="outline"
              className="h-9 border-zinc-200 text-xs dark:border-zinc-800"
            >
              Clear selection
            </Button>
            <Button
              type="button"
              onClick={handleApplyTemplates}
              disabled={isSaving || activeTemplates.length === 0}
              className="h-9 bg-zinc-900 text-xs text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isSaving ? "Applying..." : "Apply selected slots"}
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="h-96 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {renderMonth(currentMonth)}
          {renderMonth(nextMonth)}
        </div>
      )}

      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-xs">
          <form
            onSubmit={handleCreateTemplates}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-zinc-950 dark:text-white">
                  Add Slots
                </h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Create one or more reusable slot templates.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {templateRows.map((row, index) => (
                <div
                  key={row.id}
                  className="grid gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800 md:grid-cols-[1fr_140px_140px_40px]"
                >
                  <div className="space-y-2">
                    <Label htmlFor={`slotName-${row.id}`}>Name</Label>
                    <Input
                      id={`slotName-${row.id}`}
                      value={row.name}
                      placeholder="Morning"
                      onChange={(event) =>
                        setTemplateRows((prev) =>
                          prev.map((item) =>
                            item.id === row.id
                              ? { ...item, name: event.target.value }
                              : item
                          )
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`slotStart-${row.id}`}>Start</Label>
                    <Input
                      id={`slotStart-${row.id}`}
                      type="time"
                      value={row.startTime}
                      onChange={(event) =>
                        setTemplateRows((prev) =>
                          prev.map((item) =>
                            item.id === row.id
                              ? { ...item, startTime: event.target.value }
                              : item
                          )
                        )
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`slotEnd-${row.id}`}>End</Label>
                    <Input
                      id={`slotEnd-${row.id}`}
                      type="time"
                      value={row.endTime}
                      onChange={(event) =>
                        setTemplateRows((prev) =>
                          prev.map((item) =>
                            item.id === row.id
                              ? { ...item, endTime: event.target.value }
                              : item
                          )
                        )
                      }
                      required
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={() =>
                        setTemplateRows((prev) =>
                          prev.length === 1
                            ? prev
                            : prev.filter((item) => item.id !== row.id)
                        )
                      }
                      disabled={templateRows.length === 1}
                      variant="outline"
                      size="icon"
                      className="size-10 border-zinc-200 dark:border-zinc-800"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <div className="text-2xs font-semibold uppercase text-zinc-400 md:hidden">
                    Slot {index + 1}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <Button
                type="button"
                onClick={() =>
                  setTemplateRows((prev) => [
                    ...prev,
                    {
                      id: crypto.randomUUID(),
                      name: "",
                      startTime: "",
                      endTime: "",
                    },
                  ])
                }
                variant="outline"
                className="h-9 gap-2 border-zinc-200 text-xs dark:border-zinc-800"
              >
                <Plus className="size-4" />
                Add another slot
              </Button>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
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
                {isSaving ? "Saving..." : "Save slots"}
              </Button>
            </div>
          </form>
        </div>
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
