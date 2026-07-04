"use client";

import {
  ArrowRight,
  Building2,
  CalendarHeart,
  MapPin,
  PartyPopper,
  ShieldCheck,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { SiteNavbar } from "@/components/layout/site-navbar";
import { Button } from "@/components/ui/button";
import { SearchWithPlacePicker } from "@/components/venues/search-with-place-picker";
import { listPublicVenuesApi } from "@/features/venues/venues-api";
import type { Venue } from "@/features/venues/types";
import { ROUTES } from "@/lib/routes";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

function uniqueCities(venues: Venue[]) {
  return new Set(venues.map((v) => v.city)).size;
}

export default function Home() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlace, setSelectedPlace] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadVenues() {
      try {
        setIsLoading(true);
        setVenues(await listPublicVenuesApi());
      } catch (error) {
        toast.error("Unable to load venues", {
          description: getErrorMessage(error),
        });
      } finally {
        setIsLoading(false);
      }
    }

    void loadVenues();
  }, []);

  const filteredVenues = useMemo(() => {
    let result = venues;

    if (selectedPlace !== "all") {
      result = result.filter(
        (venue) => venue.city.toLowerCase() === selectedPlace.toLowerCase()
      );
    }

    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return result;
    }

    return result.filter((venue) => {
      const eventTypes = venue.eventTypes
        .map((relation) => relation.eventType.name)
        .join(" ");
      const amenities = venue.amenities.map((amenity) => amenity.name).join(" ");

      return [
        venue.name,
        venue.shortDescription,
        venue.city,
        venue.state,
        eventTypes,
        amenities,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [searchQuery, selectedPlace, venues]);

  const cityCount = uniqueCities(venues);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-950 dark:bg-zinc-950 dark:text-white">
      <SiteNavbar />

      <main>
        <section className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mx-auto max-w-6xl px-6 pb-16 pt-12 sm:pb-20 sm:pt-16">
            <div className="animate-fade-in-up max-w-2xl space-y-6">
              <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.25rem]">
                Discover the perfect venue for moments that matter.
              </h1>

              <p className="text-base leading-7 text-zinc-600 dark:text-zinc-300 sm:text-lg">
                From intimate gatherings to grand celebrations — browse
                verified spaces, pick your city, and find a place that feels
                just right.
              </p>

              <div className="flex flex-wrap gap-3 pt-1">
                {[
                  { icon: ShieldCheck, label: "Verified listings" },
                  { icon: CalendarHeart, label: "Every occasion" },
                  { icon: MapPin, label: `${cityCount || 8}+ cities` },
                ].map(({ icon: Icon, label }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"
                  >
                    <Icon className="size-3.5 text-zinc-500" />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="animate-fade-in-up mt-10 [animation-delay:120ms]">
              <SearchWithPlacePicker
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedPlace={selectedPlace}
                onPlaceChange={setSelectedPlace}
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="animate-fade-in-up space-y-2">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Featured venues
                </h2>
                {!isLoading && (
                  <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                    {filteredVenues.length}
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {isLoading
                  ? "Finding beautiful spaces for you..."
                  : filteredVenues.length === 0
                    ? "No matches yet — try another city or search"
                    : `${filteredVenues.length} hand-picked space${
                        filteredVenues.length === 1 ? "" : "s"
                      } ready for your event${
                        selectedPlace !== "all" ? ` in ${selectedPlace}` : ""
                      }`}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="h-[23rem] animate-pulse rounded-3xl bg-zinc-200 dark:bg-zinc-800"
                />
              ))}
            </div>
          ) : filteredVenues.length === 0 ? (
            <div className="animate-fade-in-up rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-14 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
              <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                <PartyPopper className="size-8" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                No venues here yet
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                Try a nearby city or a different search — great venues are
                added all the time.
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-6 rounded-full"
                onClick={() => {
                  setSelectedPlace("all");
                  setSearchQuery("");
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredVenues.map((venue, index) => (
                <VenueCard key={venue.id} venue={venue} index={index} />
              ))}
            </div>
          )}
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-16">
          <div className="rounded-3xl border border-zinc-200 bg-zinc-900 px-8 py-10 text-white dark:border-zinc-800 sm:px-12 sm:py-12">
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-lg space-y-2">
                <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Own a beautiful space?
                </h3>
                <p className="text-sm leading-6 text-zinc-300 sm:text-base">
                  List your venue on BookMyVenue and reach people planning
                  weddings, parties, and corporate events.
                </p>
              </div>
              <Link href={ROUTES.auth.registerOwner}>
                <Button
                  size="lg"
                  className="rounded-full bg-white text-zinc-900 hover:bg-zinc-100"
                >
                  List your venue
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
              <Building2 className="size-4" />
            </div>
            <span className="text-sm font-bold text-zinc-900 dark:text-white">
              BookMyVenue
            </span>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            © {new Date().getFullYear()} BookMyVenue — made for celebrations
            big and small.
          </p>
        </div>
      </footer>
    </div>
  );
}

function VenueCard({ venue, index }: { venue: Venue; index: number }) {
  const primaryImage =
    venue.images.find((image) => image.isPrimary) ?? venue.images[0];
  const eventTypes = venue.eventTypes
    .map((relation) => relation.eventType.name)
    .slice(0, 2);

  return (
    <article
      className="group animate-fade-in-up flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
      style={{ animationDelay: `${Math.min(index * 60, 300)}ms` }}
    >
      <div className="relative h-56 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {primaryImage ? (
          <>
            <Image
              src={primaryImage.imageUrl}
              alt={venue.name}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
            <Building2 className="size-10" />
            <span className="text-xs font-medium">Photos coming soon</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="space-y-3">
          <div>
            <h3 className="line-clamp-1 text-lg font-bold text-zinc-900 dark:text-white">
              {venue.name}
            </h3>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              <MapPin className="size-4 shrink-0" />
              {venue.city}, {venue.state}
            </p>
          </div>

          <p className="min-h-12 line-clamp-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            {venue.shortDescription ?? "A wonderful space waiting for your next event."}
          </p>

          <div className="flex flex-wrap gap-2">
            {eventTypes.length > 0 ? (
              eventTypes.map((eventType) => (
                <span
                  key={eventType}
                  className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {eventType}
                </span>
              ))
            ) : (
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                All events
              </span>
            )}
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            <Users className="size-4" />
            {venue.capacityMin && venue.capacityMax
              ? `${venue.capacityMin}–${venue.capacityMax} guests`
              : "Flexible capacity"}
          </span>
          <Button
            type="button"
            size="sm"
            className="rounded-full bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            View
          </Button>
        </div>
      </div>
    </article>
  );
}
