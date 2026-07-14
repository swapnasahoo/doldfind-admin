import { PlaceDetails, PlaceFormValues } from "@/types/place";

/**
 * Merges consecutive 1-hour time slots into consolidated ranges.
 * For example: [10, 11] (10 AM-11 AM, 11 AM-12 PM) -> "10 AM - 12 PM"
 */
export function mergeTimeSlots(selectedSlots: number[]): string {
  if (!selectedSlots || selectedSlots.length === 0) return "";

  const sorted = [...selectedSlots].sort((a, b) => a - b);

  const ranges: { start: number; end: number }[] = [];
  let currentRange = { start: sorted[0], end: sorted[0] };

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === currentRange.end + 1) {
      currentRange.end = sorted[i];
    } else {
      ranges.push(currentRange);
      currentRange = { start: sorted[i], end: sorted[i] };
    }
  }
  ranges.push(currentRange);

  const formatHour = (h: number): string => {
    const ampm = h >= 12 && h < 24 ? "PM" : "AM";
    let displayHour = h % 12;
    if (displayHour === 0) displayHour = 12;
    return `${displayHour} ${ampm}`;
  };

  const formattedRanges = ranges.map((r) => {
    const startStr = formatHour(r.start);
    const endStr = formatHour(r.end + 1);
    return `${startStr} - ${endStr}`;
  });

  return formattedRanges.join(", ");
}

/**
 * Calculates continuous block durations to check if any exceeds 4 hours.
 */
export function getContinuousDurations(selectedSlots: number[]): number[] {
  if (!selectedSlots || selectedSlots.length === 0) return [];
  const sorted = [...selectedSlots].sort((a, b) => a - b);
  const durations: number[] = [];
  let currentLength = 1;

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
      currentLength++;
    } else {
      durations.push(currentLength);
      currentLength = 1;
    }
  }
  durations.push(currentLength);
  return durations;
}

/**
 * Normalizes raw form values into a complete PlaceDetails object.
 * Trims whitespace, removes duplicate categories, filters empty info cards,
 * prepends generated Quick Information cards, and filters duplicate manual labels.
 */
export function normalizePlaceDetails(formValues: PlaceFormValues): PlaceDetails {
  // Trim and deduplicate categories
  let normalizedCategories = Array.from(
    new Set(
      formValues.categories
        .map((cat) => cat.trim())
        .filter((cat) => cat.length > 0)
    )
  );

  // Enforce categories mutual exclusivity (Free and Paid cannot exist together)
  if (normalizedCategories.includes("Free") && normalizedCategories.includes("Paid")) {
    normalizedCategories = normalizedCategories.filter((cat) => cat !== "Paid");
  }

  // Normalize coordinates
  const normalizedCoordinates = {
    lat: formValues.latitude.trim(),
    long: formValues.longitude.trim(),
  };

  // Determine generated Fee Card value
  const trimmedFee = (formValues.fee || "").trim();
  let feeValue = "";
  if (!trimmedFee) {
    feeValue =
      formValues.ticketRequired === "Yes"
        ? "FREE - TICKET REQUIRED"
        : "FREE - NO TICKET REQUIRED";
  } else {
    feeValue = trimmedFee;
  }

  // 1. Generate 7 Standardized Info Cards
  const quickInfoCards = [
    {
      label: "Main Category",
      value: formValues.mainCategory.trim(),
      isFee: false,
    },
    {
      label: "Best Timings",
      value: mergeTimeSlots(formValues.bestTimings),
      isFee: false,
    },
    {
      label: "Closed On",
      value: formValues.closedDays.includes("Never Closed")
        ? "Never Closed"
        : formValues.closedDays.join(", "),
      isFee: false,
    },
    {
      label: "Nearest Metro",
      value: formValues.nearestMetro.trim(),
      isFee: false,
    },
    {
      label: "Crowd Level",
      value: formValues.crowdLevel.trim(),
      isFee: false,
    },
    {
      label: "Safety Note",
      value: formValues.safetyNote.trim(),
      isFee: false,
    },
    {
      label: "Fee",
      value: feeValue,
      isFee: true, // Exactly one generated Fee card has isFee = true
    },
  ];

  const quickInfoLabels = quickInfoCards.map((card) =>
    card.label.toLowerCase()
  );

  // 2. Filter and trim manual user cards, setting isFee = false for all of them
  const normalizedUserCards = (formValues.infoCards || [])
    .map((card) => ({
      label: card.label.trim(),
      value: card.value.trim(),
      isFee: false, // Strictly false for all manual cards
    }))
    .filter(
      (card) =>
        (card.label.length > 0 || card.value.length > 0) &&
        !quickInfoLabels.includes(card.label.toLowerCase())
    );

  const finalInfoCards = [...quickInfoCards, ...normalizedUserCards];

  return {
    id: "", // Leave empty for backend to generate

    title: formValues.title.trim(),
    categories: normalizedCategories,
    description: formValues.description.trim(),

    location: formValues.location.trim(),
    coordinates: normalizedCoordinates,

    infoCards: finalInfoCards,

    safetyNote: formValues.safetyNote.trim(),

    // Backend-generated defaults
    stats: {
      likes: 0,
      saves: 0,
      visited: 0,
    },

    similarSpots: [],

    uploader: {
      username: "",
      badge: "",
    },

    reviews: [],
  };
}
