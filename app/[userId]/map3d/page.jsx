"use client"
import { MAPBOX_TOKEN, sprintStyleNight, sprintStyle, winterDark, summerLight } from "@/tool/security";
import React, { useState, useEffect, useRef } from "react";
import mapboxgl from 'mapbox-gl';
import { collection, onSnapshot, query } from "firebase/firestore";
import { database } from "@/tool/firebase";
import { addSnowLayer, addRainLayer, } from "@/lib/climat";
import { addRouteLayer } from "@/lib/utility";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

mapboxgl.accessToken = MAPBOX_TOKEN;
/*
* Map3DComponent: a react page that displays 3D maps with 3D objects on top
*/
const Map3DComponent = ({ params }) => {
  const userId = params.userId;
  const mapContainer = useRef(null);
  const [map, setMap] = useState(null);
  const [lng, setLng] = useState(35.21633); // Longitude state
  const [lat, setLat] = useState(31.76904); // Latitude state
  const [zoom, setZoom] = useState(9); // Zoom level state
  const [mapStyle, setMapStyle] = useState(sprintStyle); // Map style state
  const [showBuilding, setShowBuilding] = useState(false); // Toggle for building visibility
  const [showTemple, setShowTemple] = useState(true); // Toggle for building visibility
  const [showRoad, setShowRoad] = useState(false); // Toggle for road visibility
  const [mountainHeight, setMountainHeight] = useState(50); // Mountain height state
  const [evangileEvents, setEvangileEvents] = useState([]); // State for storing events
  const [open, setOpen] = useState(true); // Toggle for overlay visibility
  const [startTravel, setStartTravel] = useState([35.2297, 31.7738]); // Start coordinates for route
  const [endTravel, setEndTravel] = useState([35.207639, 31.704306]); // End coordinates for route

  useEffect(() => {
    getAllEvent();
    loadThreeboxScript();
  }, [])

  useEffect(() => {
    if (map) {
      loadEvangileMarker(map);
    }
  }, [evangileEvents, map]);

  useEffect(() => {
    if (map) {
      updateMapSettings();
    }
  }, [mountainHeight, showBuilding]);

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

  //Load the Threebox librairie
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

  //Initialize the map with every 3D object loading with Threebox.js 
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
      map.setTerrain({ source: 'mapbox-dem', exaggeration: mountainHeight / 100 });
      map.setLayoutProperty('building-extrusion', 'visibility', showBuilding ? "vissible" : "none");
      // map.setLayoutProperty('building', 'visibility', showBuilding ? "vissible": "none");
      map.setLayoutProperty('road-primary', 'visibility', showRoad ? "visible" : "none");
      map.setLayoutProperty('road-secondary-tertiary', 'visibility', showRoad ? "visible" : "none");
      map.setLayoutProperty('road-street', 'visibility', showRoad ? "visible" : "none");
      map.setLayoutProperty('road-minor', 'visibility', showRoad ? "visible" : "none");
      map.setLayoutProperty('road-major-link', 'visibility', showRoad ? "visible" : "none");
      map.setLayoutProperty('road-motorway-trunk', 'visibility', showRoad ? "visible" : "none");
      map.setLayoutProperty('tunnel-motorway-trunk', 'visibility', showRoad ? "visible" : "none");
      map.setLayoutProperty('tunnel-primary', 'visibility', showRoad ? "visible" : "none");
      map.setLayoutProperty('tunnel-secondary-tertiary', 'visibility', showRoad ? "visible" : "none");
      map.setLayoutProperty('bridge-majore-link-2', 'visibility', showRoad ? "visible" : "none");

      loadEvangileMarker(map);

      map.addLayer({
        id: 'custom-threebox-model',
        type: 'custom',
        renderingMode: '3d',
        onAdd: function () {
          const scale = 10;
          const heightMultiple = mountainHeight < 50 ? 1 : 2;

          const loadAndPlaceModel = (options, coords) => {
            tb.loadObj(options, (model) => {
              model.setCoords(coords);
              model.setRotation({ x: 0, y: 0, z: 241 });
              tb.add(model);
            });
          };

          const options1 = {
            obj: '/assets/israel_temple.gltf',
            type: 'gltf',
            scale: { x: scale, y: scale * heightMultiple, z: 15 },
            units: 'meters',
            rotation: { x: 90, y: -90, z: 0 }
          };
          loadAndPlaceModel(options1, [35.2310, 31.7794]);

          const options2 = {
            obj: '/assets/golgotha.gltf',
            type: 'gltf',
            scale: { x: scale, y: scale / 2, z: 15 },
            units: 'meters',
            rotation: { x: 90, y: -90, z: 0 }
          };
          loadAndPlaceModel(options2, [35.2298, 31.7781]);

          const options3 = {
            obj: '/assets/Palais_de_Lazare.gltf',
            type: 'gltf',
            scale: { x: scale * 1.5, y: scale * heightMultiple, z: 15 },
            units: 'meters',
            rotation: { x: 90, y: -90, z: 0 }
          };
          loadAndPlaceModel(options3, [35.2615, 31.7714]);
        },
        render: function () {
          tb.update();
        }
      });

      addRouteLayer(map, startTravel, endTravel);
    });

    setMap(map);
  };

  const updateMapSettings = () => {
    if (map) {
      map.on('style.load', () => {
        map.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.terrain-rgb'
        });
        handleCheckboxChange(map, 'building-extrusion', 'visibility', showBuilding);
        handleCheckboxChange(map, 'building', 'visibility', showBuilding);
        handleCheckboxChange(map, 'road-primary-navigation', 'visibility', showRoad);
        handleCheckboxChange(map, 'road-secondary-tertiary-navigation', 'visibility', showRoad);
        handleCheckboxChange(map, 'road-street-navigation', 'visibility', showRoad);
        handleCheckboxChange(map, 'road-minor-navigation', 'visibility', showRoad);
        map.setTerrain({ source: 'mapbox-dem', exaggeration: mountainHeight / 100 });
      })
    }
  };

  // Load the location to zoom when user play one event
  const userPlayEvent = async () => {
    const q = query(collection(database, 'location'), where('idUser', '==', userId));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      querySnapshot.forEach(doc => {
        const data = { ...locationDoc.data(), id: locationDoc.id };
        if (data.isPlay) {
          const location = evangileEvents.filter(loc => loc.id === data.idEvents)
          mapEvent.flyTo({
            center: [location.longitude, location.latitude],
            zoom: 20
          });
        }
      })
    })
  }

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
        setShowTemple(true)
        updateTerrain(map, 50, false)
      } else {
        setMountainHeight(0)
        setShowBuilding(false)
        setShowTemple(false)
        updateTerrain(map, 10, true)
      }

      const day = location.detail_jour;
      if (day === "Nuit") {
        mapEvent.setStyle(winterDark);
        setShowTemple(true);
      } else if (day === "Matin") {
        mapEvent.setStyle(summerLight);
      } else {
        mapEvent.setStyle(winterDark);
        addSnowLayer(mapEvent)
      }
      userPlayEvent()
      const meteo = location.meteo;
      if (meteo === "Pluvieux") {
        addRainLayer(mapEvent)
      } else if (meteo === "Neigeux") {
        addSnowLayer(mapEvent)
      }
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

  return (
    <div>
      <div ref={mapContainer} style={{ position: 'absolute', top: 0, bottom: 0, width: '100%' }} />
      <div className="map-overlay top w-[20vw]">
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
                handleCheckboxChange('bridge-majore-link-2', 'visibility', !showRoad);
              }}
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
    </div>
  );
};

export default Map3DComponent;
