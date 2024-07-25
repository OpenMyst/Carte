import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAWbc5U--CUsew7K9EgAqRVRnWP1V6mVdI",
    authDomain: "openmyst-e2268.firebaseapp.com",
    projectId: "openmyst-e2268",
    storageBucket: "openmyst-e2268.appspot.com",
    messagingSenderId: "518574925795",
    appId: "1:518574925795:web:f1432fada0e72bfeca62d6"
};

const app = initializeApp(firebaseConfig);

export const database = getFirestore(app)