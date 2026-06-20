"use client";

import { Building2, MapPin, Search, Users } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { listPublicVenuesApi } from "@/features/venues/venues-api";
import type { Venue } from "@/features/venues/types";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

export default function Home() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
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
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return venues;
    }

    return venues.filter((venue) => {
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
  }, [searchQuery, venues]);

  return (
    <main className="min-h-screen bg-zinc-50 font-sans text-zinc-950 dark:bg-zinc-950 dark:text-white">
      <section className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              BookMyVenue
            </p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Find active venues for your next event.
            </h1>
            <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-300">
              Browse verified spaces published by approved venue owners.
            </p>
          </div>

          <div className="flex max-w-2xl items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
            <Search className="size-5 text-zinc-400" />
            <input
              className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
              placeholder="Search by venue, city, event type, or amenity..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Active Venues
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {isLoading
                ? "Loading verified venues..."
                : `${filteredVenues.length} venue${
                    filteredVenues.length === 1 ? "" : "s"
                  } available`}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="h-80 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800"
              />
            ))}
          </div>
        ) : filteredVenues.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
              <Building2 className="size-7" />
            </div>
            <h3 className="text-lg font-bold">No active venues found</h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Try a different search, or check again after admins approve more
              listings.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredVenues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function VenueCard({ venue }: { venue: Venue }) {
  const primaryImage =
    venue.images.find((image) => image.isPrimary) ?? venue.images[0];
  const eventTypes = venue.eventTypes
    .map((relation) => relation.eventType.name)
    .slice(0, 2);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="relative h-48 bg-zinc-100 dark:bg-zinc-800">
        {primaryImage ? (
          <Image
            src={primaryImage.imageUrl}
            alt={venue.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-400">
            <Building2 className="size-10" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="space-y-4">
          <div>
            <h3 className="line-clamp-1 text-lg font-bold">{venue.name}</h3>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              <MapPin className="size-4" />
              {venue.city}, {venue.state}
            </p>
          </div>

          <p className="min-h-12 line-clamp-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            {venue.shortDescription ?? ""}
          </p>

          <div className="flex flex-wrap gap-2 pb-5">
            {eventTypes.length > 0 ? (
              eventTypes.map((eventType) => (
                <span
                  key={eventType}
                  className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {eventType}
                </span>
              ))
            ) : (
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                Venue
              </span>
            )}
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-5 dark:border-zinc-800">
          <span className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            <Users className="size-4" />
            {venue.capacityMin && venue.capacityMax
              ? `${venue.capacityMin} - ${venue.capacityMax}`
              : "Capacity on request"}
          </span>
          <Button type="button" size="sm" variant="outline">
            View
          </Button>
        </div>
      </div>
    </article>
  );
}
