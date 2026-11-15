import { useState } from 'react';
import { GoogleMap, InfoWindow, Marker, useJsApiLoader } from '@react-google-maps/api';

// Centro aproximado del Valle del Yaqui, Sonora.
const CENTER = { lat: 27.32, lng: -109.95 };
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export default function MapView({ sondas, onSelect }) {
  return (
    <div className="map-wrap">
      {API_KEY ? (
        <LoadedMap sondas={sondas} onSelect={onSelect} />
      ) : (
        <div className="map-placeholder">
          Falta la API Key de Google Maps.<br />
          Copia <code>frontend/.env.example</code> a <code>.env.local</code> y completa{' '}
          <code>VITE_GOOGLE_MAPS_API_KEY</code>.
        </div>
      )}
      <div className="map-caption">Google Maps — Valle del Yaqui, Sonora</div>
    </div>
  );
}

function LoadedMap({ sondas, onSelect }) {
  const { isLoaded, loadError } = useJsApiLoader({ googleMapsApiKey: API_KEY });
  const [hover, setHover] = useState(null);

  if (loadError) return <div className="map-placeholder">No se pudo cargar Google Maps.</div>;
  if (!isLoaded) return <div className="map-placeholder">Cargando mapa…</div>;

  const icon = (enAlerta) => ({
    path: window.google.maps.SymbolPath.CIRCLE,
    scale: 9,
    fillColor: enAlerta ? '#B5502E' : '#2E6E7E',
    fillOpacity: 1,
    strokeColor: '#FFFFFF',
    strokeWeight: 2,
  });

  return (
    <GoogleMap
      mapContainerClassName="gmap"
      center={CENTER}
      zoom={10}
      options={{ mapTypeId: 'terrain', streetViewControl: false, fullscreenControl: false }}
    >
      {sondas.map((s) => (
        <Marker
          key={s.idSonda}
          position={{ lat: s.latitud, lng: s.longitud }}
          icon={icon(s.enAlerta)}
          onMouseOver={() => setHover(s)}
          onMouseOut={() => setHover(null)}
          onClick={() => onSelect(s)}
        />
      ))}

      {hover && (
        <InfoWindow position={{ lat: hover.latitud, lng: hover.longitud }} options={{ pixelOffset: new window.google.maps.Size(0, -12) }}>
          <div className="info-window">
            <strong>{hover.idSonda}</strong>
            <div>Cuadrante: {hover.cuadrante}</div>
            <div>Profundidad: {hover.profundidadActual ?? '—'} m</div>
            <div>Estado: {hover.enAlerta ? 'Alerta — nivel crítico' : 'Normal'}</div>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}
