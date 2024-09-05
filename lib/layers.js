/**
 * Adds a 3D object to the Mapbox map using Threebox.
 *
 * @param {object} map - The Mapbox map instance.
 * @param {string} object3D - The path to the 3D GLTF file to load.
 * @param {number} mountainHeight - The height of the mountain to adjust the object's scale.
 */
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
};

/**
 * Adds a route layer to the Mapbox map from a GeoJSON file.
 *
 * @param {object} map - The Mapbox map instance.
 * @param {Array<number>} startTravel - Start coordinates of the route.
 * @param {Array<number>} endTravel - End coordinates of the route.
 */
export const addRouteLayer = async (map, startTravel, endTravel) => {
  try {
    const response = await fetch('/assets/route_palestine.geojson');
    const routeData = await response.json();

    // Remove the existing route source and layer if they exist
    if (map.getSource('route')) {
      map.removeLayer('route');
      map.removeSource('route');
    }

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
        'line-color': '#ffffff',
        'line-width': [
          'interpolate', ['exponential', 1.5],
          ['zoom'],
          0, 1,  // Zoom level 0 -> line width 1
          22, 4  // Zoom level 22 -> line width 4
        ]
      }
    });

    // Moves the 'road' layer below the label layers
    const layers = map.getStyle().layers;
    const labelLayerId = layers.find(
      (layer) => layer.id.indexOf('label') !== -1
    )?.id;

    if (labelLayerId) {
      map.moveLayer('route', labelLayerId);
    }

    if (startTravel && endTravel) {
      // Trace the route in red for the specified segments
      traceRouteRed(map, routeData, startTravel, endTravel);
    }

  } catch (error) {
    console.error('Error loading route data:', error);
  }
};

/**
 * Calculates the distance between two geographical coordinates.
 *
 * @param {Array<number>} coord1 - The first coordinates [longitude, latitude].
 * @param {Array<number>} coord2 - The second coordinates [longitude, latitude].
 * @returns {number} - The distance in kilometers.
 */
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

/**
 * Traces a portion of the route on the map in red between the specified coordinates.
 *
 * @param {object} map - The Mapbox map instance.
 * @param {object} routeData - The route data in GeoJSON format.
 * @param {Array<number>} startCoord - The start coordinates [longitude, latitude].
 * @param {Array<number>} endCoord - The end coordinates [longitude, latitude].
 */
export const traceRouteRed = (map, routeData, startCoord, endCoord) => {
  // Find the route segments that pass through the specified points
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
  ];

  // Check if the source already exists
  if (map.getSource('additionalRoute')) {
    // If it exists, remove the source and the associated layer
    map.removeLayer('additionalRoute');
    map.removeSource('additionalRoute');
  }

  const threshold = calculateDistance(startCoord, endCoord);

  for (let i = 0; i < routeData.features.length; i++) {
    const feature = routeData.features[i];
    if (feature.geometry.type === 'LineString') {
      for (let j = 0; j < feature.geometry.coordinates.length - 1; j++) {
        const segmentStart = feature.geometry.coordinates[j];
        const segmentEnd = feature.geometry.coordinates[j + 1];

        const distanceStartStart = areCoordsClose(segmentStart, startCoord, threshold);
        const distanceEndStart = areCoordsClose(segmentEnd, startCoord, threshold);
        if (distanceStartStart && distanceEndStart) {
          filteredRoute.push(feature);
          break;
        } else {
          const distanceStartEnd = areCoordsClose(segmentStart, endCoord, threshold);
          const distanceEndEnd = areCoordsClose(segmentEnd, endCoord, threshold);
          if (distanceStartEnd && distanceEndEnd) {
            filteredRoute.push(feature);
            break;
          }
        }
      }
    }
  }

  // Add the source for the additional route
  map.addSource('additionalRoute', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: filteredRoute
    }
  });

  // Add the layer for the additional route
  map.addLayer({
    id: 'additionalRoute',
    'type': 'line',
    'source': 'additionalRoute',
    'layout': {
      'line-join': 'round',
      'line-cap': 'round'
    },
    'paint': {
      'line-color': '#ff0000', // Red
      'line-width': [
        'interpolate', ['exponential', 1.5],
        ['zoom'],
        0, 1,  // Zoom level 0 -> line width 1
        22, 4  // Zoom level 22 -> line width 4
      ]
    }
  });
};

/**
 * Compares two geographical coordinates with a specified tolerance.
 *
 * @param {Array<number>} coord1 - The first coordinates [longitude, latitude].
 * @param {Array<number>} coord2 - The second coordinates [longitude, latitude].
 * @param {number} [threshold=5] - The tolerance in kilometers to consider the coordinates equal.
 * @returns {boolean} - True if the coordinates are equal within the specified tolerance, otherwise false.
 */
export const areCoordsClose = (coord1, coord2, threshold = 5) => {
  return calculateDistance(coord1, coord2) <= threshold;
};
