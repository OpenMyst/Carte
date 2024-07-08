import { database } from "@/tool/firebase"
import { QuerySnapshot, addDoc, collection, onSnapshot, query } from "firebase/firestore"

export default async function getFamilytree() {
    try {
      const snapshot = await collection(database, 'people').get();
      const people = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
      return people
    } catch (error) {
      console.error({ error: 'Failed to fetch data' });
    }
  }