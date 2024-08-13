"use client";
import { MAPBOX_TOKEN, automnStyle, sprintStyle, winterDark, summerLight } from "@/tool/security";
import React, { useState, useEffect, useRef, useCallback } from "react";
import mapboxgl from 'mapbox-gl';
import { collection, onSnapshot, query } from "firebase/firestore";
import { database } from "@/tool/firebase";
import { addSnowLayer, addRainLayer, } from "@/lib/climat";
import { addRouteLayer } from "@/lib/layers";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { addMarkerEvent, userPlayEvent } from "@/tool/service";
import { Menu } from "lucide-react";

mapboxgl.accessToken = MAPBOX_TOKEN;

export default function MapByUserId({ params }) {
    const userId = params.userId;
    const mapContainer = useRef(null); // Reference to the map container
    const [map, setMap] = useState(null); // Reference to the map object
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
    const [canAddEvent, setCanAddEvent] = useState(false); // Toggle for overlay visibility

    useEffect(() => {
        getAllEvent();
    }, []);

    useEffect(() => {
        if (map) return;
        initializeMap();
    }, [map, mapStyle, evangileEvents, showMap3D, showBuilding]);

    useEffect(() => {
        if (map) {
            const styles = {
                spring: sprintStyle,
                summer: summerLight,
                autumn: automnStyle,
                winter: winterDark,
            };
            setMapStyle(styles[season]);
            map.setStyle(mapStyle);
            getUserPlayEvent(map);
            loadEvangileMarker(map);
            addRouteLayer(map, startTravel, endTravel);
        }
    }, [season, mapStyle, evangileEvents, locationPlayId]);

    useEffect(() => {
        if (map) {
            loadEvangileMarker(map);
            getUserPlayEvent(map);
        }
    }, [evangileEvents, map]);

    useEffect(() => {
        if (map) {
            updateMapSettings();
            addRouteLayer(map, startTravel, endTravel);
        }
    }, [mountainHeight, showBuilding, showRoad]);

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
        if (map) {
            map.setPitch(showMap3D ? 62 : 0);
        }
    }, [showMap3D]);

    useEffect(() => {
        if (map && locationPlayId) {
            getUserPlayEvent(map);
        }
    }, [locationPlayId, evangileEvents, map, winterDark, summerLight]);

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

    const handleMapClick = useCallback((event) => {
        addMarkerEvent(map, userId, event);
    }, [canAddEvent, map, userId]);

    useEffect(() => {
        if (map) {
            console.log(canAddEvent)
            if (canAddEvent) {
                map.on('contextmenu', handleMapClick);
            } else {
                map.off('contextmenu', handleMapClick);
            }
        }
    }, [canAddEvent, map, handleMapClick]);

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

    // Fetch all events from Firebase
    const getAllEvent = () => {
        const q = query(collection(database, 'events'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            let eventsArray = [];

            querySnapshot.forEach(doc => {
                eventsArray.push({ ...doc.data(), id: doc.id });
            })
            setEvangileEvents(eventsArray);
        })
    }

    //Received the location of the event who play by user and zoom in them
    const getUserPlayEvent = async (mapEvent) => {
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
            }

            const meteo = currentEvents.meteo;
            if (meteo === "Pluvieux") {
                addRainLayer(mapEvent);
            } else if (meteo === "Neigeux") {
                addSnowLayer(mapEvent);
            }

            const popup = new mapboxgl.Popup().setHTML(`
            <div class="flex flex-row h-[300px] w-[220px] static">
              <div class="w-full h-[60px] relative">
                <img src="${currentEvents.image}" alt="${currentEvents.label}" class="w-full h-[150px]"/>
              </div>
              <div class="mt-[150px] fixed">
                <h3 class="text-base font-bold text-center">${currentEvents.label}</h3>
                <p class="h-[110px] overflow-y-scroll">${currentEvents.description}</p>
              </div>
            </div>
          `);

            const marker = new mapboxgl.Marker()
                .setLngLat([currentEvents.longitude, currentEvents.latitude])
                .setPopup(popup)  // Associe le popup au marqueur
                .addTo(mapEvent)
                .togglePopup();
            mapEvent.flyTo({
                center: [currentEvents.longitude, currentEvents.latitude],
                zoom: 15
            });
        }
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
            pitch: 62,
            bearing: -20,
        });

        map.on('move', () => {
            setLng(map.getCenter().lng.toFixed(4));
            setLat(map.getCenter().lat.toFixed(4));
            setZoom(map.getZoom().toFixed(2));
        });

        map.addControl(new mapboxgl.NavigationControl());

        addRouteLayer(map, startTravel, endTravel);

        map.on('style.load', () => {
            map.addSource('mapbox-dem', {
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

            map.setTerrain({ source: 'mapbox-dem', exaggeration: mountainHeight / 100 });
            loadEvangileMarker(map);
        });

        setMap(map);
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

    return (
        <main className="m-2">
            <div id="map" ref={mapContainer}></div>
            <div className={`map-overlay top w-[20vw] mt-12`}>
                <button className="bg-[#2E2F31]/20 p-2 m-1 text-white rounded sm:block md:hidden" onClick={e => { e.preventDefault(); setOpen(!open) }}>
                    <Menu />
                </button>
                <div className={`map-overlay-inner ${open ? "block" : "hidden"}`}>
                    <fieldset>
                        <Label htmlFor="show-building">Building</Label>
                        <Switch
                            id="show-building"
                            checked={showBuilding}
                            onCheckedChange={() => {
                                setShowBuilding(!showBuilding);
                                handleCheckboxChange('building-extrusion', 'visibility', !showBuilding);
                            }} />
                    </fieldset>
                    <fieldset>
                        <Label htmlFor="show-building">Add Event</Label>
                        <Switch
                            id="show-building"
                            checked={canAddEvent}
                            onCheckedChange={() => {
                                setCanAddEvent(!canAddEvent);
                                // handleCheckboxChange('building-extrusion', 'visibility', !showBuilding);
                            }} />
                    </fieldset>
                    <fieldset>
                        <Label htmlFor="showRoad">Paths</Label>
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
                        <Label htmlFor="show-building">3D</Label>
                        <Switch
                            id="show-building"
                            checked={showMap3D}
                            onCheckedChange={() => {
                                setShowMap3D(!showMap3D);
                            }} />
                    </fieldset>
                    <fieldset>
                        <Label>My position</Label>
                        <input type="number" value="" step="any" className="w-20 bg-transparent" readOnly />
                        <input type="number" value="" step="any" className="w-20 bg-transparent" readOnly />
                    </fieldset>
                </div>
            </div>
        </main>
    );
}
