import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyByrQgW_XgPI8neBQMlRhTnzZPe0Lf-czU",
  authDomain: "pragmatik-saha-takip.firebaseapp.com",
  projectId: "pragmatik-saha-takip",
  storageBucket: "pragmatik-saha-takip.firebasestorage.app",
  messagingSenderId: "583717013428",
  appId: "1:583717013428:web:b3aa5e4d68d1da7138d4e1"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
