import mapboxgl from 'mapbox-gl';
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
    
    console.log(filteredRoute)

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

    // Ajout de marqueurs pour les points de départ et d'arrivée de la route additionnelle
    new mapboxgl.Marker({ color: 'blue' })
      .setLngLat(startCoord)
      .setPopup(new mapboxgl.Popup().setText('Point de départ additionnel'))
      .addTo(map);

    new mapboxgl.Marker({ color: 'purple' })
      .setLngLat(endCoord)
      .setPopup(new mapboxgl.Popup().setText('Point d\'arrivée additionnel'))
      .addTo(map);
}

// Helper function to compare coordinates
export const areCoordsEqual = (coord1, coord2, threshold = 4) => {
    return calculateDistance(coord1, coord2) <= threshold;
};