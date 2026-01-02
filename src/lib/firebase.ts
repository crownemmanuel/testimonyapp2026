import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getDatabase,
  ref,
  push,
  set,
  get,
  update,
  remove,
  onValue,
  query,
  orderByChild,
  equalTo,
  Database,
} from "firebase/database";
import { Testimony, LiveTestimony, PhoneLookup, ServiceType, DEFAULT_SERVICES } from "./types";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let database: Database;

function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return app;
}

export function getFirebaseDatabase(): Database {
  if (!database) {
    database = getDatabase(getFirebaseApp());
  }
  return database;
}

// Testimony operations
export async function submitTestimony(
  testimony: Omit<Testimony, "id" | "createdAt" | "status">
): Promise<string> {
  const db = getFirebaseDatabase();
  const testimoniesRef = ref(db, "testimonies");
  const newTestimonyRef = push(testimoniesRef);
  
  // Clean up undefined values - Firebase doesn't accept undefined
  const newTestimony: Omit<Testimony, "id"> = {
    name: testimony.name,
    phone: testimony.phone || "",
    email: testimony.email || "",
    service: testimony.service,
    date: testimony.date,
    description: testimony.description,
    whatDidYouDo: testimony.whatDidYouDo || "",
    status: "pending",
    createdAt: Date.now(),
  };
  
  await set(newTestimonyRef, newTestimony);
  return newTestimonyRef.key!;
}

export async function getTestimoniesByDateAndService(
  date: string,
  service: string,
  statusFilter?: "pending" | "approved" | "declined"
): Promise<Testimony[]> {
  const db = getFirebaseDatabase();
  const testimoniesRef = ref(db, "testimonies");
  const snapshot = await get(testimoniesRef);

  if (!snapshot.exists()) return [];

  const testimonies: Testimony[] = [];
  snapshot.forEach((child) => {
    const data = child.val();
    if (data.date === date && data.service === service) {
      if (!statusFilter || data.status === statusFilter) {
        testimonies.push({ id: child.key!, ...data });
      }
    }
  });

  return testimonies.sort((a, b) => a.createdAt - b.createdAt);
}

export async function getAllTestimoniesByDate(date: string): Promise<Testimony[]> {
  const db = getFirebaseDatabase();
  const testimoniesRef = ref(db, "testimonies");
  const snapshot = await get(testimoniesRef);

  if (!snapshot.exists()) return [];

  const testimonies: Testimony[] = [];
  snapshot.forEach((child) => {
    const data = child.val();
    if (data.date === date) {
      testimonies.push({ id: child.key!, ...data });
    }
  });

  return testimonies.sort((a, b) => a.createdAt - b.createdAt);
}

export async function getAllTestimonies(): Promise<Testimony[]> {
  const db = getFirebaseDatabase();
  const testimoniesRef = ref(db, "testimonies");
  const snapshot = await get(testimoniesRef);

  if (!snapshot.exists()) return [];

  const testimonies: Testimony[] = [];
  snapshot.forEach((child) => {
    const data = child.val();
    testimonies.push({ id: child.key!, ...data });
  });

  // Sort by createdAt descending (newest first)
  return testimonies.sort((a, b) => b.createdAt - a.createdAt);
}

export async function updateTestimonyStatus(
  id: string,
  status: "pending" | "approved" | "declined"
): Promise<void> {
  const db = getFirebaseDatabase();
  const testimonyRef = ref(db, `testimonies/${id}`);
  await update(testimonyRef, { status });
}

export async function updateTestimony(
  id: string,
  updates: Partial<Omit<Testimony, "id" | "createdAt">>
): Promise<void> {
  const db = getFirebaseDatabase();
  const testimonyRef = ref(db, `testimonies/${id}`);
  await update(testimonyRef, updates);
}

export async function deleteTestimony(id: string): Promise<void> {
  const db = getFirebaseDatabase();
  const testimonyRef = ref(db, `testimonies/${id}`);
  await remove(testimonyRef);
}

export async function addTestimony(
  testimony: Omit<Testimony, "id">
): Promise<string> {
  const db = getFirebaseDatabase();
  const testimoniesRef = ref(db, "testimonies");
  const newTestimonyRef = push(testimoniesRef);
  await set(newTestimonyRef, testimony);
  return newTestimonyRef.key!;
}

// Live testimony operations
export async function setLiveTestimony(testimony: LiveTestimony): Promise<void> {
  const db = getFirebaseDatabase();
  const liveRef = ref(db, "liveTestimony");
  await set(liveRef, testimony);
}

export async function getLiveTestimony(): Promise<LiveTestimony | null> {
  const db = getFirebaseDatabase();
  const liveRef = ref(db, "liveTestimony");
  const snapshot = await get(liveRef);
  return snapshot.exists() ? snapshot.val() : null;
}

export async function clearLiveTestimony(): Promise<void> {
  const db = getFirebaseDatabase();
  const liveRef = ref(db, "liveTestimony");
  await remove(liveRef);
}

// Phone lookup operations
// Searches existing testimonies for matching phone number and returns the most recent name/email
export async function lookupPhone(phone: string): Promise<PhoneLookup | null> {
  const db = getFirebaseDatabase();
  const normalizedPhone = phone.replace(/\D/g, "");
  
  if (normalizedPhone.length < 10) {
    return null;
  }

  // Search through all testimonies to find matching phone numbers
  const testimoniesRef = ref(db, "testimonies");
  const snapshot = await get(testimoniesRef);

  if (!snapshot.exists()) {
    return null;
  }

  // Find all testimonies with matching phone number
  const matchingTestimonies: Array<{ name: string; email?: string; createdAt: number }> = [];
  
  snapshot.forEach((child) => {
    const data = child.val();
    const testimonyPhone = data.phone ? data.phone.replace(/\D/g, "") : "";
    
    if (testimonyPhone === normalizedPhone && data.name) {
      matchingTestimonies.push({
        name: data.name,
        email: data.email || undefined,
        createdAt: data.createdAt || 0,
      });
    }
  });

  // Return the most recent testimony's name and email
  if (matchingTestimonies.length > 0) {
    // Sort by createdAt descending to get most recent
    matchingTestimonies.sort((a, b) => b.createdAt - a.createdAt);
    const mostRecent = matchingTestimonies[0];
    
    return {
      name: mostRecent.name,
      email: mostRecent.email || "",
    };
  }

  return null;
}

// Services operations
export async function getServices(): Promise<ServiceType[]> {
  const db = getFirebaseDatabase();
  const servicesRef = ref(db, "services");
  const snapshot = await get(servicesRef);

  if (!snapshot.exists()) {
    // Initialize with default services
    await initializeDefaultServices();
    return getServices();
  }

  const services: ServiceType[] = [];
  snapshot.forEach((child) => {
    services.push({ id: child.key!, ...child.val() });
  });

  return services.sort((a, b) => a.order - b.order);
}

export async function initializeDefaultServices(): Promise<void> {
  const db = getFirebaseDatabase();
  const servicesRef = ref(db, "services");

  for (const service of DEFAULT_SERVICES) {
    const newServiceRef = push(servicesRef);
    await set(newServiceRef, service);
  }
}

export async function addService(service: Omit<ServiceType, "id">): Promise<string> {
  const db = getFirebaseDatabase();
  const servicesRef = ref(db, "services");
  const newServiceRef = push(servicesRef);
  await set(newServiceRef, service);
  return newServiceRef.key!;
}

export async function updateService(
  id: string,
  updates: Partial<Omit<ServiceType, "id">>
): Promise<void> {
  const db = getFirebaseDatabase();
  const serviceRef = ref(db, `services/${id}`);
  await update(serviceRef, updates);
}

export async function deleteService(id: string): Promise<void> {
  const db = getFirebaseDatabase();
  const serviceRef = ref(db, `services/${id}`);
  await remove(serviceRef);
}

// Realtime subscription helpers
export function subscribeToTestimonies(
  date: string,
  service: string,
  status: "approved" | "pending" | "declined" | null,
  callback: (testimonies: Testimony[]) => void
): () => void {
  const db = getFirebaseDatabase();
  const testimoniesRef = ref(db, "testimonies");

  const unsubscribe = onValue(testimoniesRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }

    const testimonies: Testimony[] = [];
    snapshot.forEach((child) => {
      const data = child.val();
      if (data.date === date && data.service === service) {
        if (!status || data.status === status) {
          testimonies.push({ id: child.key!, ...data });
        }
      }
    });

    callback(testimonies.sort((a, b) => a.createdAt - b.createdAt));
  });

  return unsubscribe;
}

export function subscribeToLiveTestimony(
  callback: (live: LiveTestimony | null) => void
): () => void {
  const db = getFirebaseDatabase();
  const liveRef = ref(db, "liveTestimony");

  const unsubscribe = onValue(liveRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });

  return unsubscribe;
}
