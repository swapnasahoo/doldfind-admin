import { google } from "googleapis";
import { PlaceDetails } from "@/types/place";
import { PlaceRepository, PlaceSubmissionAudit } from "./placeRepository.interface";
import { config } from "../config";
import { Logger } from "../logger";

export class GoogleSheetsPlaceRepository implements PlaceRepository {
  private sheets;

  constructor() {
    try {
      const auth = new google.auth.JWT({
        email: config.google.clientEmail,
        key: config.google.privateKey,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });
      this.sheets = google.sheets({ version: "v4", auth });
    } catch (error) {
      Logger.error("Failed to initialize Google Sheets API Client:", error);
      throw error;
    }
  }

  /**
   * Formats information cards array into readable text string.
   */
  private formatInfoCards(cards: PlaceDetails["infoCards"]): string {
    if (!cards || cards.length === 0) return "";
    return cards.map((card) => `${card.label}: ${card.value};`).join(" ");
  }

  /**
   * Appends place details and submission audit logs to the designated Google Sheet.
   */
  public async save(place: PlaceDetails, audit: PlaceSubmissionAudit): Promise<string> {
    try {
      const infoCardsFormatted = this.formatInfoCards(place.infoCards);

      const rowValues = [
        audit.submissionId,
        audit.submittedAt,
        audit.submittedBy,
        audit.badge,
        place.id,
        place.title,
        place.categories.join(", "),
        place.description,
        place.location,
        place.coordinates.lat,
        place.coordinates.long,
        infoCardsFormatted,
        place.uploader.username,
        place.uploader.badge,
        place.safetyNote,
      ];

      Logger.info(`Saving place submission to Google Sheet. SpreadsheetId: ${config.google.sheetId}`);

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: config.google.sheetId,
        range: "Sheet1!A:O",
        valueInputOption: "RAW",
        requestBody: {
          values: [rowValues],
        },
      });

      Logger.info(`Place successfully appended to Google Sheet with Submission ID: ${audit.submissionId}`);
      return audit.submissionId;
    } catch (error) {
      Logger.error(`Failed to save place details in Google Sheets Repository:`, error);
      throw new Error("Persistence error writing details to storage.");
    }
  }
}
