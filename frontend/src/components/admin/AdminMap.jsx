import React, { useEffect, useRef } from 'react';

export const AdminMap = ({ centres = [], selectedCentre, onSelectCentre, height = 'h-96' }) => {
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (!mapContainerRef.current) return;

      try {
        if (!window.L) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);

          await new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = resolve;
            document.head.appendChild(script);
          });
        }

        if (!isMounted || !window.L || !mapContainerRef.current) return;

        const L = window.L;

        if (leafletMapRef.current) {
          leafletMapRef.current.remove();
        }

        const centerLat = selectedCentre?.location?.coordinates?.[1] || 23.2000;
        const centerLon = selectedCentre?.location?.coordinates?.[0] || 77.0800;

        const map = L.map(mapContainerRef.current).setView([centerLat, centerLon], 10);
        leafletMapRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        // Plot Centres with Health Color Pins
        centres.forEach((centre) => {
          const lat = centre.location?.coordinates?.[1] || 23.2000;
          const lon = centre.location?.coordinates?.[0] || 77.0800;
          const isSelected = selectedCentre && (selectedCentre._id === centre._id || selectedCentre.id === centre.id);

          const healthColor = centre.health === 'CRITICAL' ? '#DC2626' : centre.health === 'WATCH' ? '#D97706' : '#16A34A';

          const centreIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color: ${healthColor}; color: white; width: ${isSelected ? '36px' : '30px'}; height: ${isSelected ? '36px' : '30px'}; border-radius: 4px; display: flex; align-items: center; justify-content: center; border: 2px solid #22252A; box-shadow: 2px 2px 0px #22252A; font-size: 13px; font-weight: bold;">🏢</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          });

          const marker = L.marker([lat, lon], { icon: centreIcon }).addTo(map);

          const popupContent = `
            <div style="font-family: sans-serif; padding: 4px; max-width: 200px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <strong style="color: #1B4D3E; font-size: 13px;">${centre.centreCode || 'SEH01'}</strong>
                <span style="background-color: ${healthColor}; color: white; padding: 2px 6px; border-radius: 2px; font-size: 10px; font-weight: bold; border: 1px solid #22252A;">${centre.health}</span>
              </div>
              <strong style="color: #22252A; font-size: 13px;">${centre.name}</strong><br/>
              <span style="font-size: 11px; color: #64748B;">${centre.address}</span><br/>
              <div style="margin-top: 6px; font-size: 11px; color: #22252A;">
                ⏱️ Wait: <b>~${centre.estimatedWaitMinutes || 30} min</b> • Load: <b>${centre.queueLoadPercentage || 45}%</b>
              </div>
            </div>
          `;

          marker.bindPopup(popupContent);

          marker.on('click', () => {
            if (onSelectCentre) onSelectCentre(centre);
          });
        });
      } catch (err) {
        console.warn('[Admin Map Warning] Map initialization fallback:', err.message);
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [centres, selectedCentre]);

  return (
    <div className={`w-full ${height} rounded-md overflow-hidden border-2 border-dark-neutral shadow-brutal relative bg-warm-ivory`}>
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Health Legend Badge */}
      <div className="absolute bottom-3 left-3 z-20 bg-white px-3 py-1.5 rounded-xs border-2 border-dark-neutral text-xs font-bold flex items-center gap-3 shadow-[2px_2px_0px_#22252A]">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 border border-dark-neutral inline-block"></span>
          <span>Healthy</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 border border-dark-neutral inline-block"></span>
          <span>Watch</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs bg-red-600 border border-dark-neutral inline-block"></span>
          <span>Critical</span>
        </span>
      </div>
    </div>
  );
};

export default AdminMap;
