import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDummyKeyForDevTesting12345678",
  authDomain: "vertease.firebaseapp.com",
  databaseURL: "https://vertease-default-rtdb.firebaseio.com",
  projectId: "vertease",
  storageBucket: "vertease.firebasestorage.app",
  messagingSenderId: "841290002594",
  appId: "1:841290002594:web:75e064cd7611718ff5a7fb",
  measurementId: "G-WRV2BN9RS7",
};

// Initialize Firebase app safely
let app: any;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
} catch (e) {
  console.warn("Firebase app init warning:", e);
}

// Initialize Firestore safely
let db: any = null;
try {
  if (app) db = getFirestore(app);
} catch (e) {
  console.warn("Firestore init warning:", e);
}

/**
 * Lazy initialization for Firebase Auth to prevent 'Component auth not registered' crashes
 * during module evaluation, especially when running in development/bypass modes.
 */
let authInstance: any = null;

export const getAuthInstance = () => {
  if (authInstance) return authInstance;
  if (!app) return null;

  try {
    // Attempt to get existing instance first
    authInstance = getAuth(app);
  } catch (e) {
    try {
      // If none exists, initialize with persistence
      authInstance = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch (innerError) {
      try {
        // Fallback to basic getAuth if all else fails
        authInstance = getAuth(app);
      } catch (finalErr) {
        console.warn("Firebase auth unavailable in this environment:", finalErr);
        authInstance = null;
      }
    }
  }
  return authInstance;
};

export { app, db };
