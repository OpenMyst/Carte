"use client";
import { MAPBOX_TOKEN, automnStyle, sprintStyle, winterDark, summerLight } from "@/tool/security";
import React, { useState, useEffect, useRef } from "react";
import mapboxgl from 'mapbox-gl';
import { collection, onSnapshot, query } from "firebase/firestore";
import { database } from "@/tool/firebase";
import { addSnowLayer, addRainLayer, } from "@/lib/climat";
import { addRouteLayer } from "@/lib/layers";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { userPlayEvent } from "@/tool/service";
import { Menu } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Link from "next/link";
import { Button } from "@/components/ui/button";

mapboxgl.accessToken = MAPBOX_TOKEN;

export default function Map2DByUserId({ params }) {
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
  }, [map, mapStyle, evangileEvents, showMap3D]);

  useEffect(() => {
    if (map.current) {
      updateMapSettings();
      addRouteLayer(map.current, startTravel, endTravel);
    }
  }, [mountainHeight, showBuilding, showRoad]);

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
      loadEvangileMarker(map.current);
    }
  }, [season, mapStyle, evangileEvents]);

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
        mapEvent.setStyle(winterDark);
      } else if (day === "Matin") {
        mapEvent.setStyle(summerLight);
      } else {
        mapEvent.setStyle(winterDark);
      }

      const meteo = location.meteo;
      if (meteo === "Pluvieux") {
        addRainLayer(mapEvent);
      } else if (meteo === "Neigeux") {
        addSnowLayer(mapEvent);
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
    window.location.href = "https://prytane.com/registration"; // Redirige vers le lien voulu
  };

  return (
    <main className="m-2">
      <div id="map" ref={mapContainer}></div>
      <div className={`map-overlay top w-[20vw] mt-10`}>
        <button className="bg-[#2E2F31]/20  p-2 m-1 text-white rounded sm:block md:hidden" onClick={e => { e.preventDefault(); setOpen(!open) }}>
          <Menu className="text-black"/>
        </button>
        <div className={`map-overlay-inner ${open ? "block" : "hidden"}`}>
          <Dialog open={openDialogCity} onOpenChange={setOpenDialogCity}>
            <DialogContent>
              <h4 className="text-center text-lg">To access this feature, please register</h4>
              <Button onClick={handleRegisterClick}>
                Register
              </Button>
              <Button className="bg-red-500 hover:bg-red-400" onClick={() => setOpenDialogCity(false)}>
                Cancel
              </Button>
            </DialogContent>
          </Dialog>
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
              checked={openDialogCity}
              onCheckedChange={() => {
                setOpenDialogCity(!openDialogCity);
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
              checked={openDialogCity}
              onCheckedChange={() => {
                setOpenDialogCity(!openDialogCity);
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
