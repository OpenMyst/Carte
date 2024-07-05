import React from 'react';
import MapGL, { Marker, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Votre clé API Mapbox
const MAPBOX_TOKEN = "pk.eyJ1IjoiYWRzLWVvIiwiYSI6ImNseDlhajRmbDI2N2gyaXFzaTV3ZnhuMnAifQ.f3UUqrMSf5guXYFR62TWdg";

const MapComponent = () => {
  const [viewport, setViewport] = React.useState({
    latitude: 37.7577, // Coordonnées initiales
    longitude: -122.4376,
    zoom: 8,
    pitch: 60
  });

  return (
    <MapGL
      {...viewport}
      mapStyle="mapbox://styles/ads-eo/clxacwshz021f01qsdrn2cza3"
      mapboxAccessToken={MAPBOX_TOKEN}
      style={{ width: 1500, height: 700}}
    >
      <Marker latitude={37.7577} longitude={-122.4376}>
        <div style={{ backgroundColor: 'red', height: '10px', width: '10px', borderRadius: '50%' }} />
      </Marker>

      <div>
        <NavigationControl />
      </div>
    </MapGL>
  );
};

export default MapComponent;
