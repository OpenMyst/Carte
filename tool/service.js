import { collection, query, where, getDocs } from "firebase/firestore";
import { database } from "@/tool/firebase";

/**
 * Retrieves the first event associated with a given user's play locations.
 * 
 * @param {string} userId - The ID of the user for whom to retrieve the play events.
 * @returns {Promise<string>} - A promise that resolves to ID of event to zooming
 */
export const userPlayEvent = async (userId) => {
  try {
    // Step 1: Retrieve locations for the given user where isPlay is true
    const locationsQuery = query(
      collection(database, 'location'),
      where('idUser', '==', userId),
      where('isPlay', '==', true)
    );
    const locationsSnapshot = await getDocs(locationsQuery);
    
    // Extract idEvents from the retrieved locations
    const eventIds = [];
    locationsSnapshot.forEach((doc) => {
      eventIds.push(doc.data().idEvents);
    });

    // Return the first event found
    return eventIds[0];
  } catch (error) {
    // Log the error and return an empty array in case of failure
    console.error('Error retrieving locations and events:', error);
    return [];
  }
};
