"use client"
import { MAPBOX_TOKEN, sprintStyleNight, nightStyle, sprintStyle, winterDark, summerLight } from "@/tool/security";
import React, { useState, useEffect, useRef } from "react";
import mapboxgl from 'mapbox-gl';
import { collection, onSnapshot, query } from "firebase/firestore";
import { database } from "@/tool/firebase";
import { addSnowLayer, addRainLayer, } from "@/lib/climat";
import { addRouteLayer } from "@/lib/layers";
import { createUserOpenFormulaire, userPlayEvent } from "@/tool/service";
import { Plus, Volume1 } from "lucide-react";
import Spline from "@splinetool/react-spline";
import { Button } from "@/components/ui/button";

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
  const [mapStyle, setMapStyle] = useState(nightStyle); // Map style state
  const [showBuilding, setShowBuilding] = useState(false); // Toggle for building visibility
  const [showRoad, setShowRoad] = useState(false); // Toggle for road visibility
  const [showMap3D, setShowMap3D] = useState(true); // Toggle for 3D map view
  const [mountainHeight, setMountainHeight] = useState(80); // Mountain height state
  const [evangileEvents, setEvangileEvents] = useState([]); // State for storing events
  const [lieux, setLieux] = useState([]); // State for storing place
  const [canAddEvent, setCanAddEvent] = useState(false); // Toggle for overlay visibility
  const [startTravel, setStartTravel] = useState([]); // Start coordinates for route
  const [endTravel, setEndTravel] = useState([]); // End coordinates for route
  const [locationPlayId, setLocationPlayId] = useState(""); // Id of the location of event

  useEffect(() => {
    getAllEvent();
    loadThreeboxScript();
  }, []);

  useEffect(() => {
    if (map) {
      loadEvangileMarker(map);
      getUserPlayEvent(map);
    }
  }, [evangileEvents, lieux, map]);

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
      map.setPitch(showMap3D ? 75 : 0);
    }
  }, [showMap3D]);

  useEffect(() => {
    if (map && locationPlayId) {
      getUserPlayEvent(map);
    }
  }, [locationPlayId, evangileEvents, lieux, map, winterDark, summerLight]);

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

  //Received the location of the event who play by user and zoom in them
  const getUserPlayEvent = async (mapEvent) => {
    // Find the next event in the list
    const currentIndex = evangileEvents.findIndex(event => event.id === locationPlayId);
    const currentEvents = evangileEvents[currentIndex];

    if (currentEvents) {
      const anneeEvent = parseInt(currentEvents.event_date);
      if (anneeEvent < 0) {
        setMountainHeight(80);
        setShowBuilding(false);
        updateTerrain(mapEvent, 80, false);
      } else {
        setMountainHeight(0);
        setShowBuilding(false);
        updateTerrain(mapEvent, 20, false);
      }

      const day = location.detail_jour;
      if (day === "Nuit") {
        mapEvent.setStyle(sprintStyleNight);
      } else if (day === "Matin") {
        mapEvent.setStyle(summerLight);
      } else {
        mapEvent.setStyle(nightStyle);
      }

      const meteo = location.meteo;
      if (meteo === "Pluvieux") {
        mapEvent.setStyle(sprintStyle);
        addRainLayer(mapEvent);
      } else if (meteo === "Neigeux") {
        mapEvent.setStyle(winterDark);
        addSnowLayer(mapEvent);
      }

      const popup = new mapboxgl.Popup().setHTML(`
        <div>
          <div class="flex flex-row h-[300px] w-[220px] static">
            <div class="w-full h-[60px] relative">
              <img src="${currentEvents.image}" alt="${currentEvents.name}" class="w-full h-[150px]"/>
            </div>
            <div class="mt-[150px] fixed">
              <h3 class="text-base font-bold text-center">${currentEvents.name}</h3>
              <p class="h-[100px] overflow-y-scroll">${currentEvents.description}</p>
            </div>
          </div>
          <!--<button id="showJerusalemButton" class="bg-slate-500 w-full text-white ">Show Jerusalem</button> -->
        </div>
      `)
      .on('open', () => {
        //Increase the size of the popup closing cross
        const closeButton = popup.getElement().querySelector('.mapboxgl-popup-close-button');
        if (closeButton) {
          closeButton.style.fontSize = '30px';
          closeButton.style.width = '30px'; 
          closeButton.style.height = '30px';
        }
        // Add event listener when popup is opened
        const button = document.getElementById('showJerusalemButton');
        if (button) {
          button.addEventListener('click', () => {
            setOpenDialogCity(true);
          });
        }
      });

      const marker = new mapboxgl.Marker({ color: '#D8D4D5' })
        .setLngLat([currentEvents.longitude, currentEvents.latitude])
        .setPopup(popup) 
        .addTo(mapEvent)
        .togglePopup();

      mapEvent.flyTo({
        center: [currentEvents.longitude, currentEvents.latitude],
        zoom: 15
      });
    }
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
      pitch: 75,
      bearing: 0,
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
            'hillshade-highlight-color': '#9CA2AD',
            'hillshade-shadow-color': '#596575',
            'hillshade-accent-color': '#596575'
          }
        });
      }

      map.setLayoutProperty('building-extrusion', 'visibility', showBuilding ? "vissible" : "none");
      map.setLayoutProperty('road-primary', 'visibility', showRoad ? "visible" : "none");
      map.setLayoutProperty('road-secondary-tertiary', 'visibility', showRoad ? "visible" : "none");
      map.setLayoutProperty('road-street', 'visibility', showRoad ? "visible" : "none");
      map.setLayoutProperty('road-minor', 'visibility', showRoad ? "visible" : "none");
      map.setLayoutProperty('road-major-link', 'visibility', showRoad ? "visible" : "none");
      map.setLayoutProperty('road-motorway-trunk', 'visibility', showRoad ? "visible" : "none");
      map.setLayoutProperty('tunnel-motorway-trunk', 'visibility', showRoad ? "visible" : "none");
      map.setLayoutProperty('tunnel-primary', 'visibility', showRoad ? "visible" : "none");
      map.setLayoutProperty('tunnel-secondary-tertiary', 'visibility', showRoad ? "visible" : "none");

      loadEvangileMarker(map);

      map.addLayer({
        id: 'custom-threebox-model',
        type: 'custom',
        renderingMode: '3d',
        onAdd: function () {
          const scale = 2;
          const heightMultiple = mountainHeight < 80 ? 1 : 3;

          const loadAndPlaceModel = (options, coords) => {
            tb.loadObj(options, (model) => {
              model.setCoords(coords);
              model.setRotation({ x: -1.5, y: -1.5, z: 241 });
              // Traverse the model to set opacity
              model.traverse((child) => {
                if (child.isMesh) {
                  child.material.transparent = true;
                  child.material.opacity = 0.77;
                }
              });
              tb.add(model);
            });
          };

          const options1 = {
            obj: '/assets/jerusalem2.gltf',
            type: 'gltf',
            scale: { x: scale * 5 * 4, y: scale * 4 * heightMultiple, z: scale * 5 * 4 },
            units: 'meters',
            rotation: { x: 90, y: -90, z: 0 },
            altitude: 0
          };
          loadAndPlaceModel(options1, [35.2280, 31.7720]);

          const options2 = {
            obj: '/assets/golgot.gltf',
            type: 'gltf',
            scale: { x: scale * 5, y: scale * 4 * heightMultiple, z: 10 },
            units: 'meters',
            rotation: { x: 90, y: -90, z: 0 }
          };
          loadAndPlaceModel(options2, [35.2298, 31.7781]);

          const options3 = {
            obj: '/assets/Palais_de_Lazare.gltf',
            type: 'gltf',
            scale: { x: scale * 5, y: scale * 5, z: scale * 5 },
            units: 'meters',
            rotation: { x: 90, y: -90, z: 0 }
          };
          loadAndPlaceModel(options3, [35.2615, 31.7714]);
        },
        render: function () {
          tb.update();
        }
      });
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

  // Load markers for evangile events
  const loadEvangileMarker = (mapEvent) => {
    evangileEvents.forEach((location) => {
      const popup = new mapboxgl.Popup().setHTML(`
        <div>
          <div class="flex flex-row h-[300px] w-[220px] static">
            <div class="w-full h-[60px] relative">
              <img src="${location.image}" alt="${location.name}" class="w-full h-[150px]"/>
            </div>
            <div class="mt-[150px] fixed">
              <h3 class="text-base font-bold text-center">${location.name}</h3>
              <div class="flex gap-2">
                <h4 class="text-sm font-regular">Date: ${location.date_debut}</h4> -
                <h4 class="text-sm font-regular">${location.date_fin}</h4>
              </div>
              <p class="h-[100px] w-full overflow-y-scroll">${location.description}</p>
            </div>
            <!--<button id="showJerusalemButton" class="bg-slate-500 w-full text-white ">Show Jerusalem</button> -->
          </div>
        </div>
        `);

      const marker = new mapboxgl.Marker({ color: '#D8D4D5' })
        .setLngLat([location.longitude, location.latitude])
        .setPopup(popup) 
        .addTo(mapEvent);

      popup.on('open', () => {
        //Increase the size of the popup closing cross
        const closeButton = popup.getElement().querySelector('.mapboxgl-popup-close-button');
        if (closeButton) {
          closeButton.style.fontSize = '25px'; 
          closeButton.style.width = '25px'; 
          closeButton.style.height = '25px';
        }
        // Add event listener when popup is opened
        // const button = document.getElementById('showJerusalemButton');
        // if (button) {
        //   button.addEventListener('click', () => {
        //     setOpenDialogCity(true);
        //   });
        // }
      });

      marker.getElement().addEventListener('click', () => {
        // setOpenDialogCity(true);
        mapEvent.flyTo({
          center: [location.longitude, location.latitude],
          zoom: 20
        });
      })

    });
    lieux.forEach((loc) => {
      const popup = new mapboxgl.Popup().setHTML(`
        <div>
          <div class="flex flex-row h-[150px] w-[100px] static">
            <div class="mt-5 fixed">
              <h3 class="text-base font-bold text-center">${loc.ville}</h3>
              <p class="ml-[-5px] mr-1 h-[120px]">${loc.description}</p>
            </div>
          </div>
        </div>
        `).on('open', () => {
        //Increase the size of the popup closing cross
        const closeButton = popup.getElement().querySelector('.mapboxgl-popup-close-button');
        if (closeButton) {
          closeButton.style.fontSize = '25px'; 
          closeButton.style.width = '25px'; 
          closeButton.style.height = '25px';
        }
      });

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
      })
    })
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

  const handleOpenFormulaire = async (e) => {
    e.preventDefault();
    await createUserOpenFormulaire(userId);
    setCanAddEvent(!canAddEvent);
  }

  return (
    <div>
      <div id="map" ref={mapContainer} />
      <div className={`map-overlay top w-[20vw]`}>
        <div className={`map-overlay-inner block`}>
          {/*<Drawer direction="right" open={openDialogCity} onOpenChange={setOpenDialogCity}>
            <DrawerTrigger>
              <fieldset>
                <Label htmlFor="show-building">Show Jerusalem City</Label>
                <Switch
                  className="ml-[75px]"
                  id="show-building"
                  checked={openDialogCity}
                  onCheckedChange={() => {
                    setOpenDialogCity(!openDialogCity);
                  }} />
              </fieldset> 
            </DrawerTrigger>
            <DrawerContent >
              <Spline scene="https://prod.spline.design/3k6H1cbqT90axTHH/scene.splinecode" />
            </DrawerContent>
          </Drawer> */}
          <fieldset>
            <Button variant="outlined m-0" className="text-white font-bold" >EN</Button>
          </fieldset>
          <fieldset>
            <Button variant="outlined m-0" className="text-white font-bold">
              <Volume1 />
            </Button>
          </fieldset>
          <fieldset>
            <Button variant="outlined" className="text-white font-bold" onClick={() => setShowMap3D(!showMap3D)}>
              {showMap3D ? "2D" : "3D"}
            </Button>
          </fieldset>
          {/*<fieldset>
            <Button variant="outlined m-0" className={` ${canAddEvent ? "text-primary" : "text-white"} font-bold`} onClick={handleOpenFormulaire}>
              <Plus />
            </Button>
          </fieldset>*/}
        </div>
      </div>
    </div>
  );
};

export default Map3DComponent;
