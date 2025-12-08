'use client';

import { getAuth, Auth } from 'firebase/auth';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';

interface FirebaseConfig {
  appId: string;
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  measurementId: string;
  messagingSenderId: string;
}

const firebaseConfig: FirebaseConfig = {
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
};

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase Analytics (only on client side)
let analytics: Analytics | null = null;

// Helper function to initialize analytics
const initializeAnalytics = async () => {
  if (typeof window !== 'undefined') {
    try {
      const supported = await isSupported();
      if (supported) {
        analytics = getAnalytics(app);
      }
    } catch (error) {
      console.error('Failed to initialize Firebase Analytics:', error);
    }
  }
};

// Initialize analytics
initializeAnalytics();

// Export a function to get analytics instance
export const getAnalyticsInstance = (): Analytics | null => analytics;

// Initialize other Firebase services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export { analytics };

export default app;
