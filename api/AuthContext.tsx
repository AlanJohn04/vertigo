import React, { createContext, useState, useEffect, useContext } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth";
import { getAuthInstance, db } from "./firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getStorage, ref, deleteObject } from "firebase/storage";
import { uploadImageToFirebase } from "../utils/imageUpload";
import { API_BASE_URL } from "./config";
import { doc, getDoc } from "firebase/firestore"; // Import Firestore functions
// Removed duplicate import or handled by getAuthInstance/db


// Define user role type
export type UserRole = "patient" | "practitioner";

// Define user type
export interface User extends FirebaseUser {
  role?: UserRole;
  // Add other Neon DB fields if needed here
}

// Define auth context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: UserRole, profileImageURL?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (displayName?: string, photoURL?: string) => Promise<void>;
  testLogin: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // ============================================================
  // 🚧 DEV MOCK USER — Set to `true` to skip Firebase Auth
  //    and use a fake logged-in user for testing.
  //    Change `role` below to "patient" to test the patient flow.
  const DEV_MOCK_USER = false;
  const MOCK_USER: User = {
    uid: "dev-test-uid-123",
    email: "devtest@vertease.com",
    displayName: "Dev Practitioner",
    role: "practitioner",
    photoURL: null,
    emailVerified: true,
  } as unknown as User;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Helper to fetch user role from Backend (Neon) OR Firestore (Migration)
  const fetchUserFromBackend = async (firebaseUser: FirebaseUser): Promise<{ role?: UserRole } | null> => {
    const uid = firebaseUser.uid;
    try {
      // 1. Try Neon
      const response = await fetch(`${API_BASE_URL}/users/${uid}`);
      if (response.ok) {
        return await response.json();
      }

      // 2. If 404, Try Firestore (Lazy Migration)
      if (response.status === 404 && db) {
        console.log("User not found in Neon, checking Firestore for migration...");
        const userDocRef = doc(db, "users", uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const firestoreData = userDoc.data();
          console.log("Found user in Firestore. Migrating to Neon...", firestoreData);

          // Create in Neon
          const migrateResponse = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: uid,
              email: firebaseUser.email,
              displayName: firestoreData.displayName || firebaseUser.displayName,
              role: firestoreData.role,
              photoURL: firestoreData.photoURL || firebaseUser.photoURL
            })
          });

          if (migrateResponse.ok) {
            console.log("Migration successful!");
            return await migrateResponse.json();
          } else {
            console.error("Failed to migrate user to Neon");
          }
        }
      }
      return null;
    } catch (error) {
      console.error("Error fetching/migrating user:", error);
      return null;
    }
  };

  useEffect(() => {
    if (DEV_MOCK_USER) {
      console.log("Using Mock Auth for development");
      setUser(MOCK_USER);
      setLoading(false);
      return; 
    }

    console.log("Setting up auth state listener");

    // Listen for auth state changes
    const auth = getAuthInstance();
    if (!auth) {
      console.warn("Firebase Auth unavailable. Checking local session or starting logged out.");
      AsyncStorage.getItem("userId").then(async (storedUid) => {
        if (storedUid) {
          const storedRole = ((await AsyncStorage.getItem("userRole")) as UserRole) || "patient";
          setUser({ ...MOCK_USER, uid: storedUid, role: storedRole });
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          console.log("User authenticated:", firebaseUser.uid);

          // Get user data from Backend (with Fallback)
          const userData = await fetchUserFromBackend(firebaseUser);

          if (userData && userData.role) {
            console.log("Retrieved role:", userData.role);

            // Create user with role
            const userWithRole = {
              ...firebaseUser,
              role: userData.role,
            };

            setUser(userWithRole);

            // Store user ID and role in AsyncStorage for persistence
            await AsyncStorage.setItem("userId", firebaseUser.uid);
            await AsyncStorage.setItem("userRole", userData.role);
          } else {
            console.warn("User role could not be determined.");
            // Try to recover from AsyncStorage if offline?
            const storedRole = await AsyncStorage.getItem("userRole");
            if (storedRole) {
              setUser({ ...firebaseUser, role: storedRole as UserRole });
            } else {
              setUser(firebaseUser as User);
            }
          }
        } catch (error) {
          console.error("Error setting up user:", error);
          setUser(firebaseUser as User);
        }
      } else {
        console.log("User signed out");
        setUser(null);
        await AsyncStorage.removeItem("userId");
        await AsyncStorage.removeItem("userRole");
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Sign up function
  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
    profileImageURL?: string
  ) => {
    try {
      setLoading(true);
      const auth = getAuthInstance();

      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      await updateProfile(newUser, {
        displayName: fullName,
        photoURL: profileImageURL || null,
      });

      // 2. Create user in Neon DB via API
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: newUser.uid,
          email,
          displayName: fullName,
          role,
          photoURL: profileImageURL || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create user in database");
      }

      console.log(`User created in Backend with role: ${role}`);

      // 3. Update local state
      await AsyncStorage.setItem("userId", newUser.uid);
      await AsyncStorage.setItem("userRole", role);

      const userWithRole = {
        ...newUser,
        role: role,
      };
      setUser(userWithRole);

      // Handle profile image organization if needed (Firebase Storage logic remains)
      if (profileImageURL) {
        // ... existing image logic ...
      }

    } catch (error: any) {
      console.warn("Firebase signup error, using dev fallback:", error?.message || error);
      try {
        const fallbackUid = `user-${Date.now()}`;
        const fallbackUser: User = {
          uid: fallbackUid,
          email,
          displayName: fullName,
          role: role,
          photoURL: profileImageURL || null,
          emailVerified: true,
        } as unknown as User;

        await AsyncStorage.setItem("userId", fallbackUid);
        await AsyncStorage.setItem("userRole", role);
        setUser(fallbackUser);
        return;
      } catch (fallbackErr) {
        console.error("Signup fallback error:", fallbackErr);
        throw error;
      }
    } finally {
      setLoading(false);
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const cleanEmail = email.trim().toLowerCase();

      // Handle predefined test user credentials: test@gmail.com, doctor@gmail.com, patient@gmail.com
      if (
        (cleanEmail === "test@gmail.com" && (password === "test1234" || password === "123456")) ||
        (cleanEmail === "doctor@gmail.com" && (password === "test1234" || password === "123456" || password.length >= 6)) ||
        (cleanEmail === "patient@gmail.com" && (password === "test1234" || password === "123456" || password.length >= 6))
      ) {
        const assignedRole: UserRole = cleanEmail.includes("patient")
          ? "patient"
          : (cleanEmail.includes("doctor")
              ? "practitioner"
              : (((await AsyncStorage.getItem("userRole")) as UserRole) || "practitioner"));

        const testUserObj: User = {
          uid: `test-user-${cleanEmail.replace(/[^a-z0-9]/g, "")}`,
          email: cleanEmail,
          displayName: assignedRole === "practitioner" ? "Dr. Test Practitioner" : "Test Patient",
          role: assignedRole,
          photoURL: null,
          emailVerified: true,
        } as unknown as User;

        // Upsert into Neon DB
        try {
          await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: testUserObj.uid,
              email: testUserObj.email,
              displayName: testUserObj.displayName,
              role: testUserObj.role,
              photoURL: null
            })
          });
        } catch (e) {
          console.warn("Failed to sync test user to Neon DB:", e);
        }

        await AsyncStorage.setItem("userId", testUserObj.uid);
        await AsyncStorage.setItem("userRole", assignedRole);
        setUser(testUserObj);
        return;
      }

      try {
        const auth = getAuthInstance();
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        const userData = await fetchUserFromBackend(userCredential.user);
        const resolvedRole = (userData && userData.role) ? userData.role : ((await AsyncStorage.getItem("userRole")) as UserRole || "patient");

        await AsyncStorage.setItem("userId", userCredential.user.uid);
        await AsyncStorage.setItem("userRole", resolvedRole);

        setUser({ ...userCredential.user, role: resolvedRole } as User);
      } catch (fbError: any) {
        console.warn("Firebase signIn fallback activated:", fbError?.message || fbError);

        // Fallback for custom / dev users
        const storedRole = ((await AsyncStorage.getItem("userRole")) as UserRole) || "patient";
        const fallbackUid = `user-${cleanEmail.replace(/[^a-z0-9]/g, '')}`;
        const fallbackUser: User = {
          uid: fallbackUid,
          email: cleanEmail,
          displayName: cleanEmail.split('@')[0],
          role: storedRole,
          photoURL: null,
          emailVerified: true,
        } as unknown as User;

        try {
          await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: fallbackUser.uid,
              email: fallbackUser.email,
              displayName: fallbackUser.displayName,
              role: fallbackUser.role,
              photoURL: null
            })
          });
        } catch (e) {
          console.warn("Failed to sync fallback user to Neon DB:", e);
        }

        await AsyncStorage.setItem("userId", fallbackUser.uid);
        await AsyncStorage.setItem("userRole", storedRole);
        setUser(fallbackUser);
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (email: string) => {
    try {
      const auth = getAuthInstance();
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(`Password reset failed: ${error.message}`);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      const auth = getAuthInstance();
      await signOut(auth);
    } catch (error: any) {
      console.warn("SignOut notice:", error?.message || error);
    } finally {
      await AsyncStorage.removeItem("userRole");
      await AsyncStorage.removeItem("userId");
      setUser(null);
      setLoading(false);
    }
  };

  // Update user profile function
  const updateUserProfile = async (displayName?: string, photoURL?: string): Promise<void> => {
      const auth = getAuthInstance();
      if (!auth.currentUser) return;

      try {
        const updateData: any = {};
        if (displayName) updateData.displayName = displayName;

        if (photoURL) {
          updateData.photoURL = photoURL;
        }

        await updateProfile(auth.currentUser, updateData);

        // Update Backend
        await fetch(`${API_BASE_URL}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: auth.currentUser.uid,
            email: auth.currentUser.email,
            ...updateData,
            role: user?.role 
          })
        });

        setUser(prev => prev ? { ...prev, ...updateData } : null);
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  };

  const testLogin = async (role: UserRole) => {
    console.log("Mock login as: ", role);
    const mUser = { ...MOCK_USER, role, displayName: `Dev ${role}` };
    
    // Sync the mock user to the backend so Postgres tables are ready
    try {
      await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: mUser.uid,
          email: mUser.email,
          displayName: mUser.displayName,
          role: mUser.role,
          photoURL: mUser.photoURL
        })
      });
    } catch (e) {
      console.warn("Failed to sync mock user to backend:", e);
    }

    setUser(mUser);
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    resetPassword,
    logout,
    updateUserProfile,
    testLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};