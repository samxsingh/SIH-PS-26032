import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Navigation, ShieldCheck, AlertCircle, Compass, Search, CheckCircle } from 'lucide-react';
import { calculateHaversineDistance, getDirectionsUrl } from '../../services/googleMapsService';

export const GoogleMapWrapper = ({
  centres = [],
  mandis = [],
  selectedCentre,
  onSelectCentre,
  onSelectMandi,
  userLocation = { lat: 26.8467, lon: 80.9462 },
  locationMode = 'REGISTERED',
  height = 'h-96',
  interactiveSelect = false,
  onLocationSelected = null,
  initialCoordinates = null,
  showRoute = false
}) => {
  const { t } = useTranslation();
  const mapRef = useRef(null);
  const googleMapInstanceRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef({});
  const mandiMarkersRef = useRef({});
  const routePolylineRef = useRef(null);
  const selectionMarkerRef = useRef(null);

  const onSelectCentreRef = useRef(onSelectCentre);
  const onSelectMandiRef = useRef(onSelectMandi);
  useEffect(() => {
    onSelectCentreRef.current = onSelectCentre;
  }, [onSelectCentre]);
  useEffect(() => {
    onSelectMandiRef.current = onSelectMandi;
  }, [onSelectMandi]);

  const [mapEngine, setMapEngine] = useState('LOADING'); // 'GOOGLE' | 'LEAFLET' | 'LOADING'
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState(
    initialCoordinates || {
      lat: selectedCentre?.location?.coordinates?.[1] || userLocation.lat || 26.8467,
      lng: selectedCentre?.location?.coordinates?.[0] || userLocation.lon || 80.9462
    }
  );

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    let isMounted = true;

    const loadGoogleMaps = async () => {
      // If no API key is provided, gracefully fall back immediately to Leaflet
      if (!apiKey || apiKey === 'your_google_maps_api_key_here' || apiKey.trim() === '') {
        if (isMounted) setMapEngine('LEAFLET');
        return;
      }

      try {
        if (window.google && window.google.maps) {
          if (isMounted) setMapEngine('GOOGLE');
          return;
        }

        // Dynamically load Google Maps script
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
        console.warn('[Map Engine] Google Maps failed to load. Falling back to Leaflet gracefully:', err.message);
        if (isMounted) setMapEngine('LEAFLET');
      }
    };

    loadGoogleMaps();

    return () => {
      isMounted = false;
    };
  }, [apiKey]);

  // -------------------------------------------------------------
  // GOOGLE MAPS IMPLEMENTATION
  // -------------------------------------------------------------
  useEffect(() => {
    if (mapEngine !== 'GOOGLE' || !mapRef.current || !window.google) return;

    const centerLat = selectedCentre?.location?.coordinates?.[1] || selectedCoords.lat;
    const centerLng = selectedCentre?.location?.coordinates?.[0] || selectedCoords.lng;

    const gMap = new window.google.maps.Map(mapRef.current, {
      center: { lat: centerLat, lng: centerLng },
      zoom: 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        { featureType: 'poi', stylers: [{ visibility: 'simplified' }] }
      ]
    });

    googleMapInstanceRef.current = gMap;

    // Interactive location selection
    if (interactiveSelect) {
      const marker = new window.google.maps.Marker({
        position: { lat: centerLat, lng: centerLng },
        map: gMap,
        draggable: true,
        title: 'Selected Procurement Centre Location',
        icon: {
          path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: '#1B4D3E',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#22252A'
        }
      });

      selectionMarkerRef.current = marker;

      marker.addListener('dragend', () => {
        const pos = marker.getPosition();
        const coords = { lat: pos.lat(), lng: pos.lng() };
        setSelectedCoords(coords);
        if (onLocationSelected) onLocationSelected(coords);
      });

      gMap.addListener('click', (e) => {
        const pos = e.latLng;
        marker.setPosition(pos);
        const coords = { lat: pos.lat(), lng: pos.lng() };
        setSelectedCoords(coords);
        if (onLocationSelected) onLocationSelected(coords);
      });
    }

    // Farmer Location Marker
    if (!interactiveSelect) {
      new window.google.maps.Marker({
        position: { lat: userLocation.lat, lng: userLocation.lon },
        map: gMap,
        title: locationMode === 'GPS' ? t('farmer.map_your_gps') : t('farmer.map_your_registered'),
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: locationMode === 'GPS' ? '#2563EB' : '#1B4D3E',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#FFFFFF'
        }
      });

      // Plot centre markers
      centres.forEach((centre) => {
        const lat = centre.location?.coordinates?.[1] || 23.2040;
        const lng = centre.location?.coordinates?.[0] || 77.0850;
        const isSelected = selectedCentre && (selectedCentre._id === centre._id || selectedCentre.id === centre.id || selectedCentre.centreCode === centre.centreCode);
        const isVerified = centre.verificationStatus === 'VERIFIED';

        const marker = new window.google.maps.Marker({
          position: { lat, lng },
          map: gMap,
          title: centre.name,
          icon: {
            path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: isSelected ? 7 : 5,
            fillColor: isSelected ? '#D4A373' : isVerified ? '#1B4D3E' : '#D97706',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#22252A'
          }
        });

        const distance = centre.distanceKm != null 
          ? centre.distanceKm 
          : calculateHaversineDistance(userLocation?.lat, userLocation?.lon, lat, lng);
        const directionsUrl = getDirectionsUrl(lat, lng, userLocation?.lat, userLocation?.lon);

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="font-family: sans-serif; padding: 6px; max-width: 240px; color: #22252A;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                <span style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: ${isVerified ? '#16A34A' : '#D97706'};">
                  ${isVerified ? t('farmer.map_popup_verified') : t('farmer.map_popup_demo')}
                </span>
                ${distance != null ? `<span style="font-size: 10px; font-weight: bold; color: #4B5563;">~${distance} km</span>` : ''}
              </div>
              <h4 style="margin: 2px 0 2px 0; font-size: 13px; font-weight: 800; line-height: 1.2;">${centre.name}</h4>
              ${(centre.mandiName || centre.mandiId?.name) ? `<div style="font-size: 10px; font-weight: bold; color: #1B4D3E; margin-bottom: 3px;">🏛️ Mandi: ${centre.mandiName || centre.mandiId?.name}</div>` : ''}
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #4B5563;">${centre.address}</p>
              <div style="margin-bottom: 8px; font-size: 11px; font-weight: bold; color: #1B4D3E;">
                🌾 ${centre.availableSlotsToday || 12} ${t('farmer.available_slots_badge', 'slots available')}
              </div>
              <div style="display: flex; gap: 6px; align-items: center;">
                <a href="/farmer/book-slot?centreId=${centre.id || centre._id}" style="display: inline-block; background: #1B4D3E; color: white; padding: 4px 8px; font-size: 11px; font-weight: bold; text-decoration: none; border-radius: 3px;">
                  ${t('farmer.book_slot')}
                </a>
                <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 11px; font-weight: bold; color: #1B4D3E; text-decoration: underline;">
                  ${t('farmer.map_popup_directions')}
                </a>
              </div>
            </div>
          `
        });

        marker.addListener('click', () => {
          if (onSelectCentreRef.current) onSelectCentreRef.current(centre);
          infoWindow.open(gMap, marker);
        });

        markersRef.current[centre.id || centre._id] = marker;
      });

      // Plot Mandi markers
      mandis.forEach((mandi) => {
        const lat = mandi.location?.coordinates?.[1] || 26.8500;
        const lng = mandi.location?.coordinates?.[0] || 80.9500;

        const marker = new window.google.maps.Marker({
          position: { lat, lng },
          map: gMap,
          title: mandi.name,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#1E3A8A',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#22252A'
          }
        });

        marker.addListener('click', () => {
          if (onSelectMandiRef.current) onSelectMandiRef.current(mandi);
        });

        mandiMarkersRef.current[mandi._id || mandi.id || mandi.mandiCode] = marker;
      });
    }

    return () => {
      // Cleanup
      googleMapInstanceRef.current = null;
    };
  }, [mapEngine, centres, mandis, userLocation, locationMode, interactiveSelect]);

  // Smooth pan on selectedCentre change in Google Maps
  useEffect(() => {
    if (mapEngine === 'GOOGLE' && googleMapInstanceRef.current && selectedCentre?.location?.coordinates) {
      const lat = selectedCentre.location.coordinates[1];
      const lng = selectedCentre.location.coordinates[0];
      googleMapInstanceRef.current.panTo({ lat, lng });
    }
  }, [selectedCentre, mapEngine]);

  // -------------------------------------------------------------
  // LEAFLET FALLBACK IMPLEMENTATION
  // -------------------------------------------------------------
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

        const centerLat = selectedCentre?.location?.coordinates?.[1] || selectedCoords.lat;
        const centerLon = selectedCentre?.location?.coordinates?.[0] || selectedCoords.lng;

        const map = L.map(mapRef.current, { scrollWheelZoom: false, keyboard: false }).setView([centerLat, centerLon], 12);
        leafletMapRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        if (interactiveSelect) {
          const marker = L.marker([centerLat, centerLon], { draggable: true }).addTo(map);
          marker.on('dragend', (e) => {
            const latlng = e.target.getLatLng();
            const coords = { lat: latlng.lat, lng: latlng.lng };
            setSelectedCoords(coords);
            if (onLocationSelected) onLocationSelected(coords);
          });
          map.on('click', (e) => {
            marker.setLatLng(e.latlng);
            const coords = { lat: e.latlng.lat, lng: e.latlng.lng };
            setSelectedCoords(coords);
            if (onLocationSelected) onLocationSelected(coords);
          });
        } else {
          // Farmer & Centre markers
          const farmerBg = locationMode === 'GPS' ? '#2563EB' : '#1B4D3E';
          const farmerIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color: ${farmerBg}; color: white; width: 32px; height: 32px; border-radius: 4px; display: flex; align-items: center; justify-content: center; border: 2px solid #22252A; box-shadow: 2px 2px 0px #22252A; font-weight: bold; font-size: 14px;">${locationMode === 'GPS' ? '📍' : '🏠'}</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });

          L.marker([userLocation.lat, userLocation.lon], { icon: farmerIcon }).addTo(map);

          centres.forEach((centre) => {
            const lat = centre.location?.coordinates?.[1] || 23.2040;
            const lon = centre.location?.coordinates?.[0] || 77.0850;
            const isSelected = selectedCentre && (selectedCentre._id === centre._id || selectedCentre.id === centre.id || selectedCentre.centreCode === centre.centreCode);
            const isVerified = centre.verificationStatus === 'VERIFIED';
            const markerBg = isSelected ? '#D4A373' : isVerified ? '#1B4D3E' : '#D97706';

            const centreIcon = L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="background-color: ${markerBg}; color: white; width: ${isSelected ? '36px' : '30px'}; height: ${isSelected ? '36px' : '30px'}; border-radius: 4px; display: flex; align-items: center; justify-content: center; border: 2px solid #22252A; box-shadow: 2px 2px 0px #22252A; font-size: 13px; font-weight: bold;">🌾</div>`,
              iconSize: [30, 30],
              iconAnchor: [15, 15]
            });

            const marker = L.marker([lat, lon], { icon: centreIcon }).addTo(map);
            marker.on('click', () => {
              if (onSelectCentreRef.current) onSelectCentreRef.current(centre);
            });
            const distance = centre.distanceKm != null 
              ? centre.distanceKm 
              : calculateHaversineDistance(userLocation?.lat, userLocation?.lon, lat, lon);
            const directionsUrl = getDirectionsUrl(lat, lon, userLocation?.lat, userLocation?.lon);

            marker.bindPopup(`
              <div style="font-family: sans-serif; padding: 6px; max-width: 240px; color: #22252A;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                  <span style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: ${isVerified ? '#16A34A' : '#D97706'};">
                    ${isVerified ? t('farmer.map_popup_verified') : t('farmer.map_popup_demo')}
                  </span>
                  ${distance != null ? `<span style="font-size: 10px; font-weight: bold; color: #4B5563;">~${distance} km</span>` : ''}
                </div>
                <h4 style="margin: 2px 0 2px 0; font-size: 13px; font-weight: 800; line-height: 1.2;">${centre.name}</h4>
                ${(centre.mandiName || centre.mandiId?.name) ? `<div style="font-size: 10px; font-weight: bold; color: #1B4D3E; margin-bottom: 3px;">🏛️ Mandi: ${centre.mandiName || centre.mandiId?.name}</div>` : ''}
                <p style="margin: 0 0 6px 0; font-size: 11px; color: #4B5563;">${centre.address}</p>
                <div style="margin-bottom: 8px; font-size: 11px; font-weight: bold; color: #1B4D3E;">
                  🌾 ${centre.availableSlotsToday || 12} ${t('farmer.available_slots_badge', 'slots available')}
                </div>
                <div style="display: flex; gap: 6px; align-items: center;">
                  <a href="/farmer/book-slot?centreId=${centre.id || centre._id}" style="display: inline-block; background: #1B4D3E; color: white; padding: 4px 8px; font-size: 11px; font-weight: bold; text-decoration: none; border-radius: 3px;">
                    ${t('farmer.book_slot')}
                  </a>
                  <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 11px; font-weight: bold; color: #1B4D3E; text-decoration: underline;">
                    ${t('farmer.map_popup_directions')}
                  </a>
                </div>
              </div>
            `);
          });
          // Plot Mandi markers
          mandis.forEach((mandi) => {
            const lat = mandi.location?.coordinates?.[1] || 26.8500;
            const lon = mandi.location?.coordinates?.[0] || 80.9500;

            const mandiIcon = L.divIcon({
              className: 'custom-mandi-icon',
              html: `<div style="background-color: #1E3A8A; color: white; width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; border: 2px solid #22252A; box-shadow: 2px 2px 0px #22252A; font-size: 14px;" title="${mandi.name}">🏛️</div>`,
              iconSize: [32, 32],
              iconAnchor: [16, 16]
            });

            const marker = L.marker([lat, lon], { icon: mandiIcon }).addTo(map);
            marker.bindPopup(`
              <div style="font-family: sans-serif; padding: 6px; max-width: 220px; color: #22252A;">
                <span style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: #1E3A8A;">
                  🏛️ APMC Mandi
                </span>
                <h4 style="margin: 2px 0 4px 0; font-size: 13px; font-weight: 800; line-height: 1.2;">${mandi.name}</h4>
                <p style="margin: 0 0 4px 0; font-size: 11px; color: #4B5563;">${mandi.address || 'Lucknow, UP'}</p>
                <span style="font-mono; font-size: 10px; background: #EFF6FF; border: 1px solid #BFDBFE; padding: 2px 4px; border-radius: 2px; font-weight: bold; color: #1E3A8A;">
                  ${mandi.mandiCode || 'MND_LKO'}
                </span>
              </div>
            `);

            marker.on('click', () => {
              if (onSelectMandiRef.current) onSelectMandiRef.current(mandi);
            });
          });

          // Draw route polyline from userLocation to selectedCentre if showRoute is enabled
          if (showRoute && selectedCentre?.location?.coordinates) {
            const destLat = selectedCentre.location.coordinates[1];
            const destLon = selectedCentre.location.coordinates[0];
            const startLat = userLocation?.lat || 26.8467;
            const startLon = userLocation?.lon || 80.9462;

            const latlngs = [
              [startLat, startLon],
              [destLat, destLon]
            ];

            const polyline = L.polyline(latlngs, {
              color: '#1B4D3E',
              weight: 4,
              dashArray: '6, 8',
              opacity: 0.8
            }).addTo(map);

            routePolylineRef.current = polyline;
          }
        }
      } catch (err) {
        console.warn('[Leaflet Map Warning] Initialization handled gracefully:', err.message);
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
  }, [mapEngine, centres, mandis, userLocation, locationMode, interactiveSelect, showRoute]);

  // Smooth pan on selectedCentre change in Leaflet
  useEffect(() => {
    if (mapEngine === 'LEAFLET' && leafletMapRef.current && selectedCentre?.location?.coordinates) {
      const lat = selectedCentre.location.coordinates[1];
      const lon = selectedCentre.location.coordinates[0];
      leafletMapRef.current.panTo([lat, lon], { animate: true, duration: 0.5 });
    }
  }, [selectedCentre, mapEngine]);

  const handleSearchAddress = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      // Use Google Geocoder if available
      if (window.google && window.google.maps) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: searchQuery }, (results, status) => {
          setIsSearching(false);
          if (status === 'OK' && results[0]) {
            const pos = results[0].geometry.location;
            const coords = { lat: pos.lat(), lng: pos.lng() };
            setSelectedCoords(coords);
            if (googleMapInstanceRef.current) googleMapInstanceRef.current.panTo(coords);
            if (selectionMarkerRef.current) selectionMarkerRef.current.setPosition(coords);
            if (onLocationSelected) onLocationSelected(coords);
          } else {
            alert('Location not found. Please click directly on the map to place the marker.');
          }
        });
      } else {
        // Fallback open geocoding lookup
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setIsSearching(false);
        if (data && data.length > 0) {
          const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
          setSelectedCoords(coords);
          if (leafletMapRef.current) leafletMapRef.current.panTo([coords.lat, coords.lng]);
          if (onLocationSelected) onLocationSelected(coords);
        } else {
          alert('Location not found. Please click directly on the map to place the marker.');
        }
      }
    } catch (err) {
      setIsSearching(false);
      console.warn('Geocoding search failed gracefully:', err.message);
    }
  };

  return (
    <div className={`w-full ${height} rounded-xs overflow-hidden border-2 border-dark-neutral shadow-brutal relative bg-warm-ivory`}>
      {/* Map Search Bar if in interactiveSelect mode */}
      {interactiveSelect && (
        <div className="absolute top-3 left-3 right-3 z-30 max-w-md">
          <form onSubmit={handleSearchAddress} className="flex items-center gap-2 bg-white p-1.5 rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
            <Search className="w-4 h-4 text-dark-neutral-muted ml-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('farmer.map_search_placeholder')}
              className="w-full text-xs font-semibold focus:outline-none px-2"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="px-3 py-1 bg-forest-green text-white text-xs font-bold rounded-xs border border-dark-neutral hover:bg-forest-green-dark"
            >
              {isSearching ? t('farmer.map_searching_btn') : t('farmer.map_search_btn')}
            </button>
          </form>
        </div>
      )}

      {/* Map Canvas Container */}
      <div ref={mapRef} className="w-full h-full z-10" />

      {/* Map Engine Provenance Badge */}
      <div className="absolute top-3 right-3 z-20 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-xs border-2 border-dark-neutral text-[10px] font-bold shadow-[2px_2px_0px_#22252A] flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-forest-green"></span>
        <span>{mapEngine === 'GOOGLE' ? 'Google Maps JavaScript API' : 'OpenStreetMap (Leaflet Engine)'}</span>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 z-20 bg-white px-3 py-1.5 rounded-xs border-2 border-dark-neutral text-[11px] font-bold flex flex-wrap items-center gap-3 shadow-[2px_2px_0px_#22252A]">
        {interactiveSelect ? (
          <span className="flex items-center gap-1 text-forest-green">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{t('farmer.map_drag_instruction')}</span>
          </span>
        ) : (
          <>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-forest-green border border-dark-neutral inline-block"></span>
              <span>{t('farmer.map_legend_centre')}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="text-xs">🏛️</span>
              <span>{t('farmer.map_legend_mandi', 'APMC Mandi')}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className={`w-2.5 h-2.5 rounded-xs ${locationMode === 'GPS' ? 'bg-info-blue' : 'bg-forest-green'} border border-dark-neutral inline-block`}></span>
              <span>{locationMode === 'GPS' ? t('farmer.map_legend_gps') : t('farmer.map_legend_village')}</span>
            </span>
            <span className="flex items-center gap-1 text-[10px] text-dark-neutral-muted">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
              <span>{t('farmer.map_legend_verified')}</span>
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default GoogleMapWrapper;
