import { memo, useMemo, useState } from 'react';
import { useTheme } from './ThemeProvider.jsx';
import { condicionSonda } from '../utils/filtrarSondas.js';
import { GoogleMap, InfoWindow, Marker, useJsApiLoader } from '@react-google-maps/api';

// Centro aproximado del Valle del Yaqui, Sonora.
const CENTER = { lat: 27.32, lng: -109.95 };
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const COLORES = { inactive: '#81939b', missing: '#81939b', alert: '#B5502E', normal: '#2E6E7E' };
const ESTADOS = { alert: 'Alerta — umbral superado', missing: 'Sin datos', normal: 'Normal' };

function MapView({ sondas, onSelect }) {
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

export default memo(MapView);

function LoadedMap({ sondas, onSelect }) {
  const { theme } = useTheme();
  const { isLoaded, loadError } = useJsApiLoader({ googleMapsApiKey: API_KEY });
  const [hoverId, setHover] = useState(null);
  const hover = sondas.find(s => s.idSonda === hoverId);

  const mapOptions = useMemo(() => ({
    mapTypeId: 'roadmap', streetViewControl: false, fullscreenControl: false,
    styles: theme === 'dark' ? [
      { elementType: 'geometry', stylers: [{ color: '#26343f' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#c0ced2' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#25333d' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#345e72' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#42525c' }] },
      { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    ] : [],
  }), [theme]);

  if (loadError) return <div className="map-placeholder">No se pudo cargar Google Maps.</div>;
  if (!isLoaded) return <div className="map-placeholder">Cargando mapa…</div>;

  const icon = (sonda) => ({
    path: window.google.maps.SymbolPath.CIRCLE,
    scale: 9,
    fillColor: COLORES[condicionSonda(sonda)],
    fillOpacity: 1,
    strokeColor: '#FFFFFF',
    strokeWeight: 2,
  });

  return (
    <GoogleMap
      mapContainerClassName="gmap"
      center={CENTER}
      zoom={10}
      options={mapOptions}
    >
      {sondas.map((s) => (
        <Marker
          key={s.idSonda}
          position={{ lat: s.latitud, lng: s.longitud }}
          icon={icon(s)}
          title={s.idSonda}
          onMouseOver={() => setHover(s.idSonda)}
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
            <div>Estado: {ESTADOS[condicionSonda(hover)] ?? hover.estado}</div>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}
