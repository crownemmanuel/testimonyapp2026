export interface Testimony {
  id: string;
  date: string; // YYYY-MM-DD format
  service: string; // "midweek" | "1st" | "2nd"
  name: string;
  phone?: string;
  email?: string;
  whatDidYouDo?: string;
  description: string;
  status: "pending" | "approved" | "declined";
  createdAt: number;
}

export interface LiveTestimony {
  testimonyId: string;
  displayName: string;
  name: string;
  updatedAt: number;
}

export interface PhoneLookup {
  name: string;
  email: string;
}

export interface ServiceType {
  id: string;
  name: string;
  key: string;
  order: number;
}

export const DEFAULT_SERVICES: Omit<ServiceType, "id">[] = [
  { name: "Midweek Service", key: "midweek", order: 1 },
  { name: "First Service", key: "1st", order: 2 },
  { name: "Second Service", key: "2nd", order: 3 },
];
