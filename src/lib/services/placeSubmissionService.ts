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
   * Processes the raw form data, automatically appends backend parameters (defaults, IDs, uploaderId, timestamps),
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

    // 2. Generate backend unique IDs and timestamps
    const placeId = crypto.randomUUID();
    const submissionId = crypto.randomUUID();
    const submittedAt = new Date().toISOString();

    const placeDetails: PlaceDetails = {
      placeName: parsed.placeName,
      description: parsed.description,
      placeType: parsed.placeType,
      mainCategory: parsed.mainCategory,
      categories: parsed.categories,
      images: parsed.images,
      city: parsed.city,
      area: parsed.area,
      state: parsed.state,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      bestTimings: parsed.bestTimings,
      closedOn: parsed.closedOn,
      nearestMetro: parsed.nearestMetro,
      crowdLevel: parsed.crowdLevel,
      safetyNote: parsed.safetyNote,
      entryFee: parsed.entryFee,
      likes: 0,
      saves: 0,
      visited: 0,
      uploaderId: uploader.username,
      uploaderBadge: uploader.badge,
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
