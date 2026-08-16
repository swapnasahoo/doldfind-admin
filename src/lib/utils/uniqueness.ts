import { PlaceDetails } from "@/types/place";

/**
 * Normalizes a string by converting it to lowercase and removing special characters/whitespace.
 */
function normalizeString(str: string): string {
  return str.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Computes string similarity using Levenshtein Distance.
 * Returns a score between 0.0 (no similarity) and 1.0 (exact match).
 */
export function getStringSimilarity(s1: string, s2: string): number {
  const norm1 = normalizeString(s1);
  const norm2 = normalizeString(s2);

  if (norm1 === norm2) return 1.0;
  if (!norm1 || !norm2) return 0.0;

  const track = Array(norm2.length + 1)
    .fill(null)
    .map(() => Array(norm1.length + 1).fill(null));

  for (let i = 0; i <= norm1.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= norm2.length; j += 1) track[j][0] = j;

  for (let j = 1; j <= norm2.length; j += 1) {
    for (let i = 1; i <= norm1.length; i += 1) {
      const indicator = norm1[i - 1] === norm2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j - 1][i] + 1, // deletion
        track[j][i - 1] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  const distance = track[norm2.length][norm1.length];
  const maxLength = Math.max(norm1.length, norm2.length);
  return 1.0 - distance / maxLength;
}

/**
 * Calculates geographic distance in kilometers between two coordinates using the Haversine formula.
 */
export function getCoordinateDistanceKm(
  lat1Str: string,
  lon1Str: string,
  lat2Str: string,
  lon2Str: string
): number {
  const lat1 = parseFloat(lat1Str);
  const lon1 = parseFloat(lon1Str);
  const lat2 = parseFloat(lat2Str);
  const lon2 = parseFloat(lon2Str);

  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
    return Infinity;
  }

  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface UniquenessCheckResult {
  status: "UNIQUE" | "SIMILAR" | "DUPLICATE";
  existingPlaceName?: string;
  message?: string;
}

/**
 * Performs a similarity check on a new place entry against existing database entries
 * using Name, Area, State, and Latitude/Longitude coordinates.
 */
export function checkPlaceUniqueness(
  newPlace: { placeName: string; area: string; state: string; latitude: string; longitude: string },
  existingPlaces: PlaceDetails[]
): UniquenessCheckResult {
  const name = newPlace.placeName;
  const area = newPlace.area;
  const state = newPlace.state;
  const lat = newPlace.latitude;
  const lon = newPlace.longitude;

  for (const existing of existingPlaces) {
    const nameSim = getStringSimilarity(name, existing.placeName);
    const areaSim = getStringSimilarity(area, existing.area);
    const stateSim = getStringSimilarity(state, existing.state);
    const distanceKm = getCoordinateDistanceKm(
      lat,
      lon,
      existing.coordinates ? String(existing.coordinates[1]) : "0",
      existing.coordinates ? String(existing.coordinates[0]) : "0"
    );

    const isExactName = nameSim >= 0.95;
    const isVerySimilarName = nameSim >= 0.85;
    const isSimilarName = nameSim >= 0.70;
    const isSameArea = areaSim >= 0.90;
    const isSameState = stateSim >= 0.90;

    // 1. High match / matches too much (DUPLICATE)
    // Matches if name is extremely similar, coordinates are within 100 meters, area and state match
    const isNearIdentical = isExactName && distanceKm <= 0.15; // Within 150m
    const isSameLocationAndName = isVerySimilarName && isSameArea && isSameState && distanceKm <= 0.3; // Within 300m

    if (isNearIdentical || isSameLocationAndName) {
      return {
        status: "DUPLICATE",
        existingPlaceName: existing.placeName,
        message: `Duplicate detected: This place matches the existing entry '${existing.placeName}' too closely. (Name Similarity: ${(nameSim * 100).toFixed(0)}%, distance: ${(distanceKm * 1000).toFixed(0)}m).`,
      };
    }

    // 2. Moderate match / potential duplicate (SIMILAR)
    // Matches if coordinates are very close (< 1.0 km) or name is similar in the same area
    const isCloseDistance = distanceKm <= 1.0; // Within 1 km
    const isSimilarNameSameArea = isSimilarName && isSameArea && isSameState;

    if (isSimilarNameSameArea || (isCloseDistance && isSimilarName)) {
      return {
        status: "SIMILAR",
        existingPlaceName: existing.placeName,
        message: `Similar place found: '${existing.placeName}' (Name Similarity: ${(nameSim * 100).toFixed(0)}%, distance: ${(distanceKm * 1000).toFixed(0)}m). Please verify that this is not a duplicate.`,
      };
    }
  }

  return { status: "UNIQUE" };
}
