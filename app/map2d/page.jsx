"use client";
import { MAPBOX_TOKEN, automnStyle, sprintStyle, winterDark, summerLight } from "@/tool/security";
import React, { useState, useEffect, useRef } from "react";
import mapboxgl from 'mapbox-gl';
import { collection, onSnapshot, query } from "firebase/firestore";
import { database } from "@/tool/firebase";
import Link from "next/link";
import { addRouteLayer } from "@/lib/utility";

mapboxgl.accessToken = MAPBOX_TOKEN;

export default function Map2DComponent() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(35.21633); // Longitude state
  const [lat, setLat] = useState(31.76904); // Latitude state
  const [zoom, setZoom] = useState(9); // Zoom level state
  const [mapStyle, setMapStyle] = useState(sprintStyle); // Map style state
  const [showBuilding, setShowBuilding] = useState(false); // Toggle for building visibility
  const [showRoad, setShowRoad] = useState(false); // Toggle for road visibility
  const [showMap3D, setShowMap3D] = useState(true); //Toggle to show map into 3D
  const [season, setSeason] = useState('spring');
  const [mountainHeight, setMountainHeight] = useState(100); // Mountain height state
  const [evangileEvents, setEvangileEvents] = useState([]); // State for storing events
  const [open, setOpen] = useState(true); // Toggle for overlay visibility
  const [startTravel, setStartTravel] = useState([35.2297, 31.7738]); // Start coordinates for route
  const [endTravel, setEndTravel] = useState([35.207639, 31.704306]); // End coordinates for route

  useEffect(() => {
    getAllEvent();
  }, [])

  //Initialize the map with mapbox
  useEffect(() => {
    if (map.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: [lng, lat],
      zoom: zoom,
      pitch: 0,
      bearing: 0,
    });

    map.current.on('move', () => {
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
    });

    map.current.addControl(new mapboxgl.NavigationControl());

    map.current.on('style.load', () => {
      map.current.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.terrain-rgb'
      });
      
      handleCheckboxChange('building-extrusion', 'visibility', false);
      // map.current.setTerrain({ source: 'mapbox-dem', exaggeration: mountainHeight });

      loadEvangileMarker();
      addRouteLayer(map.current, startTravel, endTravel);
    });
    console.log(map)

  }, [map, mapStyle, evangileEvents, showMap3D, showBuilding]);

  //when the climat change
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

      loadEvangileMarker();      
    }
  }, [season, mapStyle, evangileEvents]);

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

  // Load markers for evangile events
  const loadEvangileMarker = () => {
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
        .addTo(map.current);
      
      const anneeEvent = parseInt(location.event_date)
      if ( anneeEvent > 0) {
        console.log(location.event_date)
        setMountainHeight(100)
        setShowBuilding(false)
        map.current.on('style.load', () => {
          map.current.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.terrain-rgb'
          });
          const terre = map.current.setTerrain({ source: 'mapbox-dem', exaggeration: mountainHeight / 100 });
          console.log(terre)
          handleCheckboxChange('building-extrusion', 'visibility', showBuilding);
        });
       
        
        
        console.log(mountainHeight)
      } else {
        setMountainHeight(0)
        setShowBuilding(true)
        map.current.on('style.load', () => {
          map.current.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.terrain-rgb'
          });
          const terre = map.current.setTerrain({ source: 'mapbox-dem', exaggeration: mountainHeight / 100 });
          console.log(terre)
          handleCheckboxChange('building-extrusion', 'visibility', showBuilding);
        });
        
        console.log(mountainHeight)
      }

      if (location.isPlay) {
        map.current.flyTo({
          center: [location.longitude, location.latitude],
          zoom: 20
        });

        const day = location.detail_jour;
        if (day === "Nuit") {
          setMapStyle(winterDark);
        } else if (day === "Matin") {
          setMapStyle(summerLight);
        } else {
          setMapStyle(winterDark);
        }
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
            <Link href="/map">
              <label>Show map in 2D</label>
            </Link>
          </fieldset>
          <fieldset>
            <label>Show Building</label>
            <input
              type="checkbox"
              checked={showBuilding}
              onChange={(e) => {
                setShowBuilding(e.target.checked);
                handleCheckboxChange('building-extrusion', 'visibility', e.target.checked);
              }}
            />
          </fieldset>

          <fieldset>
            <label>Time: {mountainHeight >= 100 ? -2000 : 2000 }</label>
            <input
              type="range"
              min="0"
              max="300"
              value={mountainHeight}
              onChange={handleMountainHeightChange}
            />
          </fieldset>
          <fieldset>
            <label>Longitude</label>
            <input
              type="number"
              value={lng}
              onChange={(e) => setLng(parseFloat(e.target.value))}
              id="longitude"
            />
          </fieldset>
          <fieldset>
            <label>Latitude</label>
            <input
              type="number"
              value={lat}
              onChange={(e) => setLat(parseFloat(e.target.value))}
              id="latitude"
            />
          </fieldset>
        </div>
      </div>
    </main>
  );
}
