// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCyO2jd_IWntdanzZLC8LDM7RaiHAcgiZQ",
  authDomain: "wwl-faizers.firebaseapp.com",
  databaseURL: "https://wwl-faizers-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "wwl-faizers",
  storageBucket: "wwl-faizers.firebasestorage.app",
  messagingSenderId: "786855234991",
  appId: "1:786855234991:web:09ac0a62936768c193f35a",
  measurementId: "G-0HPLTPPL9K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
const db = getDatabase(app);

export { app, db };
