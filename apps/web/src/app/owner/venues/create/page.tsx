"use client";

import { AlertCircle, ArrowLeft, Plus, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { RoleGuard } from "@/components/auth/role-guard";
import { OwnerLayout } from "@/components/layout/owner-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listEventTypesApi } from "@/features/catalog/catalog-api";
import { createVenueApi } from "@/features/venues/venues-api";
import type { EventType } from "@/features/venues/types";
import { ROUTES } from "@/lib/routes";
import { useAppSelector } from "@/store/hooks";

export default function CreateVenuePage() {
  const router = useRouter();
  const { accessToken, user } = useAppSelector((state) => state.auth);

  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [amenityInput, setAmenityInput] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadEventTypes() {
      if (!accessToken) return;
      try {
        const types = await listEventTypesApi(accessToken);
        setEventTypes(types);
      } catch (error) {
        console.error("Failed to load event types", error);
      }
    }
    loadEventTypes();
  }, [accessToken]);

  function handleAddAmenity() {
    const trimmed = amenityInput.trim();
    if (!trimmed) return;
    if (amenities.includes(trimmed)) {
      toast.warning("Amenity already added");
      return;
    }
    setAmenities((prev) => [...prev, trimmed]);
    setAmenityInput("");
  }

  function handleRemoveAmenity(name: string) {
    setAmenities((prev) => prev.filter((a) => a !== name));
  }

  function handleEventTypeToggle(id: string) {
    setSelectedEventTypes((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken || !user) return;

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "");
    const addressLine1 = String(formData.get("addressLine1") ?? "");
    const addressLine2 = String(formData.get("addressLine2") ?? "") || undefined;
    const city = String(formData.get("city") ?? "");
    const state = String(formData.get("state") ?? "");
    const country = String(formData.get("country") ?? "India") || undefined;
    const postalCode = String(formData.get("postalCode") ?? "") || undefined;
    const district = String(formData.get("district") ?? "") || undefined;
    const shortDescription = String(formData.get("shortDescription") ?? "") || undefined;
    const description = String(formData.get("description") ?? "") || undefined;

    const capMinRaw = formData.get("capacityMin");
    const capMaxRaw = formData.get("capacityMax");
    const capacityMin = capMinRaw ? Number(capMinRaw) : undefined;
    const capacityMax = capMaxRaw ? Number(capMaxRaw) : undefined;
    const basePricePerSlot = Number(formData.get("basePricePerSlot"));

    if (capacityMin && capacityMax && capacityMin > capacityMax) {
      toast.error("Validation error", {
        description: "Minimum capacity cannot be greater than maximum capacity.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createVenueApi(
        {
          name,
          addressLine1,
          addressLine2,
          city,
          state,
          country,
          postalCode,
          district,
          shortDescription,
          description,
          capacityMin,
          capacityMax,
          eventTypeIds: selectedEventTypes,
          amenityNames: amenities,
          status: "DRAFT",
          basePricePerSlot,
          currency: "INR",
        },
        accessToken
      );

      if (result) {
        toast.success("Venue created successfully", {
          description: "Let's complete the venue by uploading some photos.",
        });
        router.push(`${ROUTES.owner.venues}/${result.id}`);
      } else {
        toast.error("Failed to create venue");
      }
    } catch (error) {
      toast.error("Failed to create venue", {
        description: error instanceof Error ? error.message : "Invalid field inputs",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <RoleGuard allowedRoles={["OWNER"]}>
      <OwnerLayout>
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href={ROUTES.owner.venues}>
              <Button variant="ghost" size="icon" className="rounded-full border border-zinc-200 dark:border-zinc-800">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
                Create Venue Listing
              </h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Register a new space for event bookings.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* General Info Card */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-850 dark:bg-zinc-900/50 space-y-6">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white border-b border-zinc-100 pb-3 dark:border-zinc-800">
                1. General Information
              </h3>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name">Venue Name</Label>
                  <Input id="name" name="name" placeholder="Grand Royal Banquet Hall" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacityMin">Min Capacity</Label>
                  <Input id="capacityMin" name="capacityMin" type="number" min="1" placeholder="50" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacityMax">Max Capacity</Label>
                  <Input id="capacityMax" name="capacityMax" type="number" min="1" placeholder="500" />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="shortDescription">Short Description</Label>
                  <Input id="shortDescription" name="shortDescription" placeholder="A brief catchphrase for your listing (max 100 characters)" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="basePricePerSlot">Default price per slot (INR)</Label>
                  <Input id="basePricePerSlot" name="basePricePerSlot" type="number" min="0.01" step="0.01" required placeholder="1000" />
                  <p className="text-xs text-zinc-500">This price will be used for all slots unless a custom slot price is provided.</p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Long Description</Label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    placeholder="Describe your venue space, ambiance, suitability, and policies..."
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950"
                  />
                </div>
              </div>
            </div>

            {/* Address Card */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-850 dark:bg-zinc-900/50 space-y-6">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white border-b border-zinc-100 pb-3 dark:border-zinc-800">
                2. Location Details
              </h3>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="addressLine1">Address Line 1</Label>
                  <Input id="addressLine1" name="addressLine1" placeholder="123 Main Street, Suite A" required />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                  <Input id="addressLine2" name="addressLine2" placeholder="Building name, landmark etc." />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" placeholder="Mumbai" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="district">District (Optional)</Label>
                  <Input id="district" name="district" placeholder="Mumbai Suburban" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" name="state" placeholder="Maharashtra" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input id="postalCode" name="postalCode" placeholder="400001" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" name="country" defaultValue="India" required />
                </div>
              </div>
            </div>

            {/* Categorization and Amenities */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-850 dark:bg-zinc-900/50 space-y-6">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white border-b border-zinc-100 pb-3 dark:border-zinc-800">
                3. Event Suitability & Amenities
              </h3>

              <div className="space-y-4">
                <Label>Event Types Supported</Label>
                {eventTypes.length === 0 ? (
                  <p className="text-xs text-zinc-500">No active event types registered.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {eventTypes.map((type) => {
                      const isChecked = selectedEventTypes.includes(type.id);
                      return (
                        <label
                          key={type.id}
                          className={`flex items-center gap-3 rounded-xl border p-3.5 text-xs font-semibold cursor-pointer transition-all duration-200 hover:bg-zinc-50 dark:hover:bg-zinc-850/30 ${
                            isChecked
                              ? "border-zinc-900 bg-zinc-50 text-zinc-900 dark:border-zinc-100 dark:bg-zinc-800/10 dark:text-white"
                              : "border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleEventTypeToggle(type.id)}
                            className="sr-only"
                          />
                          {type.name}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <Label htmlFor="amenityInput">Add Amenities</Label>
                <div className="flex gap-2">
                  <Input
                    id="amenityInput"
                    placeholder="Wi-Fi, Free Parking, Air Conditioning, Sound System"
                    value={amenityInput}
                    onChange={(e) => setAmenityInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddAmenity();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button type="button" onClick={handleAddAmenity} variant="outline" className="gap-2">
                    <Plus className="size-4" />
                    Add
                  </Button>
                </div>

                {/* Amenities Tags */}
                {amenities.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {amenities.map((amenity) => (
                      <span
                        key={amenity}
                        className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 pl-3.5 pr-2.5 py-1 text-xs font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                      >
                        {amenity}
                        <button
                          type="button"
                          onClick={() => handleRemoveAmenity(amenity)}
                          className="rounded-full p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4">
              <Link href={ROUTES.owner.venues}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting} className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900">
                {isSubmitting ? "Saving Draft..." : "Create Venue (Draft)"}
              </Button>
            </div>
          </form>
        </div>
      </OwnerLayout>
    </RoleGuard>
  );
}
