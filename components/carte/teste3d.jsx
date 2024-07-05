import React, { useEffect, useRef, useState } from 'react';
import Map from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Threebox from 'threebox';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWRzLWVvIiwiYSI6ImNseDlhajRmbDI2N2gyaXFzaTV3ZnhuMnAifQ.f3UUqrMSf5guXYFR62TWdg';

const Mapin3d= () => {
  const [viewport, setViewport] = useState({
    latitude: 40.75155,
    longitude: -73.97627,
    zoom: 14,
    pitch: 64.9,
    bearing: 172.5,
    padding: { top: 12, bottom: 4, left: 1, right: 1}
  });

  const mapRef = useRef(null);

  useEffect(() => {
    const map = mapRef.current ;
    if (map) {
      const tb = new Threebox(
        map,
        map.getCanvas().getContext('webgl'),
        { defaultLights: true }
      );
      map.on('style.load', () => {

        map.addLayer({
          id: 'custom-threebox-model',
          type: 'custom',
          renderingMode: '3d',
          onAdd: function () {
            // Creative Commons License attribution:  Metlife Building model by https://sketchfab.com/NanoRay
            // https://sketchfab.com/3d-models/metlife-building-32d3a4a1810a4d64abb9547bb661f7f3
            const scale = 3.2;
            const options = {
              obj: 'https://docs.mapbox.com/mapbox-gl-js/assets/metlife-building.gltf',
              type: 'gltf',
              scale: { x: scale, y: scale, z: 2.7 },
              units: 'meters',
              rotation: { x: 90, y: -90, z: 0 }
            };

            tb.loadObj(options, (model) => {
              model.setCoords([-73.976799, 40.754145]);
              model.setRotation({ x: 0, y: 0, z: 241 });
              tb.add(model);
            });
          },

          render: function () {
            tb.update();
          }
        });
      });
    }
  }, []);

  return (
    <Map
      ref={(ref) => {
        mapRef.current = ref;
      }}
      initialViewState={viewport}
      mapStyle="mapbox://styles/ads-eo/clxj09y7300b801pcb2wtdjfw"
      mapboxAccessToken={MAPBOX_TOKEN}
      style={{ width: '100%', height: '100vh' }}
    />
  );
};

export default Mapin3d;
