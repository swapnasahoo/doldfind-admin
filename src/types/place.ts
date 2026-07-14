export interface PlaceDetails {
  id: string;

  title: string;
  categories: string[];
  description: string;

  location: string;
  coordinates: {
    lat: string;
    long: string;
  };

  infoCards: {
    icon?: string;
    label: string;
    value: string;
    isFee: boolean;
  }[];

  safetyNote: string;

  stats: {
    likes: number;
    saves: number;
    visited: number;
  };

  similarSpots: {
    id: string;
    name: string;
    category: string;
  }[];

  uploader: {
    username: string;
    badge: string;
  };

  reviews: {
    id: string;
    username: string;
    review: string;
    stars: number;
  }[];
}

export interface PlaceFormValues {
  title: string;
  categories: string[];
  description: string;
  location: string;
  latitude: string;
  longitude: string;
  infoCards: {
    label: string;
    value: string;
  }[];
  safetyNote: string;
  
  // Information Fields
  mainCategory: string;
  bestTimings: number[];
  closedDays: string[];
  nearestMetro: string;
  crowdLevel: string;
  
  // Pricing Fields
  fee: string;
  ticketRequired: "Yes" | "No" | "";
}
