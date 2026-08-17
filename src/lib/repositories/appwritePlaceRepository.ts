import { Client, Databases, ID, Query, Models } from "node-appwrite";
import { PlaceDetails, PlaceType } from "@/types/place";
import { PlaceRepository, PlaceSubmissionAudit } from "./placeRepository.interface";
import { Logger } from "../logger";

type AppwriteDocument = Models.Document & Record<string, unknown>;

export class AppwritePlaceRepository implements PlaceRepository {
  private databases: Databases | null = null;
  private databaseId: string;
  private collectionId: string;

  constructor(endpoint: string, projectId: string, apiKey: string, databaseId: string, collectionId: string) {
    this.databaseId = databaseId || "doldfind-db";
    this.collectionId = collectionId || "places";

    if (projectId && apiKey) {
      try {
        const client = new Client()
          .setEndpoint(endpoint || "https://cloud.appwrite.io/v1")
          .setProject(projectId)
          .setKey(apiKey);

        this.databases = new Databases(client);
        Logger.info("Appwrite Cloud Databases client initialized successfully.");
      } catch (err) {
        Logger.error("Failed to initialize Appwrite SDK client:", err);
      }
    } else {
      Logger.warn("Appwrite Cloud credentials missing in environment variables.");
    }
  }

  public isConfigured(): boolean {
    return this.databases !== null;
  }

  public async save(place: PlaceDetails, audit: PlaceSubmissionAudit): Promise<string> {
    if (!this.databases) {
      throw new Error("Appwrite Cloud is not configured.");
    }

    try {
      const documentData = {
        placeName: (place.placeName || "").slice(0, 128),
        description: (place.description || "").slice(0, 5000),
        placeType: place.placeType,
        mainCategory: (place.mainCategory || "").slice(0, 32),
        categories: (place.categories || []).map((cat) => cat.slice(0, 32)),
        images: place.images || [],
        city: (place.city || "").slice(0, 64),
        area: (place.area || "").slice(0, 150),
        state: (place.state || "").slice(0, 20),
        bestTimings: (place.bestTimings || "").slice(0, 32),
        closedOn: (place.closedOn || "").slice(0, 12),
        nearestMetro: (place.nearestMetro || "").slice(0, 150),
        crowdLevel: place.crowdLevel,
        safetyNote: (place.safetyNote || "").slice(0, 192),
        entryFee: (place.entryFee || "").slice(0, 128),
        likes: place.likes || 0,
        saves: place.saves || 0,
        visited: place.visited || 0,
        uploaderId: (audit.submittedBy || place.uploaderId || "Admin").slice(0, 40),
        uploaderBadge: (audit.badge || place.uploaderBadge || "Founder").slice(0, 20),
        bestSeason: place.bestSeason,
        openingHours: place.openingHours,
        transportType: place.transportType,
        coordinates: place.coordinates || [0, 0],
      };

      const doc = await this.databases.createDocument(
        this.databaseId,
        this.collectionId,
        place.id || ID.unique(),
        documentData
      );

      Logger.info(`Place document created in Appwrite Cloud with Document ID: ${doc.$id}`);
      return audit.submissionId;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      Logger.error("Failed to create document in Appwrite Cloud:", msg);
      throw new Error(`Appwrite Cloud error: ${msg}`);
    }
  }

  public async findAll(): Promise<PlaceDetails[]> {
    if (!this.databases) {
      throw new Error("Appwrite Cloud is not configured.");
    }

    try {
      const res = await this.databases.listDocuments(
        this.databaseId,
        this.collectionId,
        [Query.orderDesc("$createdAt"), Query.limit(100)]
      );

      return res.documents.map((rawDoc) => {
        const doc = rawDoc as AppwriteDocument;
        return {
          id: doc.$id,
          placeName: (doc.placeName as string) || "Untitled Place",
          description: (doc.description as string) || "",
          placeType: ((doc.placeType as string) || "Spot") as PlaceType,
          mainCategory: (doc.mainCategory as string) || "General",
          categories: Array.isArray(doc.categories) ? (doc.categories as string[]) : [],
          images: Array.isArray(doc.images) ? (doc.images as string[]) : [],
          city: (doc.city as string) || "",
          area: (doc.area as string) || "",
          state: (doc.state as string) || "",
          bestTimings: (doc.bestTimings as string) || "",
          closedOn: (doc.closedOn as string) || "",
          nearestMetro: (doc.nearestMetro as string) || "",
          crowdLevel: (doc.crowdLevel as string) || "",
          safetyNote: (doc.safetyNote as string) || "",
          entryFee: (doc.entryFee as string) || "",
          likes: Number(doc.likes ?? 0),
          saves: Number(doc.saves ?? 0),
          visited: Number(doc.visited ?? 0),
          uploaderId: (doc.uploaderId as string) || "Admin",
          uploaderBadge: (doc.uploaderBadge as string) || (doc.badge as string) || "Founder",
          bestSeason: (doc.bestSeason as string) || "",
          openingHours: (doc.openingHours as string) || "",
          transportType: (doc.transportType as string) || "",
          coordinates: Array.isArray(doc.coordinates) ? (doc.coordinates as [number, number]) : [0, 0],
          createdAt: doc.$createdAt || new Date().toISOString(),
          updatedAt: doc.$updatedAt || new Date().toISOString(),
        };
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      Logger.error("Failed to list documents from Appwrite Cloud:", msg);
      throw new Error(`Appwrite Cloud error: ${msg}`);
    }
  }

  public async update(id: string, place: PlaceDetails): Promise<void> {
    if (!this.databases) {
      throw new Error("Appwrite Cloud is not configured.");
    }

    try {
      const updateData = {
        placeName: (place.placeName || "").slice(0, 128),
        description: (place.description || "").slice(0, 5000),
        placeType: place.placeType,
        mainCategory: (place.mainCategory || "").slice(0, 32),
        categories: (place.categories || []).map((cat) => cat.slice(0, 32)),
        images: place.images || [],
        city: (place.city || "").slice(0, 64),
        area: (place.area || "").slice(0, 150),
        state: (place.state || "").slice(0, 20),
        bestTimings: (place.bestTimings || "").slice(0, 32),
        closedOn: (place.closedOn || "").slice(0, 12),
        nearestMetro: (place.nearestMetro || "").slice(0, 150),
        crowdLevel: place.crowdLevel,
        safetyNote: (place.safetyNote || "").slice(0, 192),
        entryFee: (place.entryFee || "").slice(0, 128),
        likes: place.likes || 0,
        saves: place.saves || 0,
        visited: place.visited || 0,
        uploaderId: (place.uploaderId || "Admin").slice(0, 40),
        uploaderBadge: (place.uploaderBadge || "Founder").slice(0, 20),
        bestSeason: place.bestSeason,
        openingHours: place.openingHours,
        transportType: place.transportType,
        coordinates: place.coordinates || [0, 0],
      };

      await this.databases.updateDocument(
        this.databaseId,
        this.collectionId,
        id,
        updateData
      );

      Logger.info(`Place document ${id} updated in Appwrite Cloud.`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      Logger.error(`Failed to update document ${id} in Appwrite Cloud:`, msg);
      throw new Error(`Appwrite Cloud error: ${msg}`);
    }
  }

  public async delete(id: string): Promise<void> {
    if (!this.databases) {
      throw new Error("Appwrite Cloud is not configured.");
    }

    try {
      await this.databases.deleteDocument(
        this.databaseId,
        this.collectionId,
        id
      );

      Logger.info(`Place document ${id} deleted from Appwrite Cloud.`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      Logger.error(`Failed to delete document ${id} from Appwrite Cloud:`, msg);
      throw new Error(`Appwrite Cloud error: ${msg}`);
    }
  }
}
