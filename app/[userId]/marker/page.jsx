"use client";
import { MAPBOX_TOKEN, sprintStyleNight, nightStyle, sprintStyle, winterDark, summerLight, automnStyle } from "@/tool/security";
import React, { useState, useEffect, useRef, useCallback } from "react";
import mapboxgl from 'mapbox-gl';
import { collection, onSnapshot, query } from "firebase/firestore";
import { database } from "@/tool/firebase";
import { addSnowLayer, addRainLayer, } from "@/lib/climat";
import { addRouteLayer } from "@/lib/layers";
import { Button } from "@/components/ui/button";
import { addMarkerEvent, userPlayEvent, createUserOpenFormulaire, addMarkerEventInCenter } from "@/tool/service";
import { PanelTopOpen, Plus, Volume1 } from "lucide-react";

mapboxgl.accessToken = MAPBOX_TOKEN;

export default function MapByUserId({ params }) {
    const userId = params.userId;
    const mapContainer = useRef(null); // Reference to the map container
    const [map, setMap] = useState(null); // Reference to the map object
    const [lng, setLng] = useState(35.21633); // Longitude state
    const [lat, setLat] = useState(31.76904); // Latitude state
    const [zoom, setZoom] = useState(15); // Zoom level state
    const [mapStyle, setMapStyle] = useState(nightStyle); // Map style state
    const [showBuilding, setShowBuilding] = useState(false); // Toggle for building visibility
    const [showRoad, setShowRoad] = useState(false); // Toggle for road visibility
    const [showMap3D, setShowMap3D] = useState(true); // Toggle for 3D map view
    const [mountainHeight, setMountainHeight] = useState(100); // Mountain height state
    const [evangileEvents, setEvangileEvents] = useState([]); // State for storing events
    const [lieux, setLieux] = useState([]); // State for storing place
    const [open, setOpen] = useState(true); // Toggle for overlay visibility
    const [startTravel, setStartTravel] = useState([]); // Start coordinates for route
    const [endTravel, setEndTravel] = useState([]); // End coordinates for route
    const [locationPlayId, setLocationPlayId] = useState(""); // Id of the location of event
    const [canAddEvent, setCanAddEvent] = useState(true); // Toggle for overlay visibility
    const [markerCordinate, setMarkerCordinate] = useState([lng, lat]);

    useEffect(() => {
        getAllEvent();
    }, []);

    useEffect(() => {
        if (map) return;
        initializeMap();
    }, [map, mapStyle, evangileEvents, showMap3D, showBuilding]);

    useEffect(() => {
        if (map) {
            loadEvangileMarker(map);
        }
    }, [evangileEvents, lieux, map]);

    useEffect(() => {
        if (map) {
            updateMapSettings();
            addRouteLayer(map, startTravel, endTravel);
        }
    }, [mountainHeight, showBuilding, showRoad]);


    useEffect(() => {
        if (map) {
            map.setPitch(showMap3D ? 75 : 0);
        }
    }, [showMap3D]);

    useEffect(() => {
        if (locationPlayId) {
            getTravelRoute();
        }
    }, [evangileEvents, locationPlayId]);

    useEffect(() => {
        if (map && startTravel && endTravel) {
            map.on('style.load', () => {
                if (startTravel && endTravel) {
                    addRouteLayer(map, startTravel, endTravel);
                }
            });

            if (startTravel && endTravel && map.isStyleLoaded()) {
                addRouteLayer(map, startTravel, endTravel);
            }
        }
    }, [map, startTravel, endTravel]);

    useEffect(() => {

        if (map) {
            if (canAddEvent) {
                addMarkerEventInCenter(map, userId, markerCordinate);
            }
        }

    }, [canAddEvent, markerCordinate, map]);

    // Initialize the start and End travel using the locationPlayId
    const getTravelRoute = () => {
        // Find the next event in the list
        const currentIndex = evangileEvents.findIndex(event => event.id === locationPlayId);
        const currentEvents = evangileEvents[currentIndex];
        if (currentEvents && currentIndex >= 0 && currentIndex < evangileEvents.length - 1) {
            setStartTravel([currentEvents.longitude, currentEvents.latitude]);
            const nextEvent = evangileEvents[currentIndex + 1];
            setEndTravel([nextEvent.longitude, nextEvent.latitude]);
        }
    }

    // Fetch all events and lieu from Firebase
    const getAllEvent = () => {
        const villes = []
        // Retrieving city from the 'ville' collection
        const qVille = query(collection(database, 'ville'));
        const unsubscribeVille = onSnapshot(qVille, (querySnapshot) => {
            querySnapshot.forEach(doc => {
                villes.push({ ...doc.data(), id: doc.id });
            });
        });

        // Retrieving Event from the 'erechretiene' collection
        const qEvangile = query(collection(database, 'erechretiene'));
        const unsubscribeEvangile = onSnapshot(qEvangile, (querySnapshot) => {
            let eventsArray = [];

            querySnapshot.forEach(doc => {
                const eventData = doc.data();
                if (eventData.etat === 15) {
                    // Find coordinates corresponding to city ID in 'ville'
                    const villeInfo = villes.find(ville => ville.ville === eventData.ville);
                    if (villeInfo) {
                        // Add city coordinates instead
                        eventsArray.push({
                            ...eventData,
                            longitude: villeInfo.longitude,
                            latitude: villeInfo.latitude
                        });
                    } else {
                        // If no match, add location without coordinates
                        eventsArray.push(eventData);
                    }
                }

            });
            setEvangileEvents(eventsArray);
        });

        // Retrieving places from the 'lieu' collection
        const qLieu = query(collection(database, 'lieu'));
        const unsubscribeLieu = onSnapshot(qLieu, (querySnapshot) => {
            let lieuxArray = [];

            querySnapshot.forEach(doc => {
                const lieuData = doc.data();

                if (lieuData.etat === 15) {
                    // Find coordinates corresponding to city ID in 'ville'
                    const villeInfo = villes.find(ville => ville.ville === lieuData.ville);

                    if (villeInfo) {
                        // Add city coordinates instead
                        lieuxArray.push({
                            ...lieuData,
                            longitude: villeInfo.longitude,
                            latitude: villeInfo.latitude
                        });
                    } else {
                        // If no match, add location without coordinates
                        lieuxArray.push(lieuData);
                    }
                }
            });
            setLieux(lieuxArray);
        });
    }

    const updateMapSettings = () => {
        if (map) {
            map.on('style.load', () => {
                map.addSource('mapbox-dem', {
                    type: 'raster-dem',
                    url: 'mapbox://mapbox.terrain-rgb'
                });
                handleCheckboxChange(map, 'building-extrusion', 'visibility', showBuilding);
                handleCheckboxChange('road-primary', 'visibility', showRoad);
                handleCheckboxChange('road-secondary-tertiary', 'visibility', showRoad);
                handleCheckboxChange('road-street', 'visibility', showRoad);
                handleCheckboxChange('road-minor', 'visibility', showRoad);
                handleCheckboxChange('road-major-link', 'visibility', showRoad);
                handleCheckboxChange('road-motorway-trunk', 'visibility', showRoad);
                handleCheckboxChange('tunnel-motorway-trunk', 'visibility', showRoad);
                handleCheckboxChange('tunnel-primary', 'visibility', showRoad);
                handleCheckboxChange('tunnel-secondary-tertiary', 'visibility', showRoad);
                map.setTerrain({ source: 'mapbox-dem', exaggeration: mountainHeight / 100 });
            });
        }
    };

    // Initialize the map into 3D
    const initializeMap = () => {
        const map = new mapboxgl.Map({
            container: mapContainer.current,
            style: mapStyle,
            center: [lng, lat],
            zoom: zoom,
            pitch: 75,
            bearing: 0,
        });

        const container = mapContainer.current;
        container.classList.add('bg-[#ff4d00]');
        container.style.filter = 'contrast(1.2) brightness(0.8)';

        map.on('move', () => {
            setLng(map.getCenter().lng.toFixed(4));
            setLat(map.getCenter().lat.toFixed(4));
            setMarkerCordinate(map.getCenter());
            setZoom(map.getZoom().toFixed(2));
        });

        map.addControl(new mapboxgl.NavigationControl());

        addRouteLayer(map, startTravel, endTravel);

        map.on('style.load', () => {
            map.addSource('mapbox-dem', {
                type: 'raster-dem',
                url: 'mapbox://mapbox.terrain-rgb'
            });

            map.once('idle', () => {
                map.setTerrain({ source: 'mapbox-dem', exaggeration: mountainHeight / 100 });
                map.on('style.load', () => {
                    if (map.getLayer('hillshade')) {
                        map.removeLayer('hillshade');
                    }
                });
            });

            if (mapStyle === nightStyle) {
                map.addLayer({
                    id: 'hillshade-layer',
                    type: 'hillshade',
                    source: 'mapbox-dem',
                    paint: {
                        'hillshade-exaggeration': mountainHeight / 100,
                        'hillshade-highlight-color': '#6B7280',
                        'hillshade-shadow-color': '#596575',
                        'hillshade-accent-color': '#596575'
                    }
                });
            }
            handleCheckboxChange('building-extrusion', 'visibility', showBuilding);
            handleCheckboxChange('road-primary', 'visibility', showRoad);
            handleCheckboxChange('road-secondary-tertiary', 'visibility', showRoad);
            handleCheckboxChange('road-street', 'visibility', showRoad);
            handleCheckboxChange('road-minor', 'visibility', showRoad);
            handleCheckboxChange('road-major-link', 'visibility', showRoad);
            handleCheckboxChange('road-motorway-trunk', 'visibility', showRoad);
            handleCheckboxChange('tunnel-motorway-trunk', 'visibility', showRoad);
            handleCheckboxChange('tunnel-primary', 'visibility', showRoad);
            handleCheckboxChange('tunnel-secondary-tertiary', 'visibility', showRoad);

            loadEvangileMarker(map);
        });

        setMap(map);
    }

    // Load markers for evangile events
    const loadEvangileMarker = (mapEvent) => {
        evangileEvents.forEach((location) => {
            const popup = new mapboxgl.Popup().setHTML(`
                <div class="flex flex-row h-[300px] w-[220px] static">
                    ${location.image && `<div class="w-full h-[60px] relative">
                        <img src="${location.image}" alt="${location.label}" class="w-full h-[150px]"/>
                    </div>`}
                    <div class="mt-[150px] fixed">
                        <h3 class="text-base font-bold text-center">${location.name}</h3>
                        <div class="flex gap-2">
                        <h4 class="text-sm font-regular">Date: ${location.date_debut}</h4> -
                        <h4 class="text-sm font-regular">${location.date_fin}</h4>
                        </div>
                        <p class="h-[110px] w-full overflow-y-scroll">${location.description}</p>
                    </div>
                </div>
                `);
            if (location.longitude && location.latitude) {
                const marker = new mapboxgl.Marker({ color: '#D8D4D5' })
                    .setLngLat([location.longitude, location.latitude])
                    .setPopup(popup) // Associe le popup au marqueur
                    .addTo(mapEvent);

                popup.on('open', () => {
                    //Increase the size of the popup closing cross
                    const closeButton = popup.getElement().querySelector('.mapboxgl-popup-close-button');
                    if (closeButton) {
                        closeButton.style.fontSize = '15px'; // Augmenter la taille de la croix
                        closeButton.style.width = '15px'; // Augmenter la taille de la zone cliquable
                        closeButton.style.height = '15px';
                    }
                });

                marker.getElement().addEventListener('click', () => {
                    mapEvent.flyTo({
                        center: [location.longitude, location.latitude],
                        zoom: 20
                    });
                })
            }
        });

        lieux.forEach((loc) => {
            const popup = new mapboxgl.Popup().setHTML(`
                <div>
                    <div class="flex flex-row h-[150px] w-[100px] static">
                        <div class="mt-2 fixed">
                        <h3 class="text-base font-bold text-center">${loc.ville}</h3>
                        <p class="ml-[-5px] mr-1 h-[120px]">${loc.description}</p>
                        </div>
                    </div>
                </div>
            `);
            popup.on('open', () => {
                //Increase the size of the popup closing cross
                const closeButton = popup.getElement().querySelector('.mapboxgl-popup-close-button');
                if (closeButton) {
                    closeButton.style.fontSize = '25px'; // Augmenter la taille de la croix
                    closeButton.style.width = '25px'; // Augmenter la taille de la zone cliquable
                    closeButton.style.height = '25px';
                }
            });
            if (loc.longitude && loc.latitude) {
                const marker = new mapboxgl.Marker({ color: '#0769C5' })
                    .setLngLat([loc.longitude, loc.latitude])
                    .setPopup(popup)
                    .addTo(mapEvent);

                marker.getElement().addEventListener('click', () => {
                    // setOpenDialogCity(true);
                    mapEvent.flyTo({
                        center: [loc.longitude, loc.latitude],
                        zoom: 20
                    });
                });
            }
        });
    };

    // Handle checkbox change for building visibility
    const handleCheckboxChange = (layerId, property, value) => {
        if (map) {
            map.setLayoutProperty(layerId, property, value ? 'visible' : 'none');
        }
    };

    // Handle mountain height change
    const handleMountainHeightChange = (event) => {
        const height = event.target.value;
        setMountainHeight(height);
        if (map.getTerrain()) {
            map.setTerrain({ source: 'mapbox-dem', exaggeration: height / 100 });
        }
    };

    const handleOpenFormulaire = (e) => {
        e.preventDefault();
        createUserOpenFormulaire(userId);
        setCanAddEvent(!canAddEvent);
    }

    return (
        <main>
            <div id="map" ref={mapContainer}></div>
            <div className={`map-overlay top w-[20vw]`}>
                {/* <button className="bg-[#2E2F31]/20 p-2 m-1 text-white rounded sm:block md:hidden" onClick={e => { e.preventDefault(); setOpen(!open) }}>
                    <PanelTopOpen className="text-black" />
                </button> */}
                <div className={`map-overlay-inner block`}>
                    <fieldset>
                        <Button variant="outlined" className="text-white font-bold" >EN</Button>
                    </fieldset>
                    <fieldset>
                        <Button variant="outlined" className="text-white font-bold">
                            <Volume1 />
                        </Button>
                    </fieldset>
                    <fieldset>
                        <Button variant="outlined" className="text-white font-bold" onClick={() => setShowMap3D(!showMap3D)}>
                            {showMap3D ? "2D" : "3D"}
                        </Button>
                    </fieldset>
                    {/*<fieldset>
                        <Button variant="outlined" className={`text-white font-bold`} >
                            <Plus />
                        </Button>
                    </fieldset>*/}
                </div>
            </div>
        </main>
    );
}
