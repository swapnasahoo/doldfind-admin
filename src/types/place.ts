export type PlaceType = "Spot" | "Cafe" | "Market";

export interface PlaceDetails {
  id?: string;

  placeName: string;
  description: string;

  placeType: PlaceType;
  mainCategory: string;
  categories: string[];
  images: string[];

  city: string;
  area: string;
  state: string;

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
  uploaderBadge: string;

  bestSeason: string;
  openingHours: string;
  transportType: string;
  coordinates: [number, number]; // [longitude, latitude]

  createdAt?: string;
  updatedAt?: string;
  credits?: string;
}

export interface PlaceFormValues {
  placeName: string;
  description: string;
  credits?: string;
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
  crowdLevel: "Low" | "Medium" | "High" | "";
  safetyNote: string;
  entryFee: string;
  ticketRequired: "Yes" | "No" | "";
  infoCards?: { label: string; value: string }[];

  // New fields
  bestSeason: {
    startMonth: string;
    endMonth: string;
  };
  openingHours: {
    mode: "24h" | "same" | "custom";
    sameTime: {
      start: string;
      end: string;
    };
    days: Record<string, {
      status: "open" | "closed";
      start: string;
      end: string;
    }>;
  };
  transportType: string;
}
