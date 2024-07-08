"use client"
import { MAPBOX_TOKEN, winterDark } from "@/tool/security";
import React, { useState, useEffect, useRef } from "react";
import mapboxgl from 'mapbox-gl';
import { collection, onSnapshot, query } from "firebase/firestore";
import { database } from "@/tool/firebase";

mapboxgl.accessToken = MAPBOX_TOKEN;

const NightMapComponent = () => {
    const mapContainer = useRef(null);
    const [map, setMap] = useState(null);
    const [lng, setLng] = useState(35.21633);
    const [lat, setLat] = useState(31.76904);
    const [zoom, setZoom] = useState(9);
    const [showRoad, setShowRoad] = useState(true);
    const [showBuilding, setShowBuilding] = useState(true);
    const [season, setSeason] = useState('spring');
    const [mountainHeight, setMountainHeight] = useState(100);
    const [mapStyle, setMapStyle] = useState(winterDark);
    const [evangileEvents, setEvangileEvents] = useState([]);
    const [open, setOpen] = useState(true);

    useEffect(() => {
        getAllEvent();
        loadThreeboxScript()
    }, [])

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

    const loadThreeboxScript = () => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/gh/jscastro76/threebox@v.2.2.2/dist/threebox.min.js';
        script.type = 'text/javascript';
        script.async = true;
        script.onload = () => {
            if (mapContainer.current && !map) {
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

                    const tb = (window.tb = new Threebox(
                        map,
                        map.getCanvas().getContext('webgl'),
                        {
                            defaultLights: true
                        }
                    ));

                    map.on('style.load', () => {
                        // map.addSource('mapbox-dem', {
                        //     type: 'raster-dem',
                        //     url: 'mapbox://mapbox.terrain-rgb'
                        // });

                        // map.setTerrain({ source: 'mapbox-dem', exaggeration: mountainHeight / 100 });

                        loadEvangileMarker(map);
                        map.addLayer({
                            id: 'custom-threebox-model',
                            type: 'custom',
                            renderingMode: '3d',
                            onAdd: function () {
                                const scale = 10;
                                const options = {
                                    obj: '/assets/JERUSALEM.gltf',
                                    type: 'gltf',
                                    scale: { x: scale, y: scale * 2, z: 15 },
                                    units: 'meters',
                                    rotation: { x: 90, y: -90, z: 0 }
                                };

                                tb.loadObj(options, (model) => {
                                    model.setCoords([35.2296, 31.7787]);
                                    model.setRotation({ x: 0, y: 0, z: 241 });
                                    tb.add(model);
                                });
                            },
                            render: function () {
                                tb.update();
                            }
                        });
                    });

                    setMap(map);
                };

                initializeMap();
            }
        };
        if(showBuilding) {
            document.head.appendChild(script);
        } else {
            document.head.removeChild(script);
        }
    };

    const loadEvangileMarker = (mapEvent) => {
        evangileEvents.forEach((location) => {
            const popup = new mapboxgl.Popup().setHTML(`
            <div class="flex flex-row h-[300px] w-[220px]  static">
              <div class="w-full h-[5vw] bg-red relative">
                <img src="${location.image}" alt="${location.label}" class="w-full sm:h-[120px] md:h-[80px]"/>
              </div>
              <div class="mt-[120px] fixed md:mt-[80px]">
                <h3 class="text-base font-bold text-center">${location.label}</h3>
                <p class="h-[160px] overflow-y-scroll">${location.description}</p>
              </div>
            </div>
          `);

            const marker = new mapboxgl.Marker()
                .setLngLat([location.longitude, location.latitude])
                .setPopup(popup)  // Associe le popup au marqueur
                .addTo(mapEvent);

            if (location.isPlay) {
                mapEvent.flyTo({
                    center: [location.longitude, location.latitude],
                    zoom: 15
                });

                // setMountainHeight(150)

                loadThreeboxScript()
            }
        });
    };

    const addLocations = (map) => {
        jesusTravelLocations.forEach(location => {
            const marker = new mapboxgl.Marker()
                .setLngLat(location.coordinates)
                .setPopup(new mapboxgl.Popup().setText(location.name))
                .addTo(map);

            marker.getElement().addEventListener('click', () => {
                map.flyTo({
                    center: location.coordinates,
                    zoom: 16
                });
            });
        });
    };

    const handleCheckboxChange = (layerId, property, value) => {
        map.setLayoutProperty(layerId, property, value);
    };

    return (
        <div>
            <div ref={mapContainer} style={{ position: 'absolute', top: 0, bottom: 0, width: '100%' }} />
            <div className="map-overlay top w-[20vw]">
                <div className="map-overlay-inner">
                    {/*<fieldset>
                        <label>Show 3D map</label>
                        <input
                            type="checkbox"
                            checked={showBuilding}
                            onChange={(e) => {
                                setShowBuilding(e.target.checked);
                            }}
                        />
                    </fieldset>*/}
                    <fieldset>
                        <label>Show Road</label>
                        <input
                            type="checkbox"
                            id="showRoad"
                            checked={showRoad}
                            onChange={() => {
                                setShowRoad(!showRoad);
                                handleCheckboxChange('road-primary-navigation', 'visibility', showRoad ? 'visible' : 'none');
                                handleCheckboxChange('road-secondary-tertiary-navigation', 'visibility', showRoad ? 'visible' : 'none');
                                handleCheckboxChange('road-street-navigation', 'visibility', showRoad ? 'visible' : 'none');
                                handleCheckboxChange('road-minor-navigation', 'visibility', showRoad ? 'visible' : 'none');
                            }}
                        />
                    </fieldset>
                    <fieldset>
                        <label>Longitude</label>
                        <input type="number" value={lng} step="any" className="lat-lng" readOnly />
                    </fieldset>
                    <fieldset>
                        <label>Latitude</label>
                        <input type="number" value={lat} step="any" className="lat-lng" readOnly />
                    </fieldset>
                </div>
            </div>
        </div>
    );
};

export default NightMapComponent;
