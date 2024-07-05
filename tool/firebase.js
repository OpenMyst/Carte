import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCpCO7Wa40DQ1m9_tQb5xetfQ-jEDQ6QFA",
    authDomain: "openmyst-77788.firebaseapp.com",
    projectId: "openmyst-77788",
    storageBucket: "openmyst-77788.appspot.com",
    messagingSenderId: "291395040943",
    appId: "1:291395040943:web:ffbde69f062d0b2e65065a"
};

const app = initializeApp(firebaseConfig);

export const database = getFirestore(app)