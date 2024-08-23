"use client"
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";
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

  // Créer un input pour le nom de la ville ou de l'emplacement
  const locationInput = document.createElement('input');
  locationInput.type = 'text';
  locationInput.className = 'w-full p-2 border border-gray-300 rounded-sm';
  locationInput.placeholder = 'Enter location name';

  // const savePlaceButton = document.createElement('button');
  // savePlaceButton.className = "w-full bg-secondary rounded-sm text-white m-1";
  // savePlaceButton.innerText = 'Save Place';
  // savePlaceButton.onclick = async () => {
  //   const locationName = locationInput.value; // Récupérer la valeur de l'input
  //   if (locationName) {
  //     console.log('Location:', locationName);
  //     console.log('Coordinates:', coordinates);
  //     await saveCoordonnePlace(userId, coordinates, locationName); // Ajouter locationName aux paramètres de la fonction
  //     // Fermer le popup
  //     marker.remove();
  //   } else {
  //     alert('Please enter a location name.');
  //   }
  // };
  
  const saveEventButton = document.createElement('button');
  saveEventButton.className = "w-full bg-primary rounded-sm text-white m-1";
  saveEventButton.innerText = 'Save location';
  saveEventButton.onclick = async () => {
    const locationName = locationInput.value; // Récupérer la valeur de l'input
    if (locationName) {
      console.log('Location:', locationName);
      console.log('Coordinates:', coordinates);
      await saveCoordonneEvent(userId, coordinates, locationName); // Ajouter locationName aux paramètres de la fonction
      // Fermer le popup
      marker.remove();
    } else {
      alert('Please enter a location name.');
    }
  };

  const deleteButton = document.createElement('button');
  deleteButton.className = "w-full rounded-sm text-white m-1";
  deleteButton.style.backgroundColor = "red";
  deleteButton.innerText = 'Delete';
  deleteButton.onclick = () => {
    marker.remove();
  };

  const divEventCreate = document.createElement('div');
  divEventCreate.className = "flex gap-1";
  divEventCreate.appendChild(deleteButton);
  divEventCreate.appendChild(saveEventButton);

  popupContent.appendChild(popupTitle);
  popupContent.appendChild(locationInput);
  popupContent.appendChild(divEventCreate);

  const popup = new mapboxgl.Popup().setDOMContent(popupContent)
  .on('open', () => {
    // Augmenter la taille de la croix de fermeture du popup
    const closeButton = popup.getElement().querySelector('.mapboxgl-popup-close-button');
    if (closeButton) {
      closeButton.style.fontSize = '30px'; // Augmenter la taille de la croix
      closeButton.style.width = '30px'; // Augmenter la taille de la zone cliquable
      closeButton.style.height = '30px';
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
 * @param {string} place - The name of the place locating
 */
export const saveCoordonneEvent = async (userId, coordinates, place) => {
  try {
    // Check if the location already exists in the database
    const lieuQuery = query(
      collection(database, 'ville'),
      where('ville', '==', place)
    );
    
    const querySnapshot = await getDocs(lieuQuery);

    if (!querySnapshot.empty) {
      // If the location already exists, show an error alert
      alert('Le lieu existe déjà dans la base de données.');
      return;
    }
    // Save the coordinates to the Firestore `events` collection
    const eventDocRef = await addDoc(collection(database, 'ville'), {
      ville: place,
      longitude: coordinates.lng,
      latitude: coordinates.lat,
      etat: 0
    });

    console.log('Location:', location);
  } catch (error) {
    console.error('Error adding event and location to Firestore:', error);
  }
}

/**
 * Saves the coordinates of an EreChretien to Firestore and associates it with a user.
 * 
 * @param {string} userId - The ID of the user for whom to save the event.
 * @param {object} coordinates - The coordinates of the event (lngLat object).
 * @param {string} place - The name of the place locating
 */
export const saveCoordonneEreChretien = async (userId, coordinates, place) => {
  try {
    // Check if the location already exists in the database
    const lieuQuery = query(
      collection(database, 'erechretiene'),
      where('ville', '==', place)
    );
    
    const querySnapshot = await getDocs(lieuQuery);

    if (!querySnapshot.empty) {
      // If the location already exists, show an error alert
      alert('Le lieu existe déjà dans la base de données.');
      return;
    }
    // Save the coordinates to the Firestore `events` collection
    const eventDocRef = await addDoc(collection(database, 'erechretiene'), {
      ville: place,
      longitude: coordinates.lng,
      latitude: coordinates.lat,
      etat: 0,
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
 * @param {string} place - The name of the place locating
 */
export const saveCoordonnePlace = async (userId, coordinates, place) => {
  try {
    // Check if the location already exists in the database
    const lieuQuery = query(
      collection(database, 'lieu'),
      where('ville', '==', place)
    );
    
    const querySnapshot = await getDocs(lieuQuery);

    if (!querySnapshot.empty) {
      // If the location already exists, show an error alert
      alert('Le lieu existe déjà dans la base de données.');
      return;
    }

    // Save the coordinates to the Firestore `lieu` collection
    const eventDocRef = await addDoc(collection(database, 'lieu'), {
      ville: place,
      longitude: coordinates.lng,
      latitude: coordinates.lat,
      etat: 0,
    });

    console.log('Lieu ajouté avec succès avec l\'ID :', eventDocRef.id);
    console.log('Coordonnées du lieu :', coordinates);
  } catch (error) {
    console.error('Erreur lors de l\'ajout du lieu à Firestore :', error);
  }
}

/**
 * Saves is user try to click in Plus button
 * 
 * @param {string} userId - The ID of the user for whom to save the event.
 */
export const createUserOpenFormulaire = async (userId) => {
  try {
    console.log("has clicked")
    const queryFetch = query(
      collection(database, 'openFormulaire'),
      where('idUser', '==', userId)
    )

    const hasCreateUser = await getDocs(queryFetch)

    if (!hasCreateUser.empty) {
      const docId = hasCreateUser.docs[0].id; // Récupère l'ID du document existant
      const hasCliqued = hasCreateUser.docs[0].data().isClique;
      const docRef = doc(database, 'openFormulaire', docId);
    
      await updateDoc(docRef, {
        isClique: !hasCliqued
      });
    
      console.log('Document mis à jour avec succès');
    } else {
      const addFormulaire = await addDoc(
        collection(database, 'openFormulaire'), {
          idUser: userId,
          isClique: true
        }
      );
    
      console.log('Nouveau document créé avec succès');
    }
  } catch (error) {
    console.error('Erreur lors de l\'ajout du formulaire à Firestore :', error);
  }
}