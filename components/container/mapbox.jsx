import React from 'react'
import { Map } from 'react-map-gl'

const MapBoxContainer = () => {
  return (
    <div className='w-full h-full'>
        <Map 
            mapboxAccessToken="pk.eyJ1IjoiYWRzLWVvIiwiYSI6ImNseDlhajRmbDI2N2gyaXFzaTV3ZnhuMnAifQ.f3UUqrMSf5guXYFR62TWdg"
            initialViewState={{
                longitude: 35.21633,
                latitude: 31.76904,
                zoom: 14,
                pitch: 60
            }}
            style={{ height: '100vh', width: '100vw'}}
            mapStyle="mapbox://styles/ads-eo/clxa4lsrz020e01qs8g2796co"
        />
    </div>
  )
}

export default MapBoxContainer