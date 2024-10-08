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

let marker;

/**
 * Adds a new marker to the map on click, saves its coordinates to Firestore,
 * and associates the event with the user.
 * 
 * @param {object} map - The Mapbox GL JS map instance.
 * @param {string} userId - The ID of the user for whom to save the event.
 * @param {number[]} event - Coordinates [lng, lat] where the marker should be placed.
 */
export const addMarkerEventInCenter = (map, userId, event) => {
  const popupContent = document.createElement('div');
  popupContent.className = 'h-[125px] w-[200px] static';

  const popupTitle = document.createElement('h4');
  popupTitle.className = "text-sm text-center mt-2";
  popupTitle.innerText = "Déplacez et zoomez sur la carte jusqu'à ce que le marqueur soit à l'endroit précis où vous souhaitez ajouter le lieu, puis cliquez sur:";

  const saveEventButton = document.createElement('button');
  saveEventButton.className = "w-full bg-primary rounded-sm text-white m-1 border-2 border-black";
  saveEventButton.innerText = 'Valider la position';
  saveEventButton.onclick = async () => {
    if (marker) {
      const lngLat = marker.getLngLat();
      await saveCoordonneEvent([lngLat.lng, lngLat.lat]); 
      // close the popup
      marker.remove();
      marker = null; 
    }
  };

  const divEventCreate = document.createElement('div');
  divEventCreate.className = "flex gap-1";
  divEventCreate.appendChild(saveEventButton);

  popupContent.appendChild(popupTitle);
  popupContent.appendChild(divEventCreate);

  const popup = new mapboxgl.Popup().setDOMContent(popupContent)
    .on('open', () => {
      const closeButton = popup.getElement().querySelector('.mapboxgl-popup-close-button');
      if (closeButton) {
        closeButton.style.fontSize = '30px'; 
        closeButton.style.width = '30px'; 
        closeButton.style.height = '30px';

        closeButton.onclick = () => {
          marker.remove();
          marker = null; 
        };
      }
    });

  if (!marker) {
    marker = new mapboxgl.Marker({ color: 'red', draggable: true })
      .setLngLat(event)
      .setPopup(popup)
      .addTo(map)
      .togglePopup();
  } else {
    marker.setLngLat(event);
    marker.setPopup(popup).togglePopup();
  }

  // Update coordinates when the marker is dragged
  marker.on('dragend', () => {
    const lngLat = marker.getLngLat();
    console.log('Updated coordinates:', [lngLat.lng, lngLat.lat]);
  });
}

/**
 * Saves the coordinates of an event to Firestore and associates it with a user.
 * 
 * @param {string} userId - The ID of the user for whom to save the event.
 * @param {object} coordinates - The coordinates of the event (lngLat object).
 * @param {string} place - The name of the place locating
 */
export const saveCoordonneEvent = async (coordinates) => {
  try {
    // Save the coordinates to the Firestore `events` collection
    const eventDocRef = await addDoc(collection(database, 'ville'), {
      longitude: coordinates[0],
      latitude: coordinates[1],
      etat: 0
    });
  } catch (error) {
    console.error('Error adding event and location to Firestore:', error);
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
      collection(database, 'clicked'),
      where('userId', '==', userId)
    )

    const hasCreateUser = await getDocs(queryFetch)

    if (!hasCreateUser.empty) {
      const docId = hasCreateUser.docs[0].id;
      const hasCliqued = hasCreateUser.docs[0].data().iscliked;
      const docRef = doc(database, 'clicked', docId);

      await updateDoc(docRef, {
        iscliked: !hasCliqued
      });

      console.log('Document mis à jour avec succès');
    } else {
      const addFormulaire = await addDoc(
        collection(database, 'clicked'), {
        userId: userId,
        iscliked: true
      }
      );

      console.log('Nouveau document créé avec succès');
    }
  } catch (error) {
    console.error('Erreur lors de l\'ajout du formulaire à Firestore :', error);
  }
}
