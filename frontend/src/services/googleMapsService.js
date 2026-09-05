/**
 * AgriNexus - Google Maps Platform Service Layer
 * 
 * Provides robust helper methods for Google Maps JS API, geocoding,
 * directions URL generation, and mathematical Haversine distance calculations.
 * Always handles missing keys, offline states, and rate limits gracefully.
 */

/**
 * Calculates the great-circle distance between two geographic points using Haversine formula.
 * @param {number} lat1 Latitude of origin
 * @param {number} lon1 Longitude of origin
 * @param {number} lat2 Latitude of destination
 * @param {number} lon2 Longitude of destination
 * @returns {number} Distance in kilometres (rounded to 1 decimal place)
 */
export const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // Earth's radius in km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  return Math.round(d * 10) / 10;
};

/**
 * Generates an official Google Maps turn-by-turn navigation URL.
 * Works seamlessly on web and mobile devices (opens native Google Maps app on phones).
 * @param {number} destLat Destination latitude
 * @param {number} destLng Destination longitude
 * @param {number} [originLat] Optional origin latitude
 * @param {number} [originLng] Optional origin longitude
 * @returns {string} Fully qualified directions URL
 */
export const getDirectionsUrl = (destLat, destLng, originLat = null, originLng = null) => {
  const base = 'https://www.google.com/maps/dir/?api=1';
  const destination = `destination=${encodeURIComponent(`${destLat},${destLng}`)}`;
  if (originLat != null && originLng != null) {
    return `${base}&${destination}&origin=${encodeURIComponent(`${originLat},${originLng}`)}`;
  }
  return `${base}&${destination}`;
};

/**
 * Check if the Google Maps JavaScript API is initialized and ready in the browser.
 * @returns {boolean}
 */
export const isGoogleMapsLoaded = () => {
  return typeof window !== 'undefined' && !!(window.google && window.google.maps);
};

/**
 * Dynamically loads the Google Maps JavaScript API script tag if not already injected.
 * @param {string} apiKey Google Maps API Key
 * @returns {Promise<void>}
 */
export const loadGoogleMapsScript = (apiKey) => {
  return new Promise((resolve, reject) => {
    if (isGoogleMapsLoaded()) {
      return resolve();
    }

    if (!apiKey || apiKey === 'your_google_maps_api_key_here' || apiKey.trim() === '') {
      return reject(new Error('Google Maps API Key is not configured.'));
    }

    const scriptId = 'google-maps-api-script';
    const existing = document.getElementById(scriptId);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', (err) => reject(err));
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(new Error(`Failed to load Google Maps script: ${err}`));
    document.head.appendChild(script);
  });
};

/**
 * Geocodes an address string to geographic coordinates.
 * Tries Google Maps Geocoder if loaded; falls back to OpenStreetMap Nominatim gracefully.
 * @param {string} address Address string (village, mandi, district)
 * @returns {Promise<{ lat: number, lng: number, displayName: string } | null>}
 */
export const geocodeAddress = async (address) => {
  if (!address || !address.trim()) return null;

  // 1. If Google Maps is available, use Google Geocoder
  if (isGoogleMapsLoaded()) {
    try {
      const geocoder = new window.google.maps.Geocoder();
      const response = await new Promise((resolve, reject) => {
        geocoder.geocode({ address }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            resolve(results[0]);
          } else {
            reject(new Error(`Google Geocode status: ${status}`));
          }
        });
      });

      const loc = response.geometry.location;
      return {
        lat: loc.lat(),
        lng: loc.lng(),
        displayName: response.formatted_address || address
      };
    } catch (err) {
      console.warn('[Google Geocoder] Falling back to open geocoding:', err.message);
    }
  }

  // 2. Resilient OpenStreetMap Nominatim fallback
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=in&limit=1`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name
      };
    }
  } catch (err) {
    console.warn('[OpenStreetMap Geocoder] Search failed:', err.message);
  }

  return null;
};

export default {
  calculateHaversineDistance,
  getDirectionsUrl,
  isGoogleMapsLoaded,
  loadGoogleMapsScript,
  geocodeAddress
};
