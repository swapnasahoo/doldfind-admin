import { PlaceRepository, PlaceSubmissionAudit } from "../repositories/placeRepository.interface";
import { PlaceDetails, PlaceFormValues } from "@/types/place";
import { parseIncomingPayload } from "../parser";
import { Logger } from "../logger";

export class PlaceSubmissionService {
  private repository: PlaceRepository;

  constructor(repository: PlaceRepository) {
    this.repository = repository;
  }

  /**
   * Processes the raw form data, automatically appends backend parameters (defaults, IDs, session uploader, timestamps),
   * validates standards, and stores the entry via the repository.
   */
  public async submit(
    rawData: PlaceFormValues,
    uploader: { username: string; badge: string },
    auditMeta: { ip: string; userAgent: string }
  ): Promise<{ success: boolean; submissionId: string }> {
    Logger.info(`Starting place submission processing for user: ${uploader.username}`);

    // 1. Process and normalize values using the independent parser
    const parsed = parseIncomingPayload(rawData);

    // 2. Generate backend unique IDs and default records
    const placeId = crypto.randomUUID();
    const submissionId = crypto.randomUUID();
    const submittedAt = new Date().toISOString();

    const placeDetails: PlaceDetails = {
      id: placeId,
      title: parsed.title,
      categories: parsed.categories,
      description: parsed.description,
      location: parsed.location,
      coordinates: parsed.coordinates,
      infoCards: parsed.infoCards,
      safetyNote: parsed.safetyNote,
      stats: {
        likes: 0,
        saves: 0,
        visited: 0,
      },
      similarSpots: [],
      uploader: {
        username: uploader.username,
        badge: uploader.badge,
      },
      reviews: [],
    };

    const auditLog: PlaceSubmissionAudit = {
      submissionId,
      submittedAt,
      submittedBy: uploader.username,
      badge: uploader.badge,
      ipAddress: auditMeta.ip,
      userAgent: auditMeta.userAgent,
    };

    // 3. Save details via the repository abstraction
    await this.repository.save(placeDetails, auditLog);

    return {
      success: true,
      submissionId,
    };
  }
}
export default PlaceSubmissionService;
