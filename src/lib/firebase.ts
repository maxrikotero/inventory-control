import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Enable cache + multi-tab for better UX
const db = getApps().length
  ? getFirestore(app)
  : initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });

export { app, db };

// Initialize Firebase Auth with persistent session in the browser
const auth = getAuth(app);

if (typeof window !== "undefined") {
  // Ensure auth state persists across tabs and reloads
  setPersistence(auth, browserLocalPersistence).catch(() => {
    // Non-fatal: fallback to default persistence
  });
}

export { auth };
