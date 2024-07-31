import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { database } from "@/tool/firebase";
import mapboxgl from 'mapbox-gl';

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

/**
 * Adds a new marker to the map on click, saves its coordinates to Firestore,
 * and associates the event with the user.
 * 
 * @param {object} map - The Mapbox GL JS map instance.
 * @param {string} userId - The ID of the user for whom to save the event.
 */
export const addMarkerEvent = (map, userId) => {
  // Array to store markers (currently not used)
  const markers = [];

  // Add click event listener to the map
  map.on('click', async (e) => {
    const coordinates = e.lngLat;
    console.log(coordinates);

    const popupContent = document.createElement('div');
    popupContent.className = 'h-[200px] w-[100px] static';

    const popupTitle = document.createElement('h4');
    popupTitle.className = "text-lg text-center";
    popupTitle.innerText = "Vous voulez enregistrer dans l'evenement?"

    const saveButton = document.createElement('button');
    saveButton.className = "w-full";
    saveButton.style.backgroundColor = "blue";
    saveButton.style.color = "white";
    saveButton.style.margin = "1px";
    saveButton.style.padding = "5px";
    saveButton.innerText = 'Save';
    saveButton.onclick = async () => {
      await saveCoordonneEvent(userId, coordinates);
    };

    const deleteButton = document.createElement('button');
    deleteButton.className = "w-full";
    deleteButton.style.backgroundColor = "red";
    deleteButton.style.color = "white";
    deleteButton.style.margin = "1px";
    deleteButton.style.padding = "5px";
    deleteButton.innerText = 'Delete';
    deleteButton.onclick = () => {
      marker.remove();
    };

    popupContent.appendChild(popupTitle);
    popupContent.appendChild(saveButton);
    popupContent.appendChild(deleteButton);

    const popup = new mapboxgl.Popup().setDOMContent(popupContent);

    // Create a new marker and add it to the map
    const marker = new mapboxgl.Marker({ color: 'red' })
      .setLngLat(coordinates)
      .setPopup(popup)
      .addTo(map)
      .togglePopup();

    // Optional: Uncomment to add the marker to the array and enable removal on click
    // markers.push(marker);
    // marker.getElement().addEventListener('click', (event) => {
    //   event.stopPropagation();
    //   marker.remove();
    //   const index = markers.indexOf(marker);
    //   if (index > -1) {
    //     markers.splice(index, 1);
    //   }
    // });
  });
}

/**
 * Saves the coordinates of an event to Firestore and associates it with a user.
 * 
 * @param {string} userId - The ID of the user for whom to save the event.
 * @param {object} coordinates - The coordinates of the event (lngLat object).
 */
export const saveCoordonneEvent = async (userId, coordinates) => {
  try {
    // Save the coordinates to the Firestore `events` collection
    const eventDocRef = await addDoc(collection(database, 'events'), {
      longitude: coordinates.lng,
      latitude: coordinates.lat,
      event_date: "1944",
      timestamp: new Date().toISOString() // Add a timestamp to help with retrieval
    });

    const eventId = eventDocRef.id;

    // Update the `location` collection with the new event ID and userId
    await addDoc(collection(database, 'location'), {
      idUser: userId,
      idEvents: eventId,
      isPlay: false
    });

    console.log('Event and location successfully created with ID:', eventId);
  } catch (error) {
    console.error('Error adding event and location to Firestore:', error);
  }
}