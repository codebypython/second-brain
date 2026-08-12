import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDXBd9FHwIpqXXD5sDGwJcgc4Nl7qSTHJU",
  authDomain: "second-brain-app-54a1b.firebaseapp.com",
  projectId: "second-brain-app-54a1b",
  storageBucket: "second-brain-app-54a1b.firebasestorage.app",
  messagingSenderId: "1045562884233",
  appId: "1:1045562884233:web:8c87c610a25dcc68a34658",
  measurementId: "G-3E0SBP1XT6"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

export async function ensureFirebaseAuth() {
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
      console.log('[Firebase Auth] Anonymous sign-in success:', auth.currentUser?.uid);
    } catch (err) {
      console.warn('[Firebase Auth] Anonymous sign-in warning:', err);
    }
  }
}

// Ensure anonymous authentication on app initialization
ensureFirebaseAuth();
