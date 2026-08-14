import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyD9Xo_X5jcljHIJuG39U09P9D_UtI9qIEs",
  authDomain: "vertease.firebaseapp.com",
  databaseURL: "https://vertease-default-rtdb.firebaseio.com",
  projectId: "vertease",
  storageBucket: "vertease.firebasestorage.app",
  messagingSenderId: "841290002594",
  appId: "1:841290002594:web:75e064cd7611718ff5a7fb",
  measurementId: "G-WRV2BN9RS7",
};

// Initialize Firebase app
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore
const db = getFirestore(app);

/**
 * Lazy initialization for Firebase Auth to prevent 'Component auth not registered' crashes
 * during module evaluation, especially when running in development/bypass modes.
 */
let authInstance: any = null;

export const getAuthInstance = () => {
  if (authInstance) return authInstance;

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
      // Fallback to basic getAuth if all else fails
      authInstance = getAuth(app);
    }
  }
  return authInstance;
};

export { app, db };
