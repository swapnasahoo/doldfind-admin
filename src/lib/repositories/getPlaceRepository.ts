import { config } from "../config";
import { PlaceRepository } from "./placeRepository.interface";
import { AppwritePlaceRepository } from "./appwritePlaceRepository";
import { JsonPlaceRepository } from "./jsonPlaceRepository";
import { Logger } from "../logger";

export function getPlaceRepository(): PlaceRepository {
  const { endpoint, projectId, apiKey, databaseId, collectionId } = config.appwrite;

  if (projectId && apiKey) {
    const appwriteRepo = new AppwritePlaceRepository(endpoint, projectId, apiKey, databaseId, collectionId);
    if (appwriteRepo.isConfigured()) {
      return appwriteRepo;
    }
  }

  Logger.info("APPWRITE_PROJECT_ID or APPWRITE_API_KEY not configured. Falling back to JsonPlaceRepository.");
  return new JsonPlaceRepository();
}

export default getPlaceRepository;
