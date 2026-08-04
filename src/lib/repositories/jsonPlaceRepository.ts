import fs from "fs/promises";
import path from "path";
import { PlaceDetails } from "@/types/place";
import { PlaceRepository, PlaceSubmissionAudit } from "./placeRepository.interface";
import { Logger } from "../logger";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "places.json");

export class JsonPlaceRepository implements PlaceRepository {
  /**
   * Ensures the data directory and places.json file exist.
   */
  private async ensureStorageExists(): Promise<void> {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      try {
        await fs.access(FILE_PATH);
      } catch {
        await fs.writeFile(FILE_PATH, JSON.stringify([], null, 2), "utf-8");
        Logger.info("Initialized local places.json storage file.");
      }
    } catch (error) {
      Logger.error("Failed to initialize local JSON place storage:", error);
      throw new Error("Storage initialization failed.");
    }
  }

  /**
   * Reads all places from the local JSON file.
   */
  public async findAll(): Promise<PlaceDetails[]> {
    await this.ensureStorageExists();
    try {
      const data = await fs.readFile(FILE_PATH, "utf-8");
      if (!data.trim()) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      Logger.error("Failed to read places from local JSON storage:", error);
      return [];
    }
  }

  /**
   * Appends a new place record and returns submissionId.
   */
  public async save(place: PlaceDetails, audit: PlaceSubmissionAudit): Promise<string> {
    await this.ensureStorageExists();
    try {
      const places = await this.findAll();
      const placeRecord: PlaceDetails = {
        ...place,
        id: place.id || audit.submissionId,
        createdAt: place.createdAt || audit.submittedAt,
        updatedAt: place.updatedAt || audit.submittedAt,
      };
      places.unshift(placeRecord);
      await fs.writeFile(FILE_PATH, JSON.stringify(places, null, 2), "utf-8");
      Logger.info(`Place ID ${placeRecord.id} saved successfully to local JSON database.`);
      return audit.submissionId;
    } catch (error) {
      Logger.error("Failed to save place into local JSON storage:", error);
      throw new Error("Persistence error writing details to local storage.");
    }
  }

  /**
   * Updates an existing place record.
   */
  public async update(id: string, place: PlaceDetails): Promise<void> {
    await this.ensureStorageExists();
    try {
      const places = await this.findAll();
      const index = places.findIndex((p) => p.id === id);
      if (index === -1) {
        throw new Error(`Place with ID ${id} not found.`);
      }

      places[index] = {
        ...places[index],
        ...place,
        updatedAt: new Date().toISOString(),
      };

      await fs.writeFile(FILE_PATH, JSON.stringify(places, null, 2), "utf-8");
      Logger.info(`Place ID ${id} updated successfully in local JSON database.`);
    } catch (error) {
      Logger.error(`Failed to update place ${id} in local storage:`, error);
      throw new Error("Persistence error updating place details in local storage.");
    }
  }

  /**
   * Deletes a place record by ID.
   */
  public async delete(id: string): Promise<void> {
    await this.ensureStorageExists();
    try {
      const places = await this.findAll();
      const filtered = places.filter((p) => p.id !== id);
      if (filtered.length === places.length) {
        throw new Error(`Place with ID ${id} not found.`);
      }
      await fs.writeFile(FILE_PATH, JSON.stringify(filtered, null, 2), "utf-8");
      Logger.info(`Place ID ${id} deleted successfully from local JSON database.`);
    } catch (error) {
      Logger.error(`Failed to delete place ${id} from local storage:`, error);
      throw new Error("Persistence error deleting place from local storage.");
    }
  }
}
