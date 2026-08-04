export type PlaceType = "Spot" | "Cafe" | "Market";

export interface PlaceDetails {
  id: string;

  placeName: string;
  description: string;

  placeType: PlaceType;
  mainCategory: string;
  categories: string[];
  images: string[];

  city: string;
  area: string;
  state: string;

  latitude: string;
  longitude: string;

  bestTimings: string;
  closedOn: string;
  nearestMetro: string;
  crowdLevel: string;
  safetyNote: string;
  entryFee: string;

  likes: number;
  saves: number;
  visited: number;

  uploaderId: string;

  createdAt: string;
  updatedAt: string;
}

export interface PlaceFormValues {
  placeName: string;
  description: string;
  placeType: PlaceType | "";
  mainCategory: string;
  categories: string[];
  images: string[];

  city: string;
  area: string;
  state: string;

  latitude: string;
  longitude: string;

  bestTimings: number[];
  closedDays: (
    | "Monday"
    | "Tuesday"
    | "Wednesday"
    | "Thursday"
    | "Friday"
    | "Saturday"
    | "Sunday"
    | "Never Closed"
  )[];
  nearestMetro: string;
  crowdLevel: string;
  safetyNote: string;
  entryFee: string;
  ticketRequired: "Yes" | "No" | "";
  infoCards?: { label: string; value: string }[];
}
