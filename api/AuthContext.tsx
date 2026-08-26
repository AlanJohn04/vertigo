import React, { createContext, useState, useEffect, useContext } from "react";
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { getAuthInstance, db } from "./firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "./config";

// Types
export type UserRole = "patient" | "practitioner";

export interface User extends FirebaseUser {
  role?: UserRole;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
    profileImageURL?: string
  ) => Promise<any>;
  signIn: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (displayName?: string, photoURL?: string) => Promise<void>;
  testLogin: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Helper to fetch user role from Backend (Neon Postgres)
  const fetchUserFromBackend = async (uidOrEmail: string): Promise<{ uid?: string; role?: UserRole; displayName?: string; email?: string; photoURL?: string } | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(uidOrEmail)}`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error("Error fetching user from Neon DB:", error);
      return null;
    }
  };

  useEffect(() => {
    const initSession = async () => {
      try {
        // 1. Try to restore saved session from local storage
        const savedSession = await AsyncStorage.getItem("userSession");
        const storedRole = (await AsyncStorage.getItem("userRole")) as UserRole;
        const storedUid = await AsyncStorage.getItem("userId");

        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession);
            if (parsed && (parsed.uid || parsed.email)) {
              setUser(parsed);
              setLoading(false);

              // Background refresh from Neon DB
              const dbData = await fetchUserFromBackend(parsed.email || parsed.uid);
              if (dbData && dbData.role) {
                const refreshed = { ...parsed, role: dbData.role, displayName: dbData.displayName || parsed.displayName };
                setUser(refreshed);
                await AsyncStorage.setItem("userSession", JSON.stringify(refreshed));
                await AsyncStorage.setItem("userRole", dbData.role);
              }
              return;
            }
          } catch (e) {
            console.warn("Error parsing saved userSession:", e);
          }
        } else if (storedUid && storedRole) {
          const dbData = await fetchUserFromBackend(storedUid);
          const restoredUser: User = {
            uid: storedUid,
            email: dbData?.email || "user@vertease.com",
            displayName: dbData?.displayName || "User",
            role: dbData?.role || storedRole,
            photoURL: dbData?.photoURL || null,
            emailVerified: true,
          } as unknown as User;
          setUser(restoredUser);
          await AsyncStorage.setItem("userSession", JSON.stringify(restoredUser));
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("Error initializing session:", err);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    // Firebase Auth State Listener
    try {
      const auth = getAuthInstance();
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const dbData = await fetchUserFromBackend(firebaseUser.email || firebaseUser.uid);
            const role = (dbData && dbData.role) ? dbData.role : ((await AsyncStorage.getItem("userRole")) as UserRole || "patient");

            const userWithRole = {
              ...firebaseUser,
              displayName: dbData?.displayName || firebaseUser.displayName,
              photoURL: dbData?.photoURL || firebaseUser.photoURL,
              role,
            } as User;

            setUser(userWithRole);
            await AsyncStorage.setItem("userId", firebaseUser.uid);
            await AsyncStorage.setItem("userRole", role);
            await AsyncStorage.setItem("userSession", JSON.stringify(userWithRole));
          } catch (e) {
            console.error("Error setting up Firebase user:", e);
          }
        }
      });

      return unsubscribe;
    } catch (e) {
      console.warn("Firebase auth listener setup notice:", e);
    }
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
      const cleanEmail = email.trim().toLowerCase();
      let uid = `user-${cleanEmail.replace(/[^a-z0-9]/g, '')}`;

      try {
        const auth = getAuthInstance();
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        uid = userCredential.user.uid;
        await updateProfile(userCredential.user, {
          displayName: fullName,
          photoURL: profileImageURL || null,
        });
      } catch (fbErr) {
        console.warn("Firebase signup fallback to direct backend:", fbErr);
      }

      // Sync user to Neon DB
      try {
        await fetch(`${API_BASE_URL}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid,
            email: cleanEmail,
            displayName: fullName,
            role,
            photoURL: profileImageURL || null,
          }),
        });
      } catch (dbErr) {
        console.error("Error saving user to Neon DB:", dbErr);
      }

      const userWithRole: User = {
        uid,
        email: cleanEmail,
        displayName: fullName,
        role,
        photoURL: profileImageURL || null,
        emailVerified: true,
      } as unknown as User;

      await AsyncStorage.setItem("userId", uid);
      await AsyncStorage.setItem("userRole", role);
      await AsyncStorage.setItem("userSession", JSON.stringify(userWithRole));

      setUser(userWithRole);
      return userWithRole;
    } catch (error: any) {
      console.error("Signup error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const cleanEmail = email.trim().toLowerCase();

      // 1. Fetch user profile from Neon DB to resolve their true registered role
      const dbUser = await fetchUserFromBackend(cleanEmail);
      const resolvedRole: UserRole = (dbUser && dbUser.role) ? dbUser.role : ((await AsyncStorage.getItem("userRole")) as UserRole || "patient");
      const resolvedDisplayName = dbUser?.displayName || cleanEmail.split('@')[0];

      // Handle common test user: test@gmail.com / test1234
      if (cleanEmail === "test@gmail.com" && password === "test1234") {
        const testUserObj: User = {
          uid: "test-user-uid-gmail",
          email: "test@gmail.com",
          displayName: "Test User",
          role: resolvedRole,
          photoURL: null,
          emailVerified: true,
        } as unknown as User;

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
        await AsyncStorage.setItem("userRole", resolvedRole);
        await AsyncStorage.setItem("userSession", JSON.stringify(testUserObj));
        setUser(testUserObj);
        return;
      }

      let uid = dbUser?.uid || `user-${cleanEmail.replace(/[^a-z0-9]/g, '')}`;
      let finalPhotoURL = dbUser?.photoURL || null;

      try {
        const auth = getAuthInstance();
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        uid = userCredential.user.uid;
        finalPhotoURL = userCredential.user.photoURL || finalPhotoURL;
      } catch (fbError: any) {
        console.warn("Firebase signIn fallback used:", fbError?.message || fbError);
      }

      const signedInUser: User = {
        uid,
        email: cleanEmail,
        displayName: resolvedDisplayName,
        role: resolvedRole,
        photoURL: finalPhotoURL,
        emailVerified: true,
      } as unknown as User;

      // Sync/Update in Neon DB
      try {
        await fetch(`${API_BASE_URL}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: signedInUser.uid,
            email: signedInUser.email,
            displayName: signedInUser.displayName,
            role: signedInUser.role,
            photoURL: signedInUser.photoURL
          })
        });
      } catch (e) {
        console.warn("Failed to sync user to Neon DB:", e);
      }

      await AsyncStorage.setItem("userId", uid);
      await AsyncStorage.setItem("userRole", resolvedRole);
      await AsyncStorage.setItem("userSession", JSON.stringify(signedInUser));
      setUser(signedInUser);
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
      try {
        const auth = getAuthInstance();
        await signOut(auth);
      } catch (e) {
        console.warn("SignOut notice:", e);
      }
    } finally {
      await AsyncStorage.removeItem("userSession");
      await AsyncStorage.removeItem("userRole");
      await AsyncStorage.removeItem("userId");
      setUser(null);
      setLoading(false);
    }
  };

  // Update user profile function
  const updateUserProfile = async (displayName?: string, photoURL?: string): Promise<void> => {
    if (!user) return;
    try {
      const updatedUser = {
        ...user,
        displayName: displayName || user.displayName,
        photoURL: photoURL || user.photoURL,
      };

      setUser(updatedUser);
      await AsyncStorage.setItem("userSession", JSON.stringify(updatedUser));

      await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: updatedUser.displayName,
          role: user.role,
          photoURL: updatedUser.photoURL
        })
      });
    } catch (error) {
      console.error("Error updating user profile:", error);
    }
  };

  const testLogin = async (role: UserRole) => {
    console.log("Setting active role:", role);
    const mockUid = role === "patient" ? "test-patient-uid" : "test-practitioner-uid";
    const mockEmail = role === "patient" ? "patient@vertease.com" : "practitioner@vertease.com";
    const mockName = role === "patient" ? "Demo Patient" : "Dr. Demo Practitioner";

    const mUser: User = {
      uid: mockUid,
      email: mockEmail,
      displayName: mockName,
      role,
      photoURL: null,
      emailVerified: true,
    } as unknown as User;

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
      console.warn("Failed to sync role user to Neon DB:", e);
    }

    await AsyncStorage.setItem("userId", mUser.uid);
    await AsyncStorage.setItem("userRole", role);
    await AsyncStorage.setItem("userSession", JSON.stringify(mUser));

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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};