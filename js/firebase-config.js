import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAuth, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { getFirestore, connectFirestoreEmulator } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB93SJCqYz7Q1WpZ3Rwc84pZdAC4b8vqt4",
  authDomain: "btdc-website.firebaseapp.com",
  projectId: "btdc-website",
  storageBucket: "btdc-website.firebasestorage.app",
  messagingSenderId: "223013126493",
  appId: "1:223013126493:web:9f8b8808f3f19102e3e8b4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const FIREBASE_API_KEY = firebaseConfig.apiKey;
