import { PlaceFormValues, PlaceType } from "@/types/place";
import { mergeTimeSlots } from "@/utils/parser";

/**
 * Normalizes unicode strings and collapses multiple spaces.
 */
export function cleanString(val: string): string {
  if (!val) return "";
  return val
    .normalize("NFC")
    .replace(/\r\n/g, "\n")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Sanitizes and normalizes incoming place form inputs into the standard schema.
 */
export function parseIncomingPayload(data: PlaceFormValues) {
  const placeName = cleanString(data.placeName);
  const description = cleanString(data.description);
  const placeType = cleanString(data.placeType) as PlaceType;
  const mainCategory = cleanString(data.mainCategory);

  // Normalize Categories
  let categories = Array.from(
    new Set(
      (data.categories || [])
        .map((cat) => cleanString(cat))
        .filter((cat) => cat.length > 0)
    )
  );

  if (categories.includes("Free") && categories.includes("Paid")) {
    categories = categories.filter((c) => c !== "Paid");
  }

  // Normalize Images
  const images = Array.from(
    new Set(
      (data.images || [])
        .map((img) => cleanString(img))
        .filter((img) => img.length > 0)
    )
  );

  const city = cleanString(data.city);
  const area = cleanString(data.area);
  const state = cleanString(data.state);

  const latitude = cleanString(data.latitude);
  const longitude = cleanString(data.longitude);

  const bestTimings = mergeTimeSlots(data.bestTimings || []);
  const closedOn = data.closedDays?.includes("Never Closed")
    ? "Never Closed"
    : (data.closedDays || []).join(", ");
  const nearestMetro = cleanString(data.nearestMetro);
  const crowdLevel = cleanString(data.crowdLevel);
  const safetyNote = cleanString(data.safetyNote);

  const rawFee = cleanString(data.entryFee);
  let entryFee = "";
  if (!rawFee) {
    entryFee =
      data.ticketRequired === "Yes"
        ? "FREE - TICKET REQUIRED"
        : "FREE - NO TICKET REQUIRED";
  } else {
    entryFee = rawFee;
  }

  return {
    placeName,
    description,
    placeType,
    mainCategory,
    categories,
    images,
    city,
    area,
    state,
    latitude,
    longitude,
    bestTimings,
    closedOn,
    nearestMetro,
    crowdLevel,
    safetyNote,
    entryFee,
  };
}
