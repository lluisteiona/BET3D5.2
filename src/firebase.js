import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAyPJj1tikHgRAms7UgO4lbVYtPoq91wVs",
  authDomain: "bet3d5.firebaseapp.com",
  projectId: "bet3d5",
  storageBucket: "bet3d5.firebasestorage.app",
  messagingSenderId: "1044542020926",
  appId: "1:1044542020926:web:f0291704b28643c942a06f",
};

const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);
