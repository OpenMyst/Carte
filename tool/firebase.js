import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCOaT89YEjtr1c0G-tfdVUGq4K94fFTy6Q",
    authDomain: "openmyst-6ea59.firebaseapp.com",
    projectId: "openmyst-6ea59",
    storageBucket: "openmyst-6ea59.appspot.com",
    messagingSenderId: "895368091035",
    appId: "1:895368091035:web:a58e235bbd1deacf4dfd3e"
};

const app = initializeApp(firebaseConfig);

export const database = getFirestore(app)