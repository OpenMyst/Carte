import { database } from "@/tool/firebase"
import { QuerySnapshot, addDoc, collection, onSnapshot, query } from "firebase/firestore"

export async function addCoordone(long, lat) {
    try {
        if(long !== 0 && lat !== 0) {
            await addDoc(collection(database, 'events'), {
                longitude: long,
                latitude: latitude
            })
        }
    } catch (error) {
        console.log(error)
    }
}

export async function getCoordonnées() {
    try {
        const q = query(collection(database, 'events'))
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            let eventsArray = []

            querySnapshot.forEach(doc => {
                eventsArray.push({...doc.data(), id: doc.id})
            })
            return eventsArray
        })

        return unsubscribe
    } catch (error) {
        console.log(error)
    }
}