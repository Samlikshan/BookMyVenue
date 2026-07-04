"use client";

import { MapPin, Search } from "lucide-react";

export const PLACE_OPTIONS = [
  { value: "all", label: "All places" },
  { value: "Mumbai", label: "Mumbai" },
  { value: "Delhi", label: "Delhi" },
  { value: "Bangalore", label: "Bangalore" },
  { value: "Hyderabad", label: "Hyderabad" },
  { value: "Chennai", label: "Chennai" },
  { value: "Kolkata", label: "Kolkata" },
  { value: "Pune", label: "Pune" },
] as const;

export const POPULAR_CITIES = ["Mumbai", "Delhi", "Bangalore", "Hyderabad"] as const;

type SearchWithPlacePickerProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedPlace: string;
  onPlaceChange: (value: string) => void;
};

export function SearchWithPlacePicker({
  searchQuery,
  onSearchChange,
  selectedPlace,
  onPlaceChange,
}: SearchWithPlacePickerProps) {
  return (
    <div className="w-full max-w-3xl space-y-4">
      <div className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm ring-1 ring-zinc-200/60 dark:border-zinc-800 dark:bg-zinc-900 dark:ring-zinc-800/80 sm:flex-row sm:items-stretch">
        <div className="relative flex shrink-0 items-center border-b border-zinc-200 bg-zinc-50 sm:w-52 sm:border-b-0 sm:border-r dark:border-zinc-800 dark:bg-zinc-950">
          <MapPin className="pointer-events-none absolute left-4 size-4 text-zinc-400" />
          <select
            value={selectedPlace}
            onChange={(event) => onPlaceChange(event.target.value)}
            className="w-full cursor-pointer appearance-none bg-transparent py-4 pl-11 pr-10 text-sm font-medium text-zinc-800 outline-none dark:text-zinc-200"
            aria-label="Choose place"
          >
            {PLACE_OPTIONS.map((place) => (
              <option key={place.value} value={place.value}>
                {place.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-4 text-xs text-zinc-400">
            ▼
          </span>
        </div>

        <div className="flex flex-1 items-center gap-3 px-4 py-3.5 sm:py-0">
          <Search className="size-5 shrink-0 text-zinc-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search venues, events, amenities..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Popular:
        </span>
        {POPULAR_CITIES.map((city) => {
          const isActive = selectedPlace === city;
          return (
            <button
              key={city}
              type="button"
              onClick={() => onPlaceChange(isActive ? "all" : city)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                isActive
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-700 dark:hover:bg-zinc-800"
              }`}
            >
              {city}
            </button>
          );
        })}
      </div>
    </div>
  );
}
