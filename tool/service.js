import { collection, query, where, getDocs } from "firebase/firestore";
import { database } from "@/tool/firebase";

export const userPlayEvent = async (userId) => {
  try {
    // Étape 1: Récupérer les locations pour un utilisateur donné où isPlay est true
    const locationsQuery = query(
      collection(database, 'location'),
      where('idUser', '==', userId),
      where('isPlay', '==', true)
    );
    const locationsSnapshot = await getDocs(locationsQuery);
    // Extraire les idEvents des locations récupérées
    const eventIds = [];
    locationsSnapshot.forEach((doc) => {
      eventIds.push(doc.data().idEvents);
    });

    // Si aucun événement n'est trouvé, retourner un tableau vide
    if (eventIds.length === 0) {
      return [];
    }

    // Étape 2: Récupérer les events correspondants dans la collection events
    const eventsQuery = query(
      collection(database, 'events'),
      where('__name__', 'in', eventIds)  // __name__ correspond à l'ID du document dans Firestore
    );
    const eventsSnapshot = await getDocs(eventsQuery);

    // Extraire les coordonnées des events récupérés
    const events = [];
    eventsSnapshot.forEach((doc) => {
      events.push(doc.data());
    });

    return events[0]
  } catch (error) {
    console.error('Error retrieving locations and events:', error);
    return [];
  }
}