import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getApps, initializeApp } from "firebase/app";
import { firebaseConfig } from "../firebase.config";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// Initialize Firebase
if(getApps().length === 0) {
  const app = initializeApp(firebaseConfig)
}
export const db = getDatabase()
export const auth = getAuth()
export const firestore = getFirestore()
export const storage = getStorage();

export const googleProvider = new GoogleAuthProvider();
//googleProvider.addScope('https://www.googleapis.com/auth/contacts.readonly');