import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

export const AdminMap = ({ centres = [], selectedCentre, onSelectCentre, height = 'h-96' }) => {
  const { t } = useTranslation();
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef({});

  const [mapEngine, setMapEngine] = useState('LOADING'); // 'GOOGLE' | 'LEAFLET' | 'LOADING'
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const getHealthColor = (health) => {
    switch (health) {
      case 'CRITICAL': return '#DC2626';
      case 'WATCH': return '#D97706';
      case 'NORMAL':
      case 'HEALTHY':
      default: return '#16A34A';
    }
  };

  // 1. Detect engine and dynamically load Google Maps if key is valid
  useEffect(() => {
    let isMounted = true;

    const loadEngine = async () => {
      if (!apiKey || apiKey === 'your_google_maps_api_key_here' || apiKey.trim() === '') {
        if (isMounted) setMapEngine('LEAFLET');
        return;
      }

      try {
        if (window.google && window.google.maps) {
          if (isMounted) setMapEngine('GOOGLE');
          return;
        }

        await new Promise((resolve, reject) => {
          const existingScript = document.getElementById('google-maps-script');
          if (existingScript) {
            existingScript.onload = resolve;
            existingScript.onerror = reject;
            return;
          }
          const script = document.createElement('script');
          script.id = 'google-maps-script';
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
          script.async = true;
          script.defer = true;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });

        if (isMounted) setMapEngine('GOOGLE');
      } catch (err) {
        console.warn('[Admin Map] Google Maps load failed, falling back to Leaflet:', err.message);
        if (isMounted) setMapEngine('LEAFLET');
      }
    };

    loadEngine();

    return () => {
      isMounted = false;
    };
  }, [apiKey]);

  // 2. Google Maps Implementation
  useEffect(() => {
    if (mapEngine !== 'GOOGLE' || !mapRef.current || !window.google) return;

    const centerLat = selectedCentre?.location?.coordinates?.[1] || 23.2000;
    const centerLng = selectedCentre?.location?.coordinates?.[0] || 77.0800;

    const gMap = new window.google.maps.Map(mapRef.current, {
      center: { lat: centerLat, lng: centerLng },
      zoom: 10,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
    });
    googleMapRef.current = gMap;

    centres.forEach((centre) => {
      const lat = centre.location?.coordinates?.[1] || 23.2000;
      const lng = centre.location?.coordinates?.[0] || 77.0800;
      const healthColor = getHealthColor(centre.health);
      const isSelected = selectedCentre && (selectedCentre._id === centre._id || selectedCentre.id === centre.id);

      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: gMap,
        title: `${centre.name} (${centre.centreCode || 'SEH01'})`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: isSelected ? 9 : 7,
          fillColor: healthColor,
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#22252A',
        },
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="font-family: sans-serif; padding: 6px; max-width: 220px; color: #22252A;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <strong style="color: #1B4D3E; font-size: 13px;">${centre.centreCode || 'SEH01'}</strong>
              <span style="background-color: ${healthColor}; color: white; padding: 2px 6px; border-radius: 2px; font-size: 10px; font-weight: bold; border: 1px solid #22252A;">${centre.health || 'NORMAL'}</span>
            </div>
            <strong style="color: #22252A; font-size: 13px;">${centre.name}</strong><br/>
            <span style="font-size: 11px; color: #64748B;">${centre.address}</span><br/>
            <div style="margin-top: 6px; font-size: 11px; color: #22252A;">
              ⏱️ Wait: <b>~${centre.estimatedWaitMinutes || 30} min</b> • Load: <b>${centre.queueLoadPercentage || 45}%</b>
            </div>
          </div>
        `,
      });

      marker.addListener('click', () => {
        if (onSelectCentre) onSelectCentre(centre);
        infoWindow.open(gMap, marker);
      });

      markersRef.current[centre.id || centre._id] = marker;
    });

    return () => {
      googleMapRef.current = null;
    };
  }, [mapEngine, centres]);

  // Smooth pan on selectedCentre change in Google Maps
  useEffect(() => {
    if (mapEngine === 'GOOGLE' && googleMapRef.current && selectedCentre?.location?.coordinates) {
      const lat = selectedCentre.location.coordinates[1];
      const lng = selectedCentre.location.coordinates[0];
      googleMapRef.current.panTo({ lat, lng });
    }
  }, [selectedCentre, mapEngine]);

  // 3. Leaflet Fallback Implementation
  useEffect(() => {
    if (mapEngine !== 'LEAFLET' || !mapRef.current) return;
    let isMounted = true;

    const initLeaflet = async () => {
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

        if (!isMounted || !window.L || !mapRef.current) return;
        const L = window.L;

        if (leafletMapRef.current) {
          leafletMapRef.current.remove();
        }

        const centerLat = selectedCentre?.location?.coordinates?.[1] || 23.2000;
        const centerLon = selectedCentre?.location?.coordinates?.[0] || 77.0800;

        const map = L.map(mapRef.current).setView([centerLat, centerLon], 10);
        leafletMapRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        centres.forEach((centre) => {
          const lat = centre.location?.coordinates?.[1] || 23.2000;
          const lon = centre.location?.coordinates?.[0] || 77.0800;
          const isSelected = selectedCentre && (selectedCentre._id === centre._id || selectedCentre.id === centre.id);
          const healthColor = getHealthColor(centre.health);

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
                <span style="background-color: ${healthColor}; color: white; padding: 2px 6px; border-radius: 2px; font-size: 10px; font-weight: bold; border: 1px solid #22252A;">${centre.health || 'NORMAL'}</span>
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
        console.warn('[Admin Map] Leaflet init fallback:', err.message);
      }
    };

    initLeaflet();

    return () => {
      isMounted = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [mapEngine, centres]);

  // Smooth pan on selectedCentre change in Leaflet
  useEffect(() => {
    if (mapEngine === 'LEAFLET' && leafletMapRef.current && selectedCentre?.location?.coordinates) {
      const lat = selectedCentre.location.coordinates[1];
      const lon = selectedCentre.location.coordinates[0];
      leafletMapRef.current.panTo([lat, lon], { animate: true, duration: 0.5 });
    }
  }, [selectedCentre, mapEngine]);

  return (
    <div className={`w-full ${height} rounded-md overflow-hidden border-2 border-dark-neutral shadow-brutal relative bg-warm-ivory`}>
      <div ref={mapRef} className="w-full h-full z-10" />

      {/* Engine Provenance Badge */}
      <div className="absolute top-3 right-3 z-20 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-xs border-2 border-dark-neutral text-[10px] font-bold shadow-[2px_2px_0px_#22252A] flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-forest-green"></span>
        <span>{mapEngine === 'GOOGLE' ? 'Google Maps GIS' : 'OpenStreetMap (Leaflet)'}</span>
      </div>

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
