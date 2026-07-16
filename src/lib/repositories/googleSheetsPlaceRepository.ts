import { google } from "googleapis";
import { PlaceDetails } from "@/types/place";
import { PlaceRepository, PlaceSubmissionAudit } from "./placeRepository.interface";
import { config } from "../config";
import { Logger } from "../logger";

function escapeFormula(val: string): string {
  if (!val) return "";
  const formulaChars = ["=", "+", "-", "@", "\t", "\r"];
  if (formulaChars.some((char) => val.startsWith(char))) {
    return `'${val}`;
  }
  return val;
}

function parseInfoCards(formatted: string): { label: string; value: string; isFee: boolean }[] {
  if (!formatted) return [];
  const cards: { label: string; value: string; isFee: boolean }[] = [];
  const pairs = formatted.split(";");
  for (let pair of pairs) {
    pair = pair.trim();
    if (!pair) continue;
    const colonIdx = pair.indexOf(":");
    if (colonIdx === -1) continue;
    const label = pair.substring(0, colonIdx).trim();
    const cleanLabel = label.startsWith("'") ? label.substring(1) : label;
    const value = pair.substring(colonIdx + 1).trim();
    const cleanValue = value.startsWith("'") ? value.substring(1) : value;

    cards.push({
      label: cleanLabel,
      value: cleanValue,
      isFee: cleanLabel.toLowerCase() === "fee",
    });
  }
  return cards;
}

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
   * Formats information cards array into readable text string, escaping labels and values.
   */
  private formatInfoCards(cards: PlaceDetails["infoCards"]): string {
    if (!cards || cards.length === 0) return "";
    return cards.map((card) => `${escapeFormula(card.label)}: ${escapeFormula(card.value)};`).join(" ");
  }

  /**
   * Checks if the header row exists in Sheet1!A1:O1, and writes it if missing.
   */
  private async ensureHeadersExist(): Promise<void> {
    try {
      const res = await this.sheets.spreadsheets.values.get({
        spreadsheetId: config.google.sheetId,
        range: "Sheet1!A1:O1",
      });

      const rows = res.data.values;
      if (!rows || rows.length === 0 || !rows[0] || rows[0].length === 0 || !rows[0][0]) {
        Logger.info("Initializing Google Sheet header row.");
        const headers = [
          "Submission ID",
          "Submitted At",
          "Submitted By",
          "Badge",
          "Place ID",
          "Title",
          "Categories",
          "Description",
          "Location",
          "Latitude",
          "Longitude",
          "Info Cards",
          "Uploader Username",
          "Uploader Badge",
          "Safety Note",
        ];
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: config.google.sheetId,
          range: "Sheet1!A1:O1",
          valueInputOption: "RAW",
          requestBody: {
            values: [headers],
          },
        });
      }
    } catch (error) {
      Logger.warn("Failed to check or initialize header row in Google Sheet:", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Appends place details and submission audit logs to the designated Google Sheet.
   */
  public async save(place: PlaceDetails, audit: PlaceSubmissionAudit): Promise<string> {
    try {
      await this.ensureHeadersExist();
      const infoCardsFormatted = this.formatInfoCards(place.infoCards);

      const rowValues = [
        audit.submissionId,
        audit.submittedAt,
        audit.submittedBy,
        audit.badge,
        place.id,
        escapeFormula(place.title),
        place.categories.map(escapeFormula).join(", "),
        escapeFormula(place.description),
        escapeFormula(place.location),
        place.coordinates.lat,
        place.coordinates.long,
        infoCardsFormatted,
        place.uploader.username,
        place.uploader.badge,
        escapeFormula(place.safetyNote),
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
      Logger.error(`Failed to save place details in Google Sheets Repository: (Raw details omitted for safety)`);
      throw new Error("Persistence error writing details to storage.");
    }
  }

  public async findAll(): Promise<PlaceDetails[]> {
    try {
      const res = await this.sheets.spreadsheets.values.get({
        spreadsheetId: config.google.sheetId,
        range: "Sheet1!A:O",
      });

      const rows = res.data.values;
      if (!rows || rows.length === 0) return [];

      const places: PlaceDetails[] = [];
      for (const row of rows) {
        if (!row || row.length === 0) continue;
        if (row[0] === "Submission ID" || row[0] === "submissionId" || row[0] === "SubmissionId") {
          continue;
        }

        const cleanValue = (val: string) => {
          if (!val) return "";
          return val.startsWith("'") ? val.substring(1) : val;
        };

        const id = row[4] || row[0];
        const title = cleanValue(row[5]);
        const categories = (row[6] || "")
          .split(",")
          .map((c: string) => cleanValue(c.trim()))
          .filter(Boolean);
        const description = cleanValue(row[7]);
        const location = cleanValue(row[8]);
        const lat = cleanValue(row[9]);
        const long = cleanValue(row[10]);
        const infoCards = parseInfoCards(row[11] || "");
        const uploaderUsername = cleanValue(row[12]);
        const uploaderBadge = cleanValue(row[13]);
        const safetyNote = cleanValue(row[14]);

        places.push({
          id,
          title,
          categories,
          description,
          location,
          coordinates: { lat, long },
          infoCards,
          uploader: {
            username: uploaderUsername,
            badge: uploaderBadge,
          },
          safetyNote,
          stats: { likes: 0, saves: 0, visited: 0 },
          similarSpots: [],
          reviews: [],
        });
      }

      return places;
    } catch (error) {
      Logger.error("Failed to fetch places from Google Sheets:", error);
      throw new Error("Persistence error fetching details from storage.");
    }
  }

  public async update(id: string, place: PlaceDetails): Promise<void> {
    try {
      const res = await this.sheets.spreadsheets.values.get({
        spreadsheetId: config.google.sheetId,
        range: "Sheet1!A:O",
      });

      const rows = res.data.values;
      if (!rows || rows.length === 0) {
        throw new Error("No data found in spreadsheet to update.");
      }

      let rowIndex = -1;
      let existingAudit = {
        submissionId: id,
        submittedAt: new Date().toISOString(),
        submittedBy: "System",
        badge: "Founder",
      };

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row[4] === id || row[0] === id) {
          rowIndex = i;
          existingAudit = {
            submissionId: row[0] || id,
            submittedAt: row[1] || new Date().toISOString(),
            submittedBy: row[2] || "System",
            badge: row[3] || "Founder",
          };
          break;
        }
      }

      if (rowIndex === -1) {
        throw new Error(`Place with ID ${id} not found in spreadsheet.`);
      }

      const infoCardsFormatted = this.formatInfoCards(place.infoCards);

      const rowValues = [
        existingAudit.submissionId,
        existingAudit.submittedAt,
        existingAudit.submittedBy,
        existingAudit.badge,
        id,
        escapeFormula(place.title),
        place.categories.map(escapeFormula).join(", "),
        escapeFormula(place.description),
        escapeFormula(place.location),
        place.coordinates.lat,
        place.coordinates.long,
        infoCardsFormatted,
        place.uploader.username || existingAudit.submittedBy,
        place.uploader.badge || existingAudit.badge,
        escapeFormula(place.safetyNote),
      ];

      const range = `Sheet1!A${rowIndex + 1}:O${rowIndex + 1}`;
      Logger.info(`Updating Google Sheet row at range ${range}`);

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: config.google.sheetId,
        range,
        valueInputOption: "RAW",
        requestBody: {
          values: [rowValues],
        },
      });

      Logger.info(`Place ID ${id} successfully updated in Google Sheet row ${rowIndex + 1}`);
    } catch (error) {
      Logger.error(`Failed to update place details in Google Sheets Repository: (Raw details omitted for safety)`);
      throw new Error("Persistence error updating details in storage.");
    }
  }

  public async delete(id: string): Promise<void> {
    try {
      const res = await this.sheets.spreadsheets.values.get({
        spreadsheetId: config.google.sheetId,
        range: "Sheet1!A:O",
      });

      const rows = res.data.values;
      if (!rows || rows.length === 0) {
        throw new Error("No data found in spreadsheet to delete.");
      }

      let rowIndex = -1;
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row[4] === id || row[0] === id) {
          rowIndex = i;
          break;
        }
      }

      if (rowIndex === -1) {
        throw new Error(`Place with ID ${id} not found in spreadsheet.`);
      }

      Logger.info(`Deleting Google Sheet row index ${rowIndex + 1}`);

      const spreadsheetMeta = await this.sheets.spreadsheets.get({
        spreadsheetId: config.google.sheetId,
      });

      const sheet = spreadsheetMeta.data.sheets?.find(
        (s) => s.properties?.title === "Sheet1"
      );
      const sheetId = sheet?.properties?.sheetId ?? 0;

      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: config.google.sheetId,
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId,
                  dimension: "ROWS",
                  startIndex: rowIndex,
                  endIndex: rowIndex + 1,
                },
              },
            },
          ],
        },
      });

      Logger.info(`Place ID ${id} successfully deleted from Google Sheet row ${rowIndex + 1}`);
    } catch (error) {
      Logger.error(`Failed to delete place from Google Sheets Repository: (Raw details omitted for safety)`);
      throw new Error("Persistence error deleting row from storage.");
    }
  }
}
