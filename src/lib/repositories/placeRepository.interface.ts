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

  /**
   * Fetches all places.
   */
  findAll(): Promise<PlaceDetails[]>;

  /**
   * Updates an existing place details entry.
   */
  update(id: string, place: PlaceDetails): Promise<void>;

  /**
   * Deletes an existing place details entry.
   */
  delete(id: string): Promise<void>;
}
