import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC_9iO4zDeDNaBCZtHwY7X0C-SIwCPi4DU",
  authDomain: "gilded-vault-d4l.firebaseapp.com",
  databaseURL: "https://gilded-vault-d4l-default-rtdb.firebaseio.com",
  projectId: "gilded-vault-d4l",
  storageBucket: "gilded-vault-d4l.firebasestorage.app",
  messagingSenderId: "912140202890",
  appId: "1:912140202890:web:1d64f1a321924df9020e73"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
