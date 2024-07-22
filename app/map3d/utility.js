import mapboxgl from 'mapbox-gl';

export const add3DObjectInMap = (map, object3D, mountainHeight) => {
  map.addLayer({
    id: 'custom-threebox-model',
    type: 'custom',
    renderingMode: '3d',
    onAdd: function () {
      const scale = 10;
      const heightMultiple = mountainHeight !== 100 ? 2 : 3;
      const options = {
        obj: object3D,
        type: 'gltf',
        scale: { x: scale, y: scale * heightMultiple, z: 15 },
        units: 'meters',
        rotation: { x: 90, y: -90, z: 0 }
      };

      tb.loadObj(options, (model) => {
        model.setCoords([35.2310, 31.7794]);
        model.setRotation({ x: 0, y: 0, z: 241 });
        tb.add(model);
      });
    },
    render: function () {
      tb.update();
    }
  });
}

export const calculateDistance = (coord1, coord2) => {
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;
    const R = 6371; // Radius of the Earth in kilometers

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
};

export const traceRouteRed = (map, routeData, startCoord, endCoord) => {
    // Trouver les segments de la route qui passent par les points spécifiés
    const filteredRoute = [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            startCoord
          ]
        }
      }
    ]
    
    for (let i = 0; i < routeData.features.length; i++) {
      const feature = routeData.features[i];
      if (feature.geometry.type === 'LineString') {
        for (let j = 0; j < feature.geometry.coordinates.length - 1; j++) {
          const segmentStart = feature.geometry.coordinates[j];
          const segmentEnd = feature.geometry.coordinates[j + 1];

          const distanceStartStart = areCoordsEqual(segmentStart, startCoord)
          const distanceEndStart = areCoordsEqual(segmentEnd, startCoord)
          if(distanceStartStart && distanceEndStart) {
            filteredRoute.push(feature)
            break
          } else {
            const distanceStartEnd = areCoordsEqual(segmentStart, endCoord)
            const distanceEndEnd = areCoordsEqual(segmentEnd, endCoord)
            if(distanceStartEnd && distanceEndEnd) {
              filteredRoute.push(feature)
              break
            }
          }
        }
      }
    }

    // Ajout de la source pour la route additionnelle
    map.addSource('additionalRoute', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: filteredRoute
      }
    });

    // Ajout de la couche pour la route additionnelle
    map.addLayer({
      id: 'additionalRoute',
      'type': 'line',
      'source': 'additionalRoute',
      'layout': {
        'line-join': 'round',
        'line-cap': 'round'
      },
      'paint': {
        'line-color': '#ff0000', // Rouge
        'line-width': 4
      }
    });
}

// Helper function to compare coordinates
export const areCoordsEqual = (coord1, coord2, threshold = 5) => {
    return calculateDistance(coord1, coord2) <= threshold;
};