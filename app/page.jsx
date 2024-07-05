"use client";
import { MAPBOX_TOKEN, automnStyle, sprintStyle, winterDark, summerLight } from "@/tool/security";
import React, { useState, useEffect, useRef } from "react";
import mapboxgl from 'mapbox-gl';
import { collection, onSnapshot, query } from "firebase/firestore";
import { database } from "@/tool/firebase";
import Link from "next/link";

mapboxgl.accessToken = MAPBOX_TOKEN;

export default function Home() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(35.21633);
  const [lat, setLat] = useState(31.76904);
  const [zoom, setZoom] = useState(9);
  const [mapStyle, setMapStyle] = useState(sprintStyle);
  const [showBuilding, setShowBuilding] = useState(true);
  const [showMap3D, setShowMap3D] = useState(true);
  const [showRoad, setShowRoad] = useState(true);
  const [season, setSeason] = useState('spring');
  const [mountainHeight, setMountainHeight] = useState(100);

  const [evangileEvents, setEvangileEvents] = useState([]);
  const [open, setOpen] = useState(true);

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

    map.current.on('style.load', () => {
      map.current.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.terrain-rgb'
      });

      // map.current.setTerrain({ source: 'mapbox-dem', exaggeration: mountainHeight });

      loadEvangileMarker();
    });
    console.log(map)

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

      loadEvangileMarker();      
    }
  }, [season, mapStyle, evangileEvents]);

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

  const handleCheckboxChange = (layerId, property, value) => {
    if (map.current) {
      map.current.setLayoutProperty(layerId, property, value ? 'visible' : 'none');
    }
  };

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
            <label>Passer la carte en 3D</label>
            <input
              type="checkbox"
              checked={showMap3D}
              onChange={(e) => {
                setShowMap3D(e.target.checked);
              }}
            />
          </fieldset>
          <fieldset>
            <Link href="/map">
              <label>Afficher les Batiments</label>
            </Link>
          </fieldset>
          <fieldset>
            <label>Montrer le batiment</label>
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
            <label>Variation du Temps: {mountainHeight >= 100 ? -2000 : 2000 }</label>
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
