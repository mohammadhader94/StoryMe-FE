
// import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
// import { getFirestore } from "firebase/firestore"; // Import getFirestore
// Add other Firebase services as needed, e.g., getAuth
// import { getAuth } from "firebase/auth";


// IMPORTANT: Environment variables are no longer strictly required as Firebase is disconnected.
// NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
// NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
// NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
// NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
// NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
// NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
// NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id (Optional)

/*
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};
*/

// Check if all necessary config values are present
/*
const configValues = Object.values(firebaseConfig);
const requiredConfigValues = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.storageBucket,
  firebaseConfig.messagingSenderId,
  firebaseConfig.appId,
];
*/

// Initialize Firebase (Commented out)
// let firebaseApp: FirebaseApp | undefined;
// let db: ReturnType<typeof getFirestore> | undefined; // Declare db variable

/*
if (!requiredConfigValues.some(value => !value)) {
    if (!getApps().length) {
      try {
        firebaseApp = initializeApp(firebaseConfig);
        console.log("Firebase initialized successfully.");
      } catch (e) {
          console.error("Firebase initialization error:", e);
          // Handle initialization error appropriately, maybe throw or set a flag
           throw new Error("Firebase failed to initialize. Check your config.");
      }
    } else {
      firebaseApp = getApp(); // if already initialized, use that one
      console.log("Firebase app already initialized.");
    }
    // Initialize Firestore only if FirebaseApp was successfully initialized/retrieved
    db = getFirestore(firebaseApp);
} else {
     console.error("Firebase configuration is missing or incomplete. Please check your environment variables (.env.local). Required fields:", Object.keys(firebaseConfig).filter((k, i) => i < requiredConfigValues.length && !requiredConfigValues[i]));
     // Prevent the app from proceeding without proper config
     // Setting firebaseApp and db to undefined or throwing an error might be appropriate
     // depending on how you want to handle this case. For now, we'll log the error.
     // @ts-ignore - Assign undefined to signal failure if needed elsewhere, though checks should prevent usage.
     firebaseApp = undefined;
     // @ts-ignore
     db = undefined;

     // It's often better to throw an error during startup if config is essential
     // throw new Error("Firebase configuration is missing or incomplete.");
}
*/

// === Firebase Disconnected ===
// The following lines are commented out to disconnect Firebase.
// The application will now use mock data provided in the services.
console.log("Firebase connection is currently disabled. Using mock data.");

// Export undefined or null placeholders if needed by other parts of the code,
// although ideally, code using these would be updated or conditionally check.
const firebaseApp = undefined;
const db = undefined;

export { firebaseApp, db };
// export { auth }; // Export other services if initialized (commented out)
