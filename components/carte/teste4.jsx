import React, { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import Threebox from 'threebox';

mapboxgl.accessToken = 'pk.eyJ1IjoiYWRzLWVvIiwiYSI6ImNseDlhajRmbDI2N2gyaXFzaTV3ZnhuMnAifQ.f3UUqrMSf5guXYFR62TWdg';

const Teste4 = () => {
    const [map, setMap] = useState(null);
    const [lightPreset, setLightPreset] = useState('day');
    const [showPlaceLabels, setShowPlaceLabels] = useState(true);
    const [showPOILabels, setShowPOILabels] = useState(true);
    const [showRoadLabels, setShowRoadLabels] = useState(true);
    const [showTransitLabels, setShowTransitLabels] = useState(true);
    const [showBuilding, setShowBuilding] = useState(true);
    const [showRoad, setShowRoad] = useState(true);

    useEffect(() => {
        const initializeMap = () => {
            const map = new mapboxgl.Map({
                container: 'map',
                style: 'mapbox://styles/ads-eo/clxa4lsrz020e01qs8g2796co', // Default style
                center: [35.21633, 31.76904],
                zoom: 15.1,
                pitch: 62,
                bearing: -20,
            });

            const tb = new Threebox.Threebox(
                map,
                map.getCanvas().getContext('webgl'),
                { defaultLights: true }
            );

            map.on('style.load', () => {
                map.addSource('line', {
                    type: 'geojson',
                    lineMetrics: true,
                    data: {
                        type: 'LineString',
                        coordinates: [
                            [35.21633, 31.76904],
                            [35.32, 31.98],
                        ],
                    },
                });

                map.addLayer({
                    id: 'line',
                    source: 'line',
                    type: 'line',
                    paint: {
                        'line-width': 12,
                        'line-emissive-strength': 0.8,
                        'line-gradient': [
                            'interpolate',
                            ['linear'],
                            ['line-progress'],
                            0,
                            'red',
                            1,
                            'blue',
                        ],
                    },
                });

            });

            setMap(map);
        };

        if (!map) initializeMap();
    }, [map]);

    useEffect(() => {
        if (map) {
            const styles = {
                dawn: 'mapbox://styles/ads-eo/clxedbibb001z01qmaxjz4xue',
                day: 'mapbox://styles/ads-eo/clxedbibb001z01qmaxjz4xue',
                dusk: 'mapbox://styles/mapbox/dark-v10',
                night: 'mapbox://styles/ads-eo/clxedbibb001z01qmaxjz4xue',
            };
            map.setStyle(styles[lightPreset]);
        }
    }, [lightPreset, map]);

    const handleCheckboxChange = (layerId, property, value) => {
        if (map) {
            map.setLayoutProperty(layerId, property, value ? 'visible' : 'none');
        }
    };

    return (
        <div>
            <div id="map" style={{ position: 'absolute', top: 0, bottom: 0, width: '100%' }}></div>
            <div className="map-overlay top">
                <div className="map-overlay-inner">
                    <fieldset className="select-fieldset">
                        <label>Select light preset</label>
                        <select value={lightPreset} onChange={(e) => setLightPreset(e.target.value)}>
                            <option value="dawn">Dawn</option>
                            <option value="day">Day</option>
                            <option value="dusk">Dusk</option>
                            <option value="night">Night</option>
                        </select>
                    </fieldset>
                    <fieldset>
                        <label>Show place labels</label>
                        <input
                            type="checkbox"
                            checked={showPlaceLabels}
                            onChange={(e) => {
                                setShowPlaceLabels(e.target.checked);
                                handleCheckboxChange('place-label', 'visibility', e.target.checked);
                            }}
                        />
                    </fieldset>
                    <fieldset>
                        <label>Show POI labels</label>
                        <input
                            type="checkbox"
                            checked={showPOILabels}
                            onChange={(e) => {
                                setShowPOILabels(e.target.checked);
                                handleCheckboxChange('poi-label', 'visibility', e.target.checked);
                            }}
                        />
                    </fieldset>
                    <fieldset>
                        <label>Show road labels</label>
                        <input
                            type="checkbox"
                            checked={showRoadLabels}
                            onChange={(e) => {
                                setShowRoadLabels(e.target.checked);
                                handleCheckboxChange('road-label', 'visibility', e.target.checked);
                            }}
                        />
                    </fieldset>
                    <fieldset>
                        <label>Show transit labels</label>
                        <input
                            type="checkbox"
                            checked={showTransitLabels}
                            onChange={(e) => {
                                setShowTransitLabels(e.target.checked);
                                handleCheckboxChange('transit-label', 'visibility', e.target.checked);
                            }}
                        />
                    </fieldset>
                    <fieldset>
                        <label>Show Building</label>
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
                            checked={showRoad}
                            onChange={(e) => {
                                setShowRoad(e.target.checked);
                                handleCheckboxChange('road-simple', 'visibility', e.target.checked);
                                handleCheckboxChange('bridge-simple', 'visibility', e.target.checked);
                                handleCheckboxChange('bridge-case-simple', 'visibility', e.target.checked);
                                handleCheckboxChange('tunnel-simple', 'visibility', e.target.checked);
                            }}
                        />
                    </fieldset>
                </div>
            </div>
        </div>
    );
};

export default Teste4;
