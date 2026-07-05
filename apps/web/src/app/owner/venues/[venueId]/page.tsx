"use client";

import axios from "axios";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Image as ImageIcon,
  Plus,
  Star,
  Trash2,
  UploadCloud,
  Video as VideoIcon,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import { toast } from "sonner";

import { RoleGuard } from "@/components/auth/role-guard";
import { OwnerLayout } from "@/components/layout/owner-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listEventTypesApi } from "@/features/catalog/catalog-api";
import {
  confirmImageUploadApi,
  confirmVideoUploadApi,
  createImageUploadUrlApi,
  createVideoUploadUrlApi,
  deleteImageApi,
  deleteVideoApi,
  getVenueApi,
  setPrimaryImageApi,
  updateVenueApi,
} from "@/features/venues/venues-api";
import { VenueCalendarAvailabilityManager } from "@/features/venues/venue-calendar-availability-manager";
import type { EventType, Venue } from "@/features/venues/types";
import { ROUTES } from "@/lib/routes";
import { useAppSelector } from "@/store/hooks";

export default function EditVenuePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const venueId = String(params.venueId ?? "");

  const { accessToken } = useAppSelector((state) => state.auth);

  const [venue, setVenue] = useState<Venue | null>(null);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [amenityInput, setAmenityInput] = useState("");

  const [activeTab, setActiveTab] = useState<
    "general" | "events" | "media" | "availability"
  >(searchParams.get("tab") === "availability" ? "availability" : "general");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  async function loadData() {
    if (!accessToken || !venueId) return;
    try {
      const data = await getVenueApi(venueId, accessToken);
      if (!data) {
        toast.error("Venue not found");
        router.push(ROUTES.owner.venues);
        return;
      }
      setVenue(data);
      setSelectedEventTypes(data.eventTypes.map((et) => et.eventTypeId));
      setAmenities(data.amenities.map((a) => a.name));

      const types = await listEventTypesApi(accessToken);
      setEventTypes(types);
    } catch (error) {
      console.error("Failed to load venue details", error);
      toast.error("Failed to load details");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, venueId]);

  if (isLoading) {
    return (
      <RoleGuard allowedRoles={["OWNER"]}>
        <OwnerLayout>
          <div className="flex h-96 items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-100" />
          </div>
        </OwnerLayout>
      </RoleGuard>
    );
  }

  if (!venue) return null;

  // Venues are editable in DRAFT and REJECTED statuses
  const isEditable = venue.status === "DRAFT" || venue.status === "REJECTED";

  async function handleGeneralUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!venue || !accessToken || !isEditable) return;

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "");
    const addressLine1 = String(formData.get("addressLine1") ?? "");
    const addressLine2 = String(formData.get("addressLine2") ?? "") || null;
    const city = String(formData.get("city") ?? "");
    const state = String(formData.get("state") ?? "");
    const country = String(formData.get("country") ?? "India");
    const postalCode = String(formData.get("postalCode") ?? "") || null;
    const district = String(formData.get("district") ?? "") || null;
    const shortDescription = String(formData.get("shortDescription") ?? "") || null;
    const description = String(formData.get("description") ?? "") || null;

    const capMinRaw = formData.get("capacityMin");
    const capMaxRaw = formData.get("capacityMax");
    const capacityMin = capMinRaw ? Number(capMinRaw) : null;
    const capacityMax = capMaxRaw ? Number(capMaxRaw) : null;
    const basePricePerSlot = Number(formData.get("basePricePerSlot"));

    if (capacityMin && capacityMax && capacityMin > capacityMax) {
      toast.error("Validation error", {
        description: "Minimum capacity cannot be greater than maximum capacity.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateVenueApi(
        venue.id,
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
          basePricePerSlot,
        },
        accessToken
      );

      if (updated) {
        setVenue(updated);
        toast.success("General information updated");
      }
    } catch (error) {
      toast.error("Failed to update general info");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleEventsAndAmenitiesUpdate() {
    if (!venue || !accessToken || !isEditable) return;
    setIsSaving(true);

    try {
      const updated = await updateVenueApi(
        venue.id,
        {
          eventTypeIds: selectedEventTypes,
          amenityNames: amenities,
        },
        accessToken
      );

      if (updated) {
        setVenue(updated);
        toast.success("Event categories & amenities updated");
      }
    } catch (error) {
      toast.error("Failed to update categories & amenities");
    } finally {
      setIsSaving(false);
    }
  }

  function handleAddAmenity() {
    const trimmed = amenityInput.trim();
    if (!trimmed) return;
    if (amenities.includes(trimmed)) return;
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

  async function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!venue || !files || files.length === 0 || !accessToken) return;
    const file = files[0];

    setIsUploading(true);
    const toastId = toast.loading("Uploading image to storage...");

    try {
      // 1. Get presigned upload URL
      const uploadDetails = await createImageUploadUrlApi(
        venue.id,
        file.name,
        file.type,
        accessToken
      );

      if (!uploadDetails) {
        throw new Error("Failed to initialize upload session");
      }

      // 2. Put file directly to storage
      await axios.put(uploadDetails.uploadUrl, file, {
        headers: { "Content-Type": file.type },
      });

      // 3. Confirm upload with API
      const newImage = await confirmImageUploadApi(
        venue.id,
        uploadDetails.storagePath,
        accessToken
      );

      if (newImage) {
        setVenue((prev) =>
          prev
            ? { ...prev, images: [...(prev.images || []), newImage] }
            : null
        );
        toast.success("Image uploaded successfully", { id: toastId });
      } else {
        throw new Error("Failed to verify image registration");
      }
    } catch (error) {
      toast.error("Upload failed", {
        id: toastId,
        description: error instanceof Error ? error.message : "Network error occurred",
      });
    } finally {
      setIsUploading(false);
    }
  }

  async function handleVideoUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!venue || !files || files.length === 0 || !accessToken) return;
    const file = files[0];

    setIsUploading(true);
    const toastId = toast.loading("Uploading video to storage...");

    try {
      // 1. Get presigned upload URL
      const uploadDetails = await createVideoUploadUrlApi(
        venue.id,
        file.name,
        file.type,
        accessToken
      );

      if (!uploadDetails) {
        throw new Error("Failed to initialize upload session");
      }

      // 2. Put file to storage
      await axios.put(uploadDetails.uploadUrl, file, {
        headers: { "Content-Type": file.type },
      });

      // 3. Confirm upload
      const newVideo = await confirmVideoUploadApi(
        venue.id,
        uploadDetails.storagePath,
        accessToken
      );

      if (newVideo) {
        setVenue((prev) =>
          prev
            ? { ...prev, videos: [...(prev.videos || []), newVideo] }
            : null
        );
        toast.success("Video uploaded successfully", { id: toastId });
      } else {
        throw new Error("Failed to register video");
      }
    } catch (error) {
      toast.error("Upload failed", {
        id: toastId,
        description: error instanceof Error ? error.message : "Network error occurred",
      });
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSetPrimaryImage(imageId: string) {
    if (!venue || !accessToken || !isEditable) return;
    try {
      const updatedImages = await setPrimaryImageApi(venue.id, imageId, accessToken);
      setVenue((prev) => (prev ? { ...prev, images: updatedImages } : null));
      toast.success("Primary image updated");
    } catch (error) {
      toast.error("Failed to set primary image");
    }
  }

  async function handleDeleteImage(imageId: string) {
    if (!venue || !accessToken || !isEditable) return;
    const confirmed = window.confirm("Delete this image?");
    if (!confirmed) return;

    try {
      const success = await deleteImageApi(venue.id, imageId, accessToken);
      if (success) {
        setVenue((prev) =>
          prev
            ? { ...prev, images: prev.images.filter((img) => img.id !== imageId) }
            : null
        );
        toast.success("Image deleted");
      }
    } catch (error) {
      toast.error("Failed to delete image");
    }
  }

  async function handleDeleteVideo(videoId: string) {
    if (!venue || !accessToken || !isEditable) return;
    const confirmed = window.confirm("Delete this video?");
    if (!confirmed) return;

    try {
      const success = await deleteVideoApi(venue.id, videoId, accessToken);
      if (success) {
        setVenue((prev) =>
          prev
            ? { ...prev, videos: prev.videos.filter((vid) => vid.id !== videoId) }
            : null
        );
        toast.success("Video deleted");
      }
    } catch (error) {
      toast.error("Failed to delete video");
    }
  }

  async function handleSubmitForApproval() {
    if (!venue || !accessToken) return;

    // Client-side validations matching the backend submit checks
    const errors: string[] = [];
    if (!venue.capacityMin || !venue.capacityMax) {
      errors.push("Min capacity and max capacity fields are required.");
    } else if (venue.capacityMin > venue.capacityMax) {
      errors.push("Min capacity cannot exceed max capacity.");
    }
    if (!venue.eventTypes || venue.eventTypes.length === 0) {
      errors.push("At least one event type must be selected.");
    }
    if (!venue.amenities || venue.amenities.length === 0) {
      errors.push("At least one amenity must be listed.");
    }
    if (!venue.images || venue.images.length === 0) {
      errors.push("At least one photo must be uploaded.");
    } else {
      const primaryCount = venue.images.filter((i) => i.isPrimary).length;
      if (primaryCount !== 1) {
        errors.push("One image must be set as Primary.");
      }
    }

    if (errors.length > 0) {
      toast.error("Cannot submit for approval", {
        description: (
          <ul className="list-disc pl-4 space-y-1 mt-1 text-xs">
            {errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        ),
      });
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateVenueApi(
        venue.id,
        { status: "PENDING_APPROVAL" },
        accessToken
      );
      if (updated) {
        setVenue(updated);
        toast.success("Submitted successfully", {
          description: "Your venue listing has been sent to administrators for review.",
        });
      }
    } catch (error) {
      toast.error("Submission failed", {
        description: error instanceof Error ? error.message : "Error contacting server",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <RoleGuard allowedRoles={["OWNER"]}>
      <OwnerLayout>
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
          {/* Header Controls */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Link href={ROUTES.owner.venues}>
                <Button variant="ghost" size="icon" className="rounded-full border border-zinc-200 dark:border-zinc-800">
                  <ArrowLeft className="size-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
                  {venue.name}
                </h1>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Manage listing information, amenities, media, and approval status.
                </p>
              </div>
            </div>

            {isEditable && (
              <Button
                onClick={handleSubmitForApproval}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold dark:bg-emerald-500 dark:hover:bg-emerald-600"
              >
                Submit for Approval
              </Button>
            )}
          </div>

          {/* Status Banner */}
          {venue.status === "PENDING_APPROVAL" && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 flex gap-3 text-sm text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-400">
              <Clock className="size-5 shrink-0" />
              <div>
                <h4 className="font-bold">Pending Review</h4>
                <p className="text-xs text-amber-700 dark:text-amber-500 mt-0.5">
                  This listing is currently read-only as administrators verify the credentials.
                </p>
              </div>
            </div>
          )}

          {venue.status === "ACTIVE" && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 flex gap-3 text-sm text-emerald-800 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-400">
              <CheckCircle className="size-5 shrink-0" />
              <div>
                <h4 className="font-bold">Published & Active</h4>
                <p className="text-xs text-emerald-755 dark:text-emerald-500 mt-0.5">
                  This venue is active and discoverable on the search page. To request edits, contact support.
                </p>
              </div>
            </div>
          )}

          {venue.status === "REJECTED" && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 flex gap-3 text-sm text-rose-800 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-455">
              <AlertTriangle className="size-5 shrink-0" />
              <div>
                <h4 className="font-bold">Rejected by Admin</h4>
                <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">
                  Reason: {venue.rejectionReason || "No explanation provided. Please update info and re-submit."}
                </p>
              </div>
            </div>
          )}

          {/* Tabs Navigation */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-800">
            {(["general", "events", "media", "availability"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 px-6 py-3 text-sm font-semibold capitalize transition-all duration-200 -mb-[2px] ${
                  activeTab === tab
                    ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-white"
                    : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-350"
                  }`}
              >
                {tab === "general"
                  ? "General Details"
                  : tab === "events"
                    ? "Event Types & Amenities"
                    : tab === "media"
                      ? "Photos & Media"
                      : "Availability"}
              </button>
            ))}
          </div>

          {/* Tab Content Panels */}
          <div className="space-y-6">
            {activeTab === "general" && (
              <form onSubmit={handleGeneralUpdate} className="space-y-6">
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-850 dark:bg-zinc-900/50 space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="name">Venue Name</Label>
                      <Input
                        id="name"
                        name="name"
                        defaultValue={venue.name}
                        disabled={!isEditable}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="capacityMin">Min Capacity</Label>
                      <Input
                        id="capacityMin"
                        name="capacityMin"
                        type="number"
                        defaultValue={venue.capacityMin ?? ""}
                        disabled={!isEditable}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="capacityMax">Max Capacity</Label>
                      <Input
                        id="capacityMax"
                        name="capacityMax"
                        type="number"
                        defaultValue={venue.capacityMax ?? ""}
                        disabled={!isEditable}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="shortDescription">Short Description</Label>
                      <Input
                        id="shortDescription"
                        name="shortDescription"
                        defaultValue={venue.shortDescription ?? ""}
                        disabled={!isEditable}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="basePricePerSlot">Default price per slot (INR)</Label>
                      <Input id="basePricePerSlot" name="basePricePerSlot" type="number" min="0.01" step="0.01" defaultValue={venue.basePricePerSlot} disabled={!isEditable} required />
                      <p className="text-xs text-zinc-500">This price will be used for all slots unless a custom slot price is provided.</p>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="description">Long Description</Label>
                      <textarea
                        id="description"
                        name="description"
                        rows={4}
                        defaultValue={venue.description ?? ""}
                        disabled={!isEditable}
                        className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-850 dark:bg-zinc-900/50 space-y-6">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">Location Details</h3>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="addressLine1">Address Line 1</Label>
                      <Input
                        id="addressLine1"
                        name="addressLine1"
                        defaultValue={venue.addressLine1}
                        disabled={!isEditable}
                        required
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                      <Input
                        id="addressLine2"
                        name="addressLine2"
                        defaultValue={venue.addressLine2 ?? ""}
                        disabled={!isEditable}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="city"
                        defaultValue={venue.city}
                        disabled={!isEditable}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="district">District (Optional)</Label>
                      <Input
                        id="district"
                        name="district"
                        defaultValue={venue.district ?? ""}
                        disabled={!isEditable}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        name="state"
                        defaultValue={venue.state}
                        disabled={!isEditable}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        name="postalCode"
                        defaultValue={venue.postalCode ?? ""}
                        disabled={!isEditable}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        name="country"
                        defaultValue={venue.country}
                        disabled={!isEditable}
                        required
                      />
                    </div>
                  </div>
                </div>

                {isEditable && (
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSaving} className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900">
                      {isSaving ? "Saving..." : "Save General Details"}
                    </Button>
                  </div>
                )}
              </form>
            )}

            {activeTab === "events" && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-850 dark:bg-zinc-900/50 space-y-6">
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
                              className={`flex items-center gap-3 rounded-xl border p-3.5 text-xs font-semibold cursor-pointer transition-all duration-200 ${
                                isChecked
                                  ? "border-zinc-900 bg-zinc-50 text-zinc-900 dark:border-zinc-100 dark:bg-zinc-800/10 dark:text-white"
                                  : "border-zinc-200 text-zinc-655 dark:border-zinc-800 dark:text-zinc-400"
                              } ${!isEditable ? "opacity-60 cursor-not-allowed" : "hover:bg-zinc-50 dark:hover:bg-zinc-850/30"}`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={!isEditable}
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

                  <div className="space-y-4 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                    <Label htmlFor="amenityInput">Add Amenities</Label>
                    <div className="flex gap-2">
                      <Input
                        id="amenityInput"
                        placeholder="Wi-Fi, Free Parking, Air Conditioning..."
                        value={amenityInput}
                        disabled={!isEditable}
                        onChange={(e) => setAmenityInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddAmenity();
                          }
                        }}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={handleAddAmenity}
                        disabled={!isEditable}
                        variant="outline"
                        className="gap-2"
                      >
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
                            {isEditable && (
                              <button
                                type="button"
                                onClick={() => handleRemoveAmenity(amenity)}
                                className="rounded-full p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                              >
                                <X className="size-3" />
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {isEditable && (
                  <div className="flex justify-end">
                    <Button onClick={handleEventsAndAmenitiesUpdate} disabled={isSaving} className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900">
                      {isSaving ? "Saving..." : "Save Categories & Amenities"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "media" && (
              <div className="space-y-8">
                {/* Images Upload */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-850 dark:bg-zinc-900/50 space-y-6">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                    <div>
                      <h3 className="text-base font-bold text-zinc-900 dark:text-white">Venue Photos</h3>
                      <p className="text-2xs text-zinc-500">Upload up to 10 high-resolution photos of your event space. Max 10 images.</p>
                    </div>

                    {isEditable && (venue.images?.length || 0) < 10 && (
                      <label className="relative cursor-pointer">
                        <span className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 text-xs font-semibold dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900">
                          <UploadCloud className="size-4" />
                          Upload Photo
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          disabled={isUploading}
                          onChange={handleImageUpload}
                          className="sr-only"
                        />
                      </label>
                    )}
                  </div>

                  {venue.images?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-zinc-400">
                      <ImageIcon className="size-10 mb-2" />
                      <p className="text-xs font-medium">No images uploaded yet.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                      {venue.images?.map((img) => (
                        <div
                          key={img.id}
                          className="group relative h-40 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-850 dark:bg-zinc-800"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.imageUrl}
                            alt="Venue space"
                            className="h-full w-full object-cover"
                          />

                          {/* Primary Badge */}
                          {img.isPrimary && (
                            <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-zinc-900/90 text-yellow-400 px-2 py-0.5 text-2xs font-bold shadow-sm backdrop-blur-xs">
                              <Star className="size-3 fill-yellow-400" />
                              Primary
                            </span>
                          )}

                          {/* Overlays / Control Actions */}
                          {isEditable && (
                            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/45 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                              {!img.isPrimary && (
                                <Button
                                  onClick={() => handleSetPrimaryImage(img.id)}
                                  size="sm"
                                  className="h-8 gap-1.5 bg-white text-zinc-900 hover:bg-zinc-100 text-2xs"
                                >
                                  Make Primary
                                </Button>
                              )}
                              <Button
                                onClick={() => handleDeleteImage(img.id)}
                                variant="destructive"
                                size="icon"
                                className="size-8"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Videos Upload */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-850 dark:bg-zinc-900/50 space-y-6">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                    <div>
                      <h3 className="text-base font-bold text-zinc-900 dark:text-white">Venue Videos</h3>
                      <p className="text-2xs text-zinc-500">Upload virtual tour files of the venue. Max 3 videos (MP4 formats supported).</p>
                    </div>

                    {isEditable && (venue.videos?.length || 0) < 3 && (
                      <label className="relative cursor-pointer">
                        <span className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 text-xs font-semibold dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900">
                          <UploadCloud className="size-4" />
                          Upload Video
                        </span>
                        <input
                          type="file"
                          accept="video/mp4"
                          disabled={isUploading}
                          onChange={handleVideoUpload}
                          className="sr-only"
                        />
                      </label>
                    )}
                  </div>

                  {venue.videos?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-zinc-400">
                      <VideoIcon className="size-10 mb-2" />
                      <p className="text-xs font-medium">No videos uploaded yet.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {venue.videos?.map((vid) => (
                        <div
                          key={vid.id}
                          className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-850 dark:bg-zinc-800"
                        >
                          <video
                            src={vid.videoUrl}
                            controls
                            className="w-full h-44 object-cover"
                          />

                          {/* Control Overlay */}
                          {isEditable && (
                            <div className="absolute top-3 right-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                              <Button
                                onClick={() => handleDeleteVideo(vid.id)}
                                variant="destructive"
                                size="icon"
                                className="size-8"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "availability" && (
              <VenueCalendarAvailabilityManager
                venueId={venue.id}
                accessToken={accessToken}
              />
            )}
          </div>
        </div>
      </OwnerLayout>
    </RoleGuard>
  );
}
