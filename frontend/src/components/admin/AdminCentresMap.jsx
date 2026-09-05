import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, ShieldCheck, AlertTriangle, ExternalLink } from 'lucide-react';

export const AdminCentresMap = ({
  applications = [],
  onOpenApplication,
  height = 'h-[540px]'
}) => {
  const { t } = useTranslation();
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef([]);

  const [mapEngine, setMapEngine] = useState('LOADING'); // 'GOOGLE' | 'LEAFLET' | 'LOADING'
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return '#166534';
      case 'REJECTED': return '#DC2626';
      case 'SUSPENDED':
      case 'NEEDS_CORRECTION':
      case 'NEEDS_MORE_INFORMATION': return '#4B5563';
      case 'PENDING_REVIEW':
      case 'UNDER_REVIEW':
      default: return '#D97706';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'APPROVED': return 'APPROVED';
      case 'REJECTED': return 'REJECTED';
      case 'SUSPENDED': return 'SUSPENDED';
      case 'NEEDS_CORRECTION': return 'NEEDS CORRECTION';
      case 'UNDER_REVIEW': return 'UNDER REVIEW';
      case 'PENDING_REVIEW':
      default: return 'PENDING';
    }
  };

  // Expose open application handler globally for HTML InfoWindows / Leaflet popups
  useEffect(() => {
    window._agrinexus_admin_open_app = (appId) => {
      if (onOpenApplication) onOpenApplication(appId);
    };
    return () => {
      delete window._agrinexus_admin_open_app;
    };
  }, [onOpenApplication]);

  // 1. Detect engine and dynamically load Google Maps if key is present
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
        console.warn('[AdminCentresMap] Google Maps load failed, falling back to Leaflet:', err.message);
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

    const gMap = new window.google.maps.Map(mapRef.current, {
      center: { lat: 26.8467, lng: 80.9462 },
      zoom: 11,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
    });
    googleMapRef.current = gMap;

    applications.forEach((app, idx) => {
      const defaultLat = 26.8467 + ((idx % 4) - 1.5) * 0.045;
      const defaultLng = 80.9462 + (Math.floor(idx / 4) - 0.5) * 0.055;
      const lat = app.location?.latitude || app.centreDetails?.latitude || defaultLat;
      const lng = app.location?.longitude || app.centreDetails?.longitude || defaultLng;

      const statusColor = getStatusColor(app.status);
      const statusLabel = getStatusLabel(app.status);
      const centreName = app.centreName || (app.centreDetails && app.centreDetails.name) || 'Krishi Seva Procurement Centre';
      const centreId = app.centreId || app.applicationId || 'LKO-GOM-001';
      const district = app.district || app.centreDetails?.district || 'Lucknow';
      const state = app.state || app.centreDetails?.state || 'Uttar Pradesh';
      const appDate = app.createdAt ? new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '15 Aug 2026';

      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: gMap,
        title: `${centreName} (${statusLabel})`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: statusColor,
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#FFFFFF',
        }
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="font-family: sans-serif; padding: 6px; min-width: 230px; color: #22252A;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <span style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: ${statusColor}; background: #F3F4F6; padding: 2px 6px; border-radius: 2px; border: 1px solid #D1D5DB;">
                ● ${statusLabel}
              </span>
              <span style="font-size: 10px; font-weight: 700; color: #4B5563; font-family: monospace;">
                ${centreId}
              </span>
            </div>
            <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 800; line-height: 1.25;">${centreName}</h4>
            <p style="margin: 0 0 4px 0; font-size: 11px; color: #4B5563;">
              📍 ${district}, ${state}
            </p>
            <p style="margin: 0 0 8px 0; font-size: 10px; color: #6B7280;">
              Submitted: ${appDate}
            </p>
            <button
              type="button"
              onclick="window._agrinexus_admin_open_app('${app.applicationId || app.id || app._id}')"
              style="
                display: block;
                width: 100%;
                background: #1B4D3E;
                color: #FFFFFF;
                border: 2px solid #22252A;
                padding: 6px 10px;
                font-size: 11px;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                border-radius: 2px;
                box-shadow: 2px 2px 0px #22252A;
                cursor: pointer;
              "
            >
              ${t('admin.btn_open_app_review', 'Open Application Review')}
            </button>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(gMap, marker);
      });
    });

    return () => {
      googleMapRef.current = null;
    };
  }, [mapEngine, applications]);

  // 3. Leaflet Fallback Implementation
  useEffect(() => {
    if (mapEngine !== 'LEAFLET' || !mapRef.current) return;
    let isMounted = true;

    const initMap = async () => {
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

        // Center on Lucknow, Uttar Pradesh
        const map = L.map(mapRef.current, { scrollWheelZoom: false }).setView([26.8467, 80.9462], 11);
        leafletMapRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        // Plot Applications
        applications.forEach((app, idx) => {
          const defaultLat = 26.8467 + ((idx % 4) - 1.5) * 0.045;
          const defaultLng = 80.9462 + (Math.floor(idx / 4) - 0.5) * 0.055;

          const lat = app.location?.latitude || app.centreDetails?.latitude || defaultLat;
          const lng = app.location?.longitude || app.centreDetails?.longitude || defaultLng;

          const statusColor = getStatusColor(app.status);
          const statusLabel = getStatusLabel(app.status);
          const centreName = app.centreName || (app.centreDetails && app.centreDetails.name) || 'Krishi Seva Procurement Centre';
          const centreId = app.centreId || app.applicationId || 'LKO-GOM-001';
          const district = app.district || app.centreDetails?.district || 'Lucknow';
          const state = app.state || app.centreDetails?.state || 'Uttar Pradesh';
          const appDate = app.createdAt ? new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '15 Aug 2026';

          const customIcon = L.divIcon({
            className: 'custom-admin-marker',
            html: `
              <div style="
                background-color: ${statusColor};
                width: 22px;
                height: 22px;
                border-radius: 50%;
                border: 3px solid #FFFFFF;
                box-shadow: 2px 2px 0px #22252A;
                cursor: pointer;
              "></div>
            `,
            iconSize: [22, 22],
            iconAnchor: [11, 11]
          });

          const popupContent = `
            <div style="font-family: sans-serif; padding: 6px; min-width: 240px; color: #22252A;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <span style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: ${statusColor}; background: #F3F4F6; padding: 2px 6px; border-radius: 2px; border: 1px solid #D1D5DB;">
                  ● ${statusLabel}
                </span>
                <span style="font-size: 10px; font-weight: 700; color: #4B5563; font-family: monospace;">
                  ${centreId}
                </span>
              </div>
              <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 800; line-height: 1.25;">${centreName}</h4>
              <p style="margin: 0 0 4px 0; font-size: 11px; color: #4B5563;">
                📍 ${district}, ${state}
              </p>
              <p style="margin: 0 0 8px 0; font-size: 10px; color: #6B7280;">
                Submitted: ${appDate}
              </p>
              <button
                type="button"
                onclick="window._agrinexus_admin_open_app('${app.applicationId || app.id || app._id}')"
                style="
                  display: block;
                  width: 100%;
                  background: #1B4D3E;
                  color: #FFFFFF;
                  border: 2px solid #22252A;
                  padding: 6px 10px;
                  font-size: 11px;
                  font-weight: 900;
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
                  border-radius: 2px;
                  box-shadow: 2px 2px 0px #22252A;
                  cursor: pointer;
                "
              >
                ${t('admin.btn_open_app_review', 'Open Application Review')}
              </button>
            </div>
          `;

          const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
          marker.bindPopup(popupContent);
          markersRef.current.push(marker);
        });
      } catch (err) {
        console.warn('Admin map init error:', err);
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
  }, [mapEngine, applications]);

  return (
    <div className="w-full relative rounded-md overflow-hidden border-2 border-dark-neutral shadow-brutal bg-white">
      <div ref={mapRef} className={`w-full ${height} z-0`} />

      {/* Engine Provenance Badge */}
      <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-xs border-2 border-dark-neutral text-[10px] font-bold shadow-[2px_2px_0px_#22252A] flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-forest-green"></span>
        <span>{mapEngine === 'GOOGLE' ? 'Google Maps GIS' : 'OpenStreetMap (Leaflet)'}</span>
      </div>

      {/* Interactive Legend Box */}
      <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-xs p-3 rounded-xs border-2 border-dark-neutral shadow-brutal-sm text-xs space-y-1.5 pointer-events-auto">
        <span className="text-[10px] font-black uppercase tracking-wider text-dark-neutral-muted block mb-1">
          {t('admin.legend_title', 'Centre Status')}
        </span>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#D97706] border border-dark-neutral"></span>
          <span className="font-bold text-dark-neutral">{t('admin.legend_pending', 'Pending / Under Review')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#166534] border border-dark-neutral"></span>
          <span className="font-bold text-dark-neutral">{t('admin.legend_approved', 'Approved / Active')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#DC2626] border border-dark-neutral"></span>
          <span className="font-bold text-dark-neutral">{t('admin.legend_rejected', 'Rejected')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#4B5563] border border-dark-neutral"></span>
          <span className="font-bold text-dark-neutral">{t('admin.legend_suspended', 'Suspended / Correction')}</span>
        </div>
      </div>
    </div>
  );
};

export default AdminCentresMap;
