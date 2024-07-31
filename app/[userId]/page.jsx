"use client";
import { MAPBOX_TOKEN, automnStyle, sprintStyle, winterDark, summerLight } from "@/tool/security";
import React, { useState, useEffect, useRef } from "react";
import mapboxgl from 'mapbox-gl';
import { collection, onSnapshot, query } from "firebase/firestore";
import { database } from "@/tool/firebase";
import { addSnowLayer, addRainLayer, } from "@/lib/climat";
import { addRouteLayer } from "@/lib/layers";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { addMarkerEvent, userPlayEvent } from "@/tool/service";

mapboxgl.accessToken = MAPBOX_TOKEN;

export default function MapByUserId({ params }) {
    const userId = params.userId;
    const mapContainer = useRef(null); // Reference to the map container
    const map = useRef(null); // Reference to the map object
    const [lng, setLng] = useState(35.21633); // Longitude state
    const [lat, setLat] = useState(31.76904); // Latitude state
    const [zoom, setZoom] = useState(9); // Zoom level state
    const [mapStyle, setMapStyle] = useState(sprintStyle); // Map style state
    const [showBuilding, setShowBuilding] = useState(true); // Toggle for building visibility
    const [showRoad, setShowRoad] = useState(true); // Toggle for road visibility
    const [showMap3D, setShowMap3D] = useState(true); // Toggle for 3D map view
    const [season, setSeason] = useState('spring'); // Season state
    const [mountainHeight, setMountainHeight] = useState(100); // Mountain height state
    const [evangileEvents, setEvangileEvents] = useState([]); // State for storing events
    const [open, setOpen] = useState(true); // Toggle for overlay visibility
    const [startTravel, setStartTravel] = useState([]); // Start coordinates for route
    const [endTravel, setEndTravel] = useState([]); // End coordinates for route
    const [locationPlayId, setLocationPlayId] = useState(""); // Id of the location of event

    useEffect(() => {
        getAllEvent();
    }, []);

    useEffect(() => {
        if (map.current) return;
        initializeMap()
    }, [map, mapStyle, evangileEvents, showMap3D, showBuilding]);

    useEffect(() => {
        if (map.current) {
            map.current.setPitch(showMap3D ? 62 : 0);
        }
    }, [showMap3D]);

    useEffect(() => {
        if (map.current) {
            const styles = {
                spring: sprintStyle,
                summer: summerLight,
                autumn: automnStyle,
                winter: winterDark,
            };
            setMapStyle(styles[season]);
            map.current.setStyle(mapStyle);
            getUserPlayEvent(map.current);
            loadEvangileMarker(map.current);
        }
    }, [season, mapStyle, evangileEvents, locationPlayId]);

    useEffect(() => {
        const fetchLocationPlayId = async () => {
            const location = await userPlayEvent(userId);
            setLocationPlayId(location);
        };

        // Load the changment in the firebase
        const unsubscribe = onSnapshot(query(collection(database, 'location')), (snapshot) => {
            fetchLocationPlayId();
        });

        fetchLocationPlayId();
        return () => unsubscribe();
    }, [userId]);

    useEffect(() => {
        if (map.current && locationPlayId) {
            getUserPlayEvent(map.current);
        }
    }, [locationPlayId, evangileEvents, map, winterDark, summerLight])

    // useEffect(() => {
    //     if (locationPlayId) {
    //         getTravelRoute();
    //     }
    // }, [evangileEvents, locationPlayId]);

    // useEffect(() => {
    //     if (map.current && startTravel && endTravel) {
    //         map.current.on('style.load', () => {
    //             if (startTravel && endTravel) {
    //                 addRouteLayer(map.current, startTravel, endTravel);
    //             }
    //         });

    //         if (startTravel && endTravel && map.current.isStyleLoaded()) {
    //             addRouteLayer(map.current, startTravel, endTravel);
    //         }
    //     }
    // }, [map, startTravel, endTravel]);

    // // Initialize the start and End travel using the locationPlayId
    // const getTravelRoute = () => {
    //     // Find the next event in the list
    //     const currentIndex = evangileEvents.findIndex(event => event.id === locationPlayId);
    //     const currentEvents = evangileEvents[currentIndex];
    //     if (currentEvents && currentIndex >= 0 && currentIndex < evangileEvents.length - 1) {
    //         setStartTravel([currentEvents.longitude, currentEvents.latitude]);
    //         const nextEvent = evangileEvents[currentIndex + 1];
    //         setEndTravel([nextEvent.longitude, nextEvent.latitude]);
    //     }
    // }

    // Fetch all events from Firebase
    const getAllEvent = () => {
        const q = query(collection(database, 'events'))
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            let eventsArray = []

            querySnapshot.forEach(doc => {
                eventsArray.push({ ...doc.data(), id: doc.id })
            })
            setEvangileEvents(eventsArray);
        })
    }

    // Initialize the map into 3D
    const initializeMap = () => {
        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: mapStyle,
            center: [lng, lat],
            zoom: zoom,
            pitch: 62,
            bearing: -20,
        });

        map.current.on('move', () => {
            setLng(map.current.getCenter().lng.toFixed(4));
            setLat(map.current.getCenter().lat.toFixed(4));
            setZoom(map.current.getZoom().toFixed(2));
        });

        map.current.addControl(new mapboxgl.NavigationControl());

        addMarkerEvent(map.current, userId);

        map.current.on('style.load', () => {
            map.current.addSource('mapbox-dem', {
                type: 'raster-dem',
                url: 'mapbox://mapbox.terrain-rgb'
            });

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

            map.current.setTerrain({ source: 'mapbox-dem', exaggeration: mountainHeight / 100 });
            loadEvangileMarker(map.current);
        });
    }

    //Received the location of the event who play by user and zoom in them
    const getUserPlayEvent = async (mapEvent) => {
        if (locationPlayId) {
            // Find the next event in the list
            const currentIndex = evangileEvents.findIndex(event => event.id === locationPlayId);
            const currentEvents = evangileEvents[currentIndex];

            if (currentEvents) {
                const anneeEvent = parseInt(currentEvents.event_date);
                if (anneeEvent < 0) {
                    setMountainHeight(50);
                    setShowBuilding(false);
                    updateTerrain(mapEvent, 50, false);
                } else {
                    setMountainHeight(0);
                    setShowBuilding(false);
                    updateTerrain(mapEvent, 10, false);
                }

                const day = currentEvents.detail_jour;
                if (day === "Nuit") {
                    mapEvent.setStyle(winterDark);
                } else if (day === "Matin") {
                    mapEvent.setStyle(summerLight);
                } else {
                    mapEvent.setStyle(winterDark);
                    addSnowLayer(mapEvent);
                }

                const meteo = currentEvents.meteo;
                if (meteo === "Pluvieux") {
                    addRainLayer(mapEvent);
                } else if (meteo === "Neigeux") {
                    addSnowLayer(mapEvent);
                }
                mapEvent.flyTo({
                    center: [currentEvents.longitude, currentEvents.latitude],
                    zoom: 15
                });
            }
        }
    }

    // Load markers for evangile events
    const loadEvangileMarker = (mapEvent) => {
        evangileEvents.forEach((location) => {
            const popup = new mapboxgl.Popup().setHTML(`
                <div class="flex flex-row h-[300px] w-[220px] static">
                    <div class="w-full h-[60px] relative">
                        <img src="${location.image}" alt="${location.label}" class="w-full h-[150px]"/>
                    </div>
                    <div class="mt-[150px] fixed">
                        <h3 class="text-base font-bold text-center">${location.label}</h3>
                        <p class="h-[110px] overflow-y-scroll">${location.description}</p>
                    </div>
                </div>
                `);

            const marker = new mapboxgl.Marker()
                .setLngLat([location.longitude, location.latitude])
                .setPopup(popup) // Associe le popup au marqueur
                .addTo(mapEvent);

            marker.getElement().addEventListener('click', () => {
                mapEvent.flyTo({
                    center: [location.longitude, location.latitude],
                    zoom: 20
                });
            })
        });
    };

    //update the terrain in the map when the height of mountain has changed
    const updateTerrain = (map, height, show) => {
        map.on('style.load', () => {
            map.setTerrain({ source: 'mapbox-dem', exaggeration: height / 100 });
            handleCheckboxChange('building-extrusion', 'visibility', show);
        });
    };

    // Handle checkbox change for building visibility
    const handleCheckboxChange = (layerId, property, value) => {
        if (map.current) {
            map.current.setLayoutProperty(layerId, property, value ? 'visible' : 'none');
        }
    };

    // Handle mountain height change
    const handleMountainHeightChange = (event) => {
        const height = event.target.value;
        setMountainHeight(height);
        if (map.current.getTerrain()) {
            map.current.setTerrain({ source: 'mapbox-dem', exaggeration: height / 100 });
        }
    };

    return (
        <main className="m-2">
            <div id="map" ref={mapContainer}></div>
            <div className={`map-overlay top w-[20vw] `}>
                <button className="bg-[#1d4ed8] p-2 m-1 text-white rounded sm:block md:hidden" onClick={e => { e.preventDefault(); setOpen(!open) }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-list" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5" />
                    </svg>
                </button>
                <div className={`map-overlay-inner ${open ? "block" : "hidden"}`}>
                    <fieldset>
                        <Label htmlFor="show-building">Show Building</Label>
                        <Switch
                            id="show-building"
                            checked={showBuilding}
                            onCheckedChange={() => {
                                setShowBuilding(!showBuilding);
                                handleCheckboxChange('building-extrusion', 'visibility', !showBuilding);
                            }} />
                    </fieldset>
                    <fieldset>
                        <Label htmlFor="showRoad">Show Road</Label>
                        <Switch
                            id="showRoad"
                            checked={showRoad}
                            onCheckedChange={() => {
                                setShowRoad(!showRoad);
                                handleCheckboxChange('road-primary', 'visibility', !showRoad);
                                handleCheckboxChange('road-secondary-tertiary', 'visibility', !showRoad);
                                handleCheckboxChange('road-street', 'visibility', !showRoad);
                                handleCheckboxChange('road-minor', 'visibility', !showRoad);
                                handleCheckboxChange('road-major-link', 'visibility', !showRoad);
                                handleCheckboxChange('road-motorway-trunk', 'visibility', !showRoad);
                                handleCheckboxChange('tunnel-motorway-trunk', 'visibility', !showRoad);
                                handleCheckboxChange('tunnel-primary', 'visibility', !showRoad);
                                handleCheckboxChange('tunnel-secondary-tertiary', 'visibility', !showRoad);
                            }}
                        />
                    </fieldset>
                    <fieldset>
                        <label>Variation du Temps: {mountainHeight >= 100 ? -2000 : 2000}</label>
                        <input
                            type="range"
                            min="0"
                            max="300"
                            value={mountainHeight}
                            onChange={handleMountainHeightChange}
                        />
                    </fieldset>
                    <fieldset>
                        <Label>Longitude</Label>
                        <input type="number" value={lng} step="any" className="lat-lng" readOnly />
                    </fieldset>
                    <fieldset>
                        <Label>Latitude</Label>
                        <input type="number" value={lat} step="any" className="lat-lng" readOnly />
                    </fieldset>
                </div>
            </div>
        </main>
    );
}
