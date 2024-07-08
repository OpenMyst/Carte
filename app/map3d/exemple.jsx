"use client";
import { MAPBOX_TOKEN, automnStyle, sprintStyle, winterDark, summerLight } from "@/tool/security";
import React, { useState, useEffect, useRef } from "react";
import mapboxgl from 'mapbox-gl';
import { collection, onSnapshot, query } from "firebase/firestore";
import { database } from "@/tool/firebase";

mapboxgl.accessToken = MAPBOX_TOKEN;

export default function Home() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(35.21633);
  const [lat, setLat] = useState(31.76904);
  const [zoom, setZoom] = useState(9);
  const [mapStyle, setMapStyle] = useState(sprintStyle);
  const [showBuilding, setShowBuilding] = useState(true);
  const [showRoad, setShowRoad] = useState(true);
  const [season, setSeason] = useState('spring');
  const [mountainHeight, setMountainHeight] = useState(100);

  const [evangileEvents, setEvangileEvents] = useState([]);
  const [addedMarkers, setAddedMarkers] = useState([]);

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

    map.current.on("click", (e) => {
      const lngLat = e.lngLat;
      const existingMarker = addedMarkers.find(
        (marker) => marker.lng === lngLat.lng && marker.lat === lngLat.lat
      );

      if (!existingMarker) {
        const marker = new mapboxgl.Marker()
          .setLngLat([lngLat.lng, lngLat.lat])
          .setPopup(
            new mapboxgl.Popup().setHTML(`
              <div class="flex flex-col h-[150px]">
                <div class="w-full h-[5vw] bg-red">
                  <img src="${location.image}" alt="${location.label}" class="w-full h-[80px]"/>
                </div>
                <div>
                  <h3 class="text-lg text-center">${location.label}</h3>
                  <p>${location.description}</p>
                </div>
              </div>
            `)
          )
          .addTo(map.current);
          map.current.flyTo({
              center: [lngLat.lng, lngLat.lat],
              zoom: 18
            });
        setAddedMarkers([...addedMarkers, { lng: lngLat.lng, lat: lngLat.lat, marker }]);
      }
    });

    window.addEventListener('message', function (event) {
      const { lng, lat } = event.data;
      if (lng !== undefined && lat !== undefined) {
        map.current.flyTo({
          center: [lng, lat],
          zoom: 15,
        });

        new mapboxgl.Marker().setLngLat([lng, lat]).addTo(map.current);
      }
    }, false);

    map.current.on('style.load', () => {
      map.current.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.terrain-rgb'
      });

      map.current.setTerrain({ source: 'mapbox-dem', exaggeration: mountainHeight / 100 });

      loadEvangileMarker();
    });

  }, [map, mapStyle]);

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
    evangileEvents.forEach(location => {
      const marker = new mapboxgl.Marker()
        .setLngLat([location.longitude, location.latitude])
        .setPopup(new mapboxgl.Popup().setHTML(`
            <div class="flex flex-col h-[150px]">
            <div class="w-full h-[5vw] bg-red">
                <img src="${location.image}" alt="${location.label}" class="w-full h-[80px]"/>
              </div>
              <div ><h3 class="text-lg text-center">${location.label}</h3><p>${location.description}</p></div>
              
            </div>
          `))
        .addTo(map.current);

      marker.getElement().addEventListener('click', () => {
        map.current.flyTo({
          center: [location.longitude, location.latitude],
          zoom: 18
        });
        const day = location.detail_jour
        if(day === "Nuit") {
          setMapStyle(winterDark);
        } else if(day === "Matin") {
          setMapStyle(summerLight);
        } else {
          setMapStyle(winterDark);
        }
      });  
    });
  }

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
      <div className="map-overlay top w-[20vw]">
        <div className="map-overlay-inner">
          <fieldset className="select-fieldset">
            <label>Select season</label>
            <select value={season} onChange={(e) => setSeason(e.target.value)}>
              <option value="spring">Spring</option>
              <option value="summer">Summer</option>
              <option value="autumn">Autumn</option>
              <option value="winter">Winter</option>
            </select>
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
            <label>Show Road</label>
            <input
              type="checkbox"
              checked={showRoad}
              onChange={(e) => {
                setShowRoad(e.target.checked);
                handleCheckboxChange('road-simple', 'visibility', e.target.checked);
                handleCheckboxChange('road-minor', 'visibility', e.target.checked);
                handleCheckboxChange('road-primary', 'visibility', e.target.checked);
                handleCheckboxChange('bridge-simple', 'visibility', e.target.checked);
                handleCheckboxChange('bridge-case-simple', 'visibility', e.target.checked);
                handleCheckboxChange('tunnel-simple', 'visibility', e.target.checked);
                handleCheckboxChange('road-secondary-tertiary-navigation', e.target.checked);
                handleCheckboxChange('road-street-navigation', 'visibility', e.target.checked);
                handleCheckboxChange('road-minor-navigation', 'visibility', e.target.checked);
              }}
            />
          </fieldset>
          <fieldset>
            <label>Mountain Height: {mountainHeight}%</label>
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
