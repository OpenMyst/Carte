"use client";
import { MAPBOX_TOKEN, sprintStyleNight, nightStyle, sprintStyle, winterDark, summerLight, automnStyle } from "@/tool/security";
import React, { useState, useEffect, useRef } from "react";
import mapboxgl from 'mapbox-gl';
import { collection, onSnapshot, query } from "firebase/firestore";
import { database } from "@/tool/firebase";
import { addSnowLayer, addRainLayer, } from "@/lib/climat";
import { addRouteLayer } from "@/lib/layers";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { userPlayEvent } from "@/tool/service";
import { PanelTopOpen, Plus, Volume1 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

mapboxgl.accessToken = MAPBOX_TOKEN;

export default function Map2DByUserId({ params }) {
  const mapContainer = useRef(null); // Reference to the map container
  const map = useRef(null); // Reference to the map object
  const [lng, setLng] = useState(35.21633); // Longitude state
  const [lat, setLat] = useState(31.76904); // Latitude state
  const [zoom, setZoom] = useState(9); // Zoom level state
  const [mapStyle, setMapStyle] = useState(nightStyle); // Map style state
  const [showBuilding, setShowBuilding] = useState(true); // Toggle for building visibility
  const [showRoad, setShowRoad] = useState(true); // Toggle for road visibility
  const [showMap3D, setShowMap3D] = useState(false); // Toggle for 3D map view
  const [season, setSeason] = useState('spring'); // Season state
  const [mountainHeight, setMountainHeight] = useState(100); // Mountain height state
  const [evangileEvents, setEvangileEvents] = useState([]); // State for storing events
  const [lieux, setLieux] = useState([]); // State for storing events
  const [open, setOpen] = useState(true); // Toggle for overlay visibility
  const [startTravel, setStartTravel] = useState([]); // Start coordinates for route
  const [endTravel, setEndTravel] = useState([]); // End coordinates for route
  const [openDialogCity, setOpenDialogCity] = useState(false);

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
      pitch: 0,
      pitchWithRotate: false,
      bearing: 0,
    });

    map.current.on('move', () => {
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
    });

    map.current.addControl(new mapboxgl.NavigationControl());

    updateMapSettings();
    loadEvangileMarker(map.current);
    addRouteLayer(map.current, startTravel, endTravel);
  }, []);

  useEffect(() => {
    if (map.current) {
      loadEvangileMarker(map.current);
    }
  }, [evangileEvents, lieux, map]);

  useEffect(() => {
    if (map.current) {
      updateMapSettings();
      addRouteLayer(map.current, startTravel, endTravel);
    }
  }, [mountainHeight, evangileEvents, showBuilding, showRoad]);

  useEffect(() => {
    if (map.current) {
      map.current.setPitch(showMap3D ? 62 : 0);
    }
  }, [showMap3D]);

  // Fetch all events from Firebase
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

  const updateMapSettings = () => {
    if (map.current) {
      map.current.on('style.load', () => {
        addRouteLayer(map.current, startTravel, endTravel);
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
      });
    }
  };
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

      const marker = new mapboxgl.Marker({ color: '#D8D4D5' })
        .setLngLat([location.longitude, location.latitude])
        .setPopup(popup)  // Associe le popup au marqueur
        .addTo(mapEvent);

      marker.getElement().addEventListener('click', () => {
        mapEvent.flyTo({
          center: [location.longitude, location.latitude],
          zoom: 20
        });
      })

      const anneeEvent = parseInt(location.event_date);
      if (anneeEvent < 0) {
        setMountainHeight(50);
        setShowBuilding(false);
        updateTerrain(mapEvent, 50, false);
      } else {
        setMountainHeight(0);
        setShowBuilding(false);
        updateTerrain(mapEvent, 10, false);
      }

      const day = location.detail_jour;
      if (day === "Nuit") {
        mapEvent.setStyle(sprintStyleNight);
      } else if (day === "Matin") {
        mapEvent.setStyle(automnStyle);
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
    });
    lieux.forEach((loc) => {
      console.log(loc)
      const popupLieu = new mapboxgl.Popup().setHTML(`
        <div>
          <div class="flex flex-row h-[150px] w-[100px] static">
              <div class="mt-2 fixed">
              <h3 class="text-base font-bold text-center">${loc.ville}</h3>
              <p class="ml-[-5px] mr-1 h-[120px]">${loc.description}</p>
              </div>
          </div>
        </div>
      `);

      const mark = new mapboxgl.Marker({ color: '#0769C5' })
        .setLngLat([loc.longitude, loc.latitude])
        .setPopup(popupLieu)
        .addTo(mapEvent);

      mark.getElement().addEventListener('click', () => {
        // setOpenDialogCity(true);
        mapEvent.flyTo({
          center: [loc.longitude, loc.latitude],
          zoom: 20
        });
      });
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

  const handleRegisterClick = () => {
    window.open("https://prytane.com/registration", "_blank");
    setOpenDialogCity(false)
  };

  const handleLogIn = () => {
    setOpenDialogCity(false)
    window.open("https://prytane.com/login", "_blank");
  };

  const handlePathClicked = (e) => {
    e.preventDefault();
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
  }

  const handleBuildingClicked = (e) => {
    e.preventDefault();
    setShowBuilding(!showBuilding);
    handleCheckboxChange('building-extrusion', 'visibility', !showBuilding);
  }

  return (
    <main className="m-2">
      <div id="map" ref={mapContainer}></div>
      <div className={`map-overlay top w-[20vw]`}>
        {/* <button className="bg-[#2E2F31]/20  p-2 m-1 text-white rounded sm:block md:hidden" onClick={e => { e.preventDefault(); setOpen(!open) }}>
          <PanelTopOpen className="text-black" />
        </button> */}
        <div className={`map-overlay-inner block`}>
          <Dialog open={openDialogCity} onOpenChange={setOpenDialogCity}>
            <DialogContent className="w-[370px]">
              <DialogHeader>
                <DialogTitle className="mt-2 mb-2 font-bold text-2xl">This feature <br /> requires having an account</DialogTitle>
                <DialogDescription className="mt-2 mb-4 leading-loose ">Creating an account takes 1 minute and is free. <br />
                  You will then be able to view the map in 3D, <br /> resume reading where you left off, <br />
                  enrich the application thanks to the collaborative mode and more.</DialogDescription>
              </DialogHeader>
              <div className="flex gap-2">
                <Button variant="outlined" className="border border-black w-full text-lg" onClick={handleLogIn}>
                  Log In
                </Button>
                <Button className="bg-gradient-to-r from-[#fdb642] to-[#fd5003] w-full text-lg" onClick={handleRegisterClick}>
                  Register
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <fieldset>
            <Button variant="outlined m-0" className="text-white font-bold" >EN</Button>
          </fieldset>
          <fieldset>
            <Button variant="outlined m-0" className="text-white font-bold">
              <Volume1 />
            </Button>
          </fieldset>
          <fieldset>
            <Button variant="outlined" className="text-white font-bold" onClick={() => setOpenDialogCity(!openDialogCity)}>3D</Button>
          </fieldset>
          <fieldset>
            <Button variant="outlined m-0" className="text-white font-bold" onClick={() => setOpenDialogCity(!openDialogCity)}>
              <Plus />
            </Button>
          </fieldset>
        </div>
      </div>
    </main>
  );
}
