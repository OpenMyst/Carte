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

    // // If no events are found, return an empty array
    // if (eventIds.length === 0) {
    //   return [];
    // }

    // // Step 2: Retrieve the corresponding events from the 'events' collection
    // const eventsQuery = query(
    //   collection(database, 'events'),
    //   where('__name__', 'in', eventIds)  // '__name__' corresponds to the document ID in Firestore
    // );
    // const eventsSnapshot = await getDocs(eventsQuery);

    // // Extract data from the retrieved events
    // const events = [];
    // eventsSnapshot.forEach((doc) => {
    //   events.push(doc.data());
    // });

    // Return the first event found
    return eventIds[0];
  } catch (error) {
    // Log the error and return an empty array in case of failure
    console.error('Error retrieving locations and events:', error);
    return [];
  }
};
