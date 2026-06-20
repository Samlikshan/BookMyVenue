export type VenueStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "ACTIVE"
  | "REJECTED"
  | "SUSPENDED";

export interface EventType {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface VenueEventTypeRelation {
  venueId: string;
  eventTypeId: string;
  eventType: EventType;
}

export interface VenueImage {
  id: string;
  venueId: string;
  imageUrl: string;
  storagePath: string | null;
  isPrimary: boolean;
  createdAt: string;
}

export interface VenueVideo {
  id: string;
  venueId: string;
  videoUrl: string;
  storagePath: string | null;
  createdAt: string;
}

export interface VenueAmenity {
  id: string;
  venueId: string;
  name: string;
}

export interface VenueAvailability {
  id: string;
  venueId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VenueSlotTemplate {
  id: string;
  venueId: string;
  name: string | null;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type VenueDateSlotSource = "TEMPLATE" | "CUSTOM";

export interface VenueDateSlot {
  id: string;
  venueId: string;
  slotTemplateId: string | null;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  source: VenueDateSlotSource;
  createdAt: string;
  updatedAt: string;
}

export interface Venue {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  status: VenueStatus;
  capacityMin: number | null;
  capacityMax: number | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  district: string | null;
  state: string;
  country: string;
  postalCode: string | null;
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  images: VenueImage[];
  videos: VenueVideo[];
  amenities: VenueAmenity[];
  eventTypes: VenueEventTypeRelation[];
}

export interface CreateVenueInput {
  ownerId: string;
  name: string;
  addressLine1: string;
  city: string;
  state: string;
  shortDescription?: string | null;
  description?: string | null;
  capacityMin?: number | null;
  capacityMax?: number | null;
  addressLine2?: string | null;
  district?: string | null;
  country?: string;
  postalCode?: string | null;
  eventTypeIds?: string[];
  amenityNames?: string[];
  status?: VenueStatus;
}

export type UpdateVenueInput = Partial<Omit<CreateVenueInput, "ownerId">>;

export interface CreateVenueAvailabilityPayload {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface UpdateVenueAvailabilityPayload {
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  isActive?: boolean;
}

export interface CreateVenueSlotTemplatePayload {
  name?: string | null;
  startTime: string;
  endTime: string;
}

export interface UpdateVenueSlotTemplatePayload {
  name?: string | null;
  startTime?: string;
  endTime?: string;
  isActive?: boolean;
}

export interface ApplyVenueSlotTemplatesPayload {
  dates: string[];
  slotTemplateIds: string[];
  mode: "MERGE";
}

export interface CreateCustomVenueDateSlotPayload {
  date: string;
  startTime: string;
  endTime: string;
}

export interface UpdateVenueDateSlotPayload {
  startTime?: string;
  endTime?: string;
  isAvailable?: boolean;
}
