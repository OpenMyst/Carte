"use client"
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
export const addMarkerEvent = (map, userId, event) => {
  let coordinates = event.lngLat;

  const popupContent = document.createElement('div');
  popupContent.className = 'h-[200px] w-[200px] static';

  const popupTitle = document.createElement('h4');
  popupTitle.className = "text-lg text-center";
  popupTitle.innerText = "Want to check in to the event?"

  const savePlaceButton = document.createElement('button');
  savePlaceButton.className = "w-full";
  savePlaceButton.style.backgroundColor = "bg-secondary";
  savePlaceButton.style.color = "black";
  savePlaceButton.style.margin = "1px";
  savePlaceButton.style.padding = "5px";
  savePlaceButton.innerText = 'Save Place';
  savePlaceButton.onclick = async () => {
    console.log(coordinates)
    await saveCoordonnePlace(userId, coordinates);
    // Fermer le popup
    marker.remove();
  };
  
  const saveEventButton = document.createElement('button');
  saveEventButton.className = "w-full";
  saveEventButton.style.backgroundColor = "bg-primary";
  saveEventButton.style.color = "black";
  saveEventButton.style.margin = "1px";
  saveEventButton.style.padding = "5px";
  saveEventButton.innerText = 'Save Event';
  saveEventButton.onclick = async () => {
    console.log(coordinates)
    await saveCoordonneEvent(userId, coordinates);
    // Fermer le popup
    marker.remove();
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

  const divEventCreate = document.createElement('div');
  divEventCreate.className = "flex gap-1";
  divEventCreate.appendChild(saveEventButton);
  divEventCreate.appendChild(savePlaceButton);

  popupContent.appendChild(popupTitle);
  popupContent.appendChild(divEventCreate);
  popupContent.appendChild(deleteButton);

  const popup = new mapboxgl.Popup().setDOMContent(popupContent)
  .on('open', () => {
    // Augmenter la taille de la croix de fermeture du popup
    const closeButton = popup.getElement().querySelector('.mapboxgl-popup-close-button');
    if (closeButton) {
      closeButton.style.fontSize = '50px'; // Augmenter la taille de la croix
      closeButton.style.width = '50px'; // Augmenter la taille de la zone cliquable
      closeButton.style.height = '50px';
    }
  });

  // Create a new marker and add it to the map
  const marker = new mapboxgl.Marker({ color: 'red', draggable: true })
    .setLngLat(coordinates)
    .setPopup(popup)
    .addTo(map)
    .togglePopup();

  marker.on('dragend', () =>  {
    const lngLat = marker.getLngLat();
    coordinates = lngLat;
    console.log(coordinates)
  });

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
      etat: 0,
      description : "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam consectetur tincidunt aliquam. Proin ut consequat tortor, sed pellentesque ex. Fusce elementum ultrices lectus, sed aliquam dolor sodales eget. Mauris dictum porttitor libero at lacinia. Maecenas at arcu eu nunc posuere sollicitudin. Donec vel varius nisl. Vestibulum rutrum nulla diam, non bibendum ante auctor ut. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris sed augue vitae erat facilisis vulputate. Nam aliquam nibh vitae dui vulputate efficitur. Nulla bibendum at magna vitae ultrices.",
      label :"Lorem ipsum"
    });

    const eventId = eventDocRef.id;

    // Update the `location` collection with the new event ID and userId
    const location = await addDoc(collection(database, 'location'), {
      idUser: userId,
      idEvents: eventId,
      isPlay: false
    });

    console.log('Event and location successfully created with ID:', eventId);
    console.log('Location:', location);
  } catch (error) {
    console.error('Error adding event and location to Firestore:', error);
  }
}

/**
 * Saves the coordinates of an place to Firestore and associates it with a user.
 * 
 * @param {string} userId - The ID of the user for whom to save the event.
 * @param {object} coordinates - The coordinates of the event (lngLat object).
 */
export const saveCoordonnePlace = async (userId, coordinates) => {
  try {
    // Save the coordinates to the Firestore `events` collection
    const eventDocRef = await addDoc(collection(database, 'lieu'), {
      longitude: coordinates.lng,
      latitude: coordinates.lat,
      etat: 0,
    });

    console.log('Event and location successfully created with ID:', eventId);
    console.log('Location:', location);
  } catch (error) {
    console.error('Error adding event and location to Firestore:', error);
  }
}