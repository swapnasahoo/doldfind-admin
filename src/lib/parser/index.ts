import { PlaceFormValues } from "@/types/place";
import { mergeTimeSlots } from "@/utils/parser"; // Reusing the UI time slot merging helper

/**
 * Normalizes unicode strings and collapses multiple spaces.
 */
export function cleanString(val: string): string {
  if (!val) return "";
  return val
    .normalize("NFC") // Normalize unicode characters
    .replace(/\r\n/g, "\n") // Standardize newlines
    .replace(/\s+/g, " ") // Collapse repeated whitespace into single space
    .trim();
}

/**
 * Sanitizes and normalizes incoming place form inputs.
 * Enforces mutual exclusivity and removes duplicate entries.
 */
export function parseIncomingPayload(data: PlaceFormValues) {
  const title = cleanString(data.title);
  const description = cleanString(data.description);
  const location = cleanString(data.location);
  const latitude = cleanString(data.latitude);
  const longitude = cleanString(data.longitude);
  const safetyNote = cleanString(data.safetyNote);
  
  // Normalize Categories
  let categories = Array.from(
    new Set(
      (data.categories || [])
        .map((cat) => cleanString(cat))
        .filter((cat) => cat.length > 0)
    )
  );

  // Categories Mutual Exclusivity Check
  if (categories.includes("Free") && categories.includes("Paid")) {
    categories = categories.filter((c) => c !== "Paid");
  }

  const mainCategory = cleanString(data.mainCategory);
  const nearestMetro = cleanString(data.nearestMetro);
  const crowdLevel = cleanString(data.crowdLevel);
  const fee = cleanString(data.fee);

  // Generate standardized card list
  let feeValue = "";
  if (!fee) {
    feeValue =
      data.ticketRequired === "Yes"
        ? "FREE - TICKET REQUIRED"
        : "FREE - NO TICKET REQUIRED";
  } else {
    feeValue = fee;
  }

  const standardCards = [
    { label: "Main Category", value: mainCategory, isFee: false },
    { label: "Best Timings", value: mergeTimeSlots(data.bestTimings || []), isFee: false },
    { label: "Closed On", value: data.closedDays?.includes("Never Closed") ? "Never Closed" : (data.closedDays || []).join(", "), isFee: false },
    { label: "Nearest Metro", value: nearestMetro, isFee: false },
    { label: "Crowd Level", value: crowdLevel, isFee: false },
    { label: "Safety Note", value: safetyNote, isFee: false },
    { label: "Fee", value: feeValue, isFee: true },
  ];

  const standardLabels = standardCards.map((c) => c.label.toLowerCase());

  // Filter custom cards (trim, ignore duplicate standard fields and blank cards)
  const customCards = (data.infoCards || [])
    .map((card) => ({
      label: cleanString(card.label),
      value: cleanString(card.value),
      isFee: false, // Custom cards are strictly false
    }))
    .filter(
      (card) =>
        (card.label.length > 0 || card.value.length > 0) &&
        !standardLabels.includes(card.label.toLowerCase())
    );

  const infoCards = [...standardCards, ...customCards];

  return {
    title,
    categories,
    description,
    location,
    coordinates: {
      lat: latitude,
      long: longitude,
    },
    infoCards,
    safetyNote,
  };
}
