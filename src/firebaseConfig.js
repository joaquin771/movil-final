// src/firebaseConfig.js

import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; 
import AsyncStorage from "@react-native-async-storage/async-storage";


const firebaseConfig = {
  apiKey: "AIzaSyBlSx7Bqes5DDddWQEs7hXWODmfo70H-8g",
  authDomain: "desarrollomovil-b84d8.firebaseapp.com",
  projectId: "desarrollomovil-b84d8",
  storageBucket: "desarrollomovil-b84d8.appspot.com",
  messagingSenderId: "755886925167",
  appId: "1:755886925167:web:f5a668959b87ebd2fbb49a"
};


const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {

  auth = getAuth(app);
}

const db = getFirestore(app);

const storage = getStorage(app); 


export { app, auth, db, storage };