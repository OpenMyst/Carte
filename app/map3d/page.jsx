"use client"
import { MAPBOX_TOKEN, sprintStyleNight, sprintStyle, winterDark, summerLight } from "@/tool/security";
import React, { useState, useEffect, useRef } from "react";
import mapboxgl from 'mapbox-gl';
import { collection, onSnapshot, query } from "firebase/firestore";
import { database } from "@/tool/firebase";
import { addSnowLayer, addRainLayer, } from "./climat";
import { traceRouteRed } from "./utility";

mapboxgl.accessToken = MAPBOX_TOKEN;

const MapComponent = () => {
  const mapContainer = useRef(null);
  const [map, setMap] = useState(null);
  const [lng, setLng] = useState(35.21633);
  const [lat, setLat] = useState(31.76904);
  const [zoom, setZoom] = useState(9);
  const [showRoad, setShowRoad] = useState(true);
  const [showBuilding, setShowBuilding] = useState(true);
  const [showTemple, setShowTemple] = useState(true);
  const [season, setSeason] = useState('spring');
  const [mountainHeight, setMountainHeight] = useState(50);
  const [mapStyle, setMapStyle] = useState(sprintStyle);
  const [evangileEvents, setEvangileEvents] = useState([]);
  const [startTravel, setStartTravel] = useState([35.2297, 31.7738]);
  const [endTravel, setEndTravel] = useState([35.207639, 31.704306]);

  useEffect(() => {
    getAllEvent();
    getCurrentTime();
    loadThreeboxScript();
  }, [])

  useEffect(() => {
    if (map) {
      loadEvangileMarker(map);
    }
  }, [evangileEvents, map, mountainHeight]);

  useEffect(() => {
    if (map) {
      initializeMap();
    }
  }, [mountainHeight, showTemple]);

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

  const getCurrentTime = () => {
    const q = query(collection(database, 'current_time'))
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let eventsArray = []

      querySnapshot.forEach(doc => {
        eventsArray.push({ ...doc.data(), id: doc.id })
      })
    })
  }

  const loadThreeboxScript = () => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/gh/jscastro76/threebox@v.2.2.2/dist/threebox.min.js';
    script.type = 'text/javascript';
    script.async = true;
    script.onload = () => {
      if (mapContainer.current && !map) {
        initializeMap();
      }
    };
    document.head.appendChild(script);
  };

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
      map.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.terrain-rgb'
      });
      handleCheckboxChange('building-extrusion', 'visibility', false);

      map.setTerrain({ source: 'mapbox-dem', exaggeration: mountainHeight / 100 });

      loadEvangileMarker(map);
      map.addLayer({
        id: 'custom-threebox-model',
        type: 'custom',
        renderingMode: '3d',
        onAdd: function () {
          const scale = 10;
          const heightMultiple = mountainHeight < 100 ? 4 : 8;
          const options = {
            obj: '/assets/israel.gltf',
            type: 'gltf',
            scale: { x: scale, y: scale * heightMultiple, z: 20 },
            units: 'meters',
            rotation: { x: 90, y: -90, z: 0 }
          };

          tb.loadObj(options, (model) => {
            model.setCoords([35.2310, 31.7794]);
            model.setRotation({ x: 0, y: 0, z: 241 });
            tb.add(model);
          });

          const options2 = {
            obj: '/assets/golgotha.gltf',
            type: 'gltf',
            scale: { x: scale, y: scale, z: 15 },
            units: 'meters',
            rotation: { x: 90, y: -90, z: 0 }
          };

          tb.loadObj(options2, (model) => {
            model.setCoords([35.2298, 31.7781]);
            model.setRotation({ x: 0, y: 0, z: 241 });
            tb.add(model);
          });

          const options3 = {
            obj: '/assets/Palais_de_Lazare.gltf',
            type: 'gltf',
            scale: { x: scale, y: scale, z: 15 },
            units: 'meters',
            rotation: { x: 90, y: -90, z: 0 }
          };

          tb.loadObj(options3, (model) => {
            model.setCoords([35.2615, 31.7714]);
            model.setRotation({ x: 0, y: 0, z: 241 });
            tb.add(model);
          });
        },
        render: function () {
          tb.update();
        }
      });
      addRouteLayer(map)
    });
    setMap(map)
  };

  const addRouteLayer = async (map) => {
    try {
      const response = await fetch('/assets/route_palestine.geojson'); // Assurez-vous que le chemin est correct
      const routeData = await response.json();

      map.addSource('route', {
        'type': 'geojson',
        'data': routeData
      });

      map.addLayer({
        'id': 'route',
        'type': 'line',
        'source': 'route',
        'layout': {
          'line-join': 'round',
          'line-cap': 'round'
        },
        'paint': {
          'line-color': '#888',
          'line-width': 4
        }
      });

      traceRouteRed(map, routeData, startTravel, endTravel)
    } catch (error) {
      console.error('Error loading route data:', error);
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

      marker.getElement().addEventListener('click', () => {
        mapEvent.flyTo({
          center: [location.longitude, location.latitude],
          zoom: 20
        });
      })

      if (location.isPlay) {
        mapEvent.flyTo({
          center: [location.longitude, location.latitude],
          zoom: 15
        });

        const anneeEvent = parseInt(location.event_date)
        if (anneeEvent < 0) {
          setMountainHeight(20)
          setShowBuilding(false)
          setShowTemple(true)
          updateTerrain(map, 20, false)
        } else {
          setMountainHeight(0)
          setShowBuilding(false)
          setShowTemple(false)
          updateTerrain(map, 10, true)
        }

        const day = location.detail_jour;
        if (day === "Nuit") {
          mapEvent.setStyle(sprintStyleNight);
          setShowTemple(true);
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
      }
    });
  };

  const updateTerrain = (map, height, show) => {
    map.on('style.load', () => {
      map.setTerrain({ source: 'mapbox-dem', exaggeration: height / 100 });
      handleCheckboxChange('building-extrusion', 'visibility', show);
    });
  };

  const handleCheckboxChange = (layerId, property, value) => {
    if (map) {
      map.setLayoutProperty(layerId, property, value ? 'visible' : 'none');
    }
  };

  return (
    <div>
      <div ref={mapContainer} style={{ position: 'absolute', top: 0, bottom: 0, width: '100%' }} />
      <div className="map-overlay top w-[20vw]">
        <div className="map-overlay-inner">
          <fieldset>
            <label>Show temple</label>
            <input
              type="checkbox"
              checked={showTemple}
              onChange={(e) => {
                setShowTemple(e.target.checked);
              }}
            />
          </fieldset>
          <fieldset>
            <label>Show 3D map</label>
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
              id="showRoad"
              checked={showRoad}
              onChange={() => {
                setShowRoad(!showRoad);
                handleCheckboxChange('road-primary-navigation', 'visibility', showRoad);
                handleCheckboxChange('road-secondary-tertiary-navigation', 'visibility', showRoad);
                handleCheckboxChange('road-street-navigation', 'visibility', showRoad);
                handleCheckboxChange('road-minor-navigation', 'visibility', showRoad);
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

export default MapComponent;
