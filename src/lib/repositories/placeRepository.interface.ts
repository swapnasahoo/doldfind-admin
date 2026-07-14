import { PlaceDetails } from "@/types/place";

export interface PlaceSubmissionAudit {
  submissionId: string;
  submittedAt: string;
  submittedBy: string;
  badge: string;
  ipAddress: string;
  userAgent: string;
}

export interface PlaceRepository {
  /**
   * Persists a place details entry and its submission audit log.
   * Returns the submissionId upon successful save.
   */
  save(place: PlaceDetails, audit: PlaceSubmissionAudit): Promise<string>;
}
