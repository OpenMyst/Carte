"use client";
import { MAPBOX_TOKEN, automnStyle, sprintStyle, winterDark, sprintStyleNight, summerLight } from "@/tool/security";
import React, { useState, useEffect, useRef } from "react";
import mapboxgl from 'mapbox-gl';
import { collection, onSnapshot, query } from "firebase/firestore";
import { database } from "@/tool/firebase";
import { addSnowLayer, addRainLayer, } from "@/lib/climat";
import { addRouteLayer } from "@/lib/layers";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { userPlayEvent } from "@/tool/service";

mapboxgl.accessToken = MAPBOX_TOKEN;

export default function Map2DByUserId({ params }) {
  const userId = params.userId;
  const mapContainer = useRef(null); // Reference to the map container
  const map = useRef(null); // Reference to the map object
  const [lng, setLng] = useState(35.21633); // Longitude state
  const [lat, setLat] = useState(31.76904); // Latitude state
  const [zoom, setZoom] = useState(9); // Zoom level state
  const [mapStyle, setMapStyle] = useState(sprintStyle); // Map style state
  const [showBuilding, setShowBuilding] = useState(true); // Toggle for building visibility
  const [showRoad, setShowRoad] = useState(true); // Toggle for road visibility
  const [showMap3D, setShowMap3D] = useState(false); // Toggle for 3D map view
  const [season, setSeason] = useState('spring'); // Season state
  const [mountainHeight, setMountainHeight] = useState(100); // Mountain height state
  const [evangileEvents, setEvangileEvents] = useState([]); // State for storing events
  const [open, setOpen] = useState(true); // Toggle for overlay visibility
  const [startTravel, setStartTravel] = useState([]); // Start coordinates for route
  const [endTravel, setEndTravel] = useState([]); // End coordinates for route
  const [locationPlay, setLocationPlay] = useState({}); // data of the location of event

  useEffect(() => {
    getAllEvent();
  }, [])

  useEffect(() => {
    if (map.current) return;
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

    updateMapSettings();
    addRouteLayer(map.current, startTravel, endTravel)
    loadEvangileMarker(map.current);
    getUserPlayEvent(map.current);
  }, [map, mapStyle, evangileEvents, showMap3D]);

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
      addRouteLayer(map.current, startTravel, endTravel);
      loadEvangileMarker(map.current);
    }
  }, [season, mapStyle, evangileEvents]);

  useEffect(() => {
    if (map.current) {
      getUserPlayEvent(map.current);
    }
  }, [locationPlay, startTravel, endTravel]);

  useEffect(() => {
    if (map.current) {
      updateMapSettings();
    }
  }, [mountainHeight, showBuilding, showRoad]);

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

  //Received the location of the event who play by user and zoom in them
  const getUserPlayEvent = async (mapEvent) => {
    const location = await userPlayEvent(userId);
    setLocationPlay(location)
    setStartTravel([location.longitude, location.latitude]);

    // Find the next event in the list
    const currentIndex = evangileEvents.findIndex(event => event.id === location.id);
    if (currentIndex >= 0 && currentIndex < evangileEvents.length - 1) {
      const nextEvent = evangileEvents[currentIndex + 1];
      setEndTravel([nextEvent.longitude, nextEvent.latitude]);
    }

    mapEvent.flyTo({
      center: [location.longitude, location.latitude],
      zoom: 15
    });
  }

  const updateMapSettings = () => {
    if (map.current) {
      map.current.on('style.load', () => {
        map.current.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.terrain-rgb'
        });
        handleCheckboxChange(map.current, 'building-extrusion', 'visibility', showBuilding);
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
      })
    }
  };
  // Load markers for evangile events
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

      marker.getElement().addEventListener('click', () => {
        mapEvent.flyTo({
          center: [location.longitude, location.latitude],
          zoom: 20
        });
      })

      const anneeEvent = parseInt(location.event_date)
      if (anneeEvent < 0) {
        setMountainHeight(50)
        setShowBuilding(false)
        mapEvent.setTerrain({ source: 'mapbox-dem', exaggeration: 50 / 100 });
        handleCheckboxChange('building-extrusion', 'visibility', true);
      } else {
        setMountainHeight(0)
        setShowBuilding(false)
        mapEvent.setTerrain({ source: 'mapbox-dem', exaggeration: 10 / 100 });
        handleCheckboxChange('building-extrusion', 'visibility', show);
      }

      const day = location.detail_jour;
      if (day === "Nuit") {
        mapEvent.setStyle(winterDark);
      } else if (day === "Matin") {
        mapEvent.setStyle(summerLight);
      } else {
        mapEvent.setStyle(winterDark);
        addSnowLayer(mapEvent)
      }

      const meteo = location.meteo;
      if (meteo === "Pluvieux") {
        addRainLayer(mapEvent)
      } else if (meteo === "Neigeux") {
        addSnowLayer(mapEvent)
      }
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
      <div id="map" ref={mapContainer} style={{ position: 'absolute', top: 0, bottom: 0, width: '100%' }}></div>
      <div className={`map-overlay top w-[20vw] `}>
        <button className="bg-[#1d4ed8] p-2 m-1 text-white rounded sm:block md:hidden" onClick={e => { e.preventDefault(); setOpen(!open) }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-list" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5" />
          </svg>
        </button>
        <div className={`map-overlay-inner ${open ? "block" : "hidden"}`}>
          <fieldset>
            <Label htmlFor="show-building">Pass in 3D</Label>
            <Switch
              id="show-building"
              checked={showMap3D}
              onCheckedChange={() => {
                setShowMap3D(!showMap3D);
              }} />
          </fieldset>
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
                handleCheckboxChange('bridge-majore-link-2', 'visibility', !showRoad);
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
