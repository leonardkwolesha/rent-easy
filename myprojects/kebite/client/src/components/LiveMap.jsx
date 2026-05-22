import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import socket from '../services/socket';

const DAR_ES_SALAAM = [-6.7924, 39.2083];

const riderIcon = L.divIcon({
  className: 'kebite-rider-marker',
  html: `<div style="
    width:36px;height:36px;border-radius:50%;
    background:linear-gradient(135deg,#ff6b00,#e63946);
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 4px 14px rgba(230,57,70,0.45);
    border:3px solid #fff;font-size:18px;
  ">🛵</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const restaurantIcon = L.divIcon({
  className: 'kebite-restaurant-marker',
  html: `<div style="
    width:32px;height:32px;border-radius:50%;
    background:#1a1a2e;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 3px 10px rgba(0,0,0,0.3);
    border:3px solid #fff;font-size:14px;
  ">🏪</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function Recenter({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, map.getZoom(), { duration: 0.8 });
  }, [position, map]);
  return null;
}

export default function LiveMap({ riderId, initialRiderPosition = null, restaurantPosition = null, height = 220 }) {
  const [riderPos, setRiderPos] = useState(initialRiderPosition);

  useEffect(() => {
    if (!riderId) return;
    if (!socket.connected) socket.connect();

    function handle(payload) {
      if (!payload) return;
      if (String(payload.riderId) !== String(riderId)) return;
      if (typeof payload.lat !== 'number' || typeof payload.lng !== 'number') return;
      setRiderPos([payload.lat, payload.lng]);
    }

    socket.on('rider:locationUpdate', handle);
    return () => { socket.off('rider:locationUpdate', handle); };
  }, [riderId]);

  const center = useMemo(() => riderPos || restaurantPosition || DAR_ES_SALAAM, [riderPos, restaurantPosition]);

  return (
    <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
      <MapContainer
        center={center}
        zoom={14}
        scrollWheelZoom={false}
        style={{ height, width: '100%' }}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />
        {restaurantPosition && (
          <Marker position={restaurantPosition} icon={restaurantIcon}>
            <Popup>Restaurant</Popup>
          </Marker>
        )}
        {riderPos && (
          <Marker position={riderPos} icon={riderIcon}>
            <Popup>Your rider is here</Popup>
          </Marker>
        )}
        <Recenter position={riderPos} />
      </MapContainer>

      {!riderPos && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          paddingBottom: '0.75rem',
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            color: '#555', fontSize: '0.78rem', fontWeight: 600,
            padding: '0.4rem 0.85rem', borderRadius: 999,
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
          }}>
            Waiting for rider's first location ping…
          </div>
        </div>
      )}
    </div>
  );
}
