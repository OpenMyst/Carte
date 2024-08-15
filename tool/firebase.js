import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAhejr6H5WCXaI6WlmnHeiRAlhm6KtaCv0",
    authDomain: "opmv1-e2c95.firebaseapp.com",
    projectId: "opmv1-e2c95",
    storageBucket: "opmv1-e2c95.appspot.com",
    messagingSenderId: "98112662561",
    appId: "1:98112662561:web:f923bcb33c8f5569bc4760",
    measurementId: "G-B4X3YR94DR"
};

const app = initializeApp(firebaseConfig);

export const database = getFirestore(app)