import { Client, Databases, ID, Query } from "node-appwrite";
import { PlaceDetails, PlaceType } from "@/types/place";
import { PlaceRepository, PlaceSubmissionAudit } from "./placeRepository.interface";
import { Logger } from "../logger";

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
    }
  }

  public isConfigured(): boolean {
    return this.databases !== null;
  }

  public async save(place: PlaceDetails, audit: PlaceSubmissionAudit): Promise<string> {
    if (!this.databases) {
      throw new Error("Appwrite Cloud is not configured. APPWRITE_PROJECT_ID and APPWRITE_API_KEY must be set.");
    }

    try {
      const documentData = {
        placeName: place.placeName,
        description: place.description,
        placeType: place.placeType,
        mainCategory: place.mainCategory,
        categories: place.categories,
        images: place.images || [],
        city: place.city,
        area: place.area,
        state: place.state,
        latitude: place.latitude,
        longitude: place.longitude,
        bestTimings: place.bestTimings,
        closedOn: place.closedOn,
        nearestMetro: place.nearestMetro,
        crowdLevel: place.crowdLevel,
        safetyNote: place.safetyNote,
        entryFee: place.entryFee,
        likes: place.likes || 0,
        saves: place.saves || 0,
        visited: place.visited || 0,
        uploaderId: place.uploaderId,
        uploaderBadge: place.uploaderBadge || "Founder",
        createdAt: place.createdAt,
        updatedAt: place.updatedAt,
      };

      const doc = await this.databases.createDocument(
        this.databaseId,
        this.collectionId,
        place.id || ID.unique(),
        documentData
      );

      Logger.info(`Place document created in Appwrite Cloud with Document ID: ${doc.$id}`);
      return audit.submissionId;
    } catch (error: any) {
      Logger.error("Failed to create document in Appwrite Cloud:", error?.message || error);
      throw new Error(`Appwrite Cloud error: ${error?.message || "Failed to create document"}`);
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

      return res.documents.map((doc: any) => ({
        id: doc.$id || doc.id,
        placeName: doc.placeName || "Untitled Place",
        description: doc.description || "",
        placeType: (doc.placeType || "Spot") as PlaceType,
        mainCategory: doc.mainCategory || "General",
        categories: Array.isArray(doc.categories) ? doc.categories : [],
        images: Array.isArray(doc.images) ? doc.images : [],
        city: doc.city || "",
        area: doc.area || "",
        state: doc.state || "",
        latitude: doc.latitude || "0",
        longitude: doc.longitude || "0",
        bestTimings: doc.bestTimings || "",
        closedOn: doc.closedOn || "",
        nearestMetro: doc.nearestMetro || "",
        crowdLevel: doc.crowdLevel || "",
        safetyNote: doc.safetyNote || "",
        entryFee: doc.entryFee || "",
        likes: typeof doc.likes === "number" ? doc.likes : 0,
        saves: typeof doc.saves === "number" ? doc.saves : 0,
        visited: typeof doc.visited === "number" ? doc.visited : 0,
        uploaderId: doc.uploaderId || "Admin",
        uploaderBadge: doc.uploaderBadge || doc.badge || "Founder",
        createdAt: doc.$createdAt || doc.createdAt || new Date().toISOString(),
        updatedAt: doc.$updatedAt || doc.updatedAt || new Date().toISOString(),
      }));
    } catch (error: any) {
      Logger.error("Failed to list documents from Appwrite Cloud:", error?.message || error);
      throw new Error(`Appwrite Cloud error: ${error?.message || "Failed to fetch documents"}`);
    }
  }

  public async update(id: string, place: PlaceDetails): Promise<void> {
    if (!this.databases) {
      throw new Error("Appwrite Cloud is not configured.");
    }

    try {
      const updateData = {
        placeName: place.placeName,
        description: place.description,
        placeType: place.placeType,
        mainCategory: place.mainCategory,
        categories: place.categories,
        images: place.images || [],
        city: place.city,
        area: place.area,
        state: place.state,
        latitude: place.latitude,
        longitude: place.longitude,
        bestTimings: place.bestTimings,
        closedOn: place.closedOn,
        nearestMetro: place.nearestMetro,
        crowdLevel: place.crowdLevel,
        safetyNote: place.safetyNote,
        entryFee: place.entryFee,
        likes: place.likes,
        saves: place.saves,
        visited: place.visited,
        uploaderId: place.uploaderId,
        uploaderBadge: place.uploaderBadge || "Founder",
        updatedAt: new Date().toISOString(),
      };

      await this.databases.updateDocument(
        this.databaseId,
        this.collectionId,
        id,
        updateData
      );

      Logger.info(`Place document ${id} updated in Appwrite Cloud.`);
    } catch (error: any) {
      Logger.error(`Failed to update document ${id} in Appwrite Cloud:`, error?.message || error);
      throw new Error(`Appwrite Cloud error: ${error?.message || "Failed to update document"}`);
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
    } catch (error: any) {
      Logger.error(`Failed to delete document ${id} from Appwrite Cloud:`, error?.message || error);
      throw new Error(`Appwrite Cloud error: ${error?.message || "Failed to delete document"}`);
    }
  }
}
