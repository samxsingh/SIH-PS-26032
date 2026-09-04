import React from 'react';
import GoogleMapWrapper from '../common/GoogleMapWrapper';

/**
 * GoogleCentreMap
 * Reusable Google Maps & Leaflet interactive map component for AgriNexus Farmer Centre Discovery.
 * Visualizes approved procurement centres across Lucknow, UP, user/farmer starting point,
 * selected centre highlights, and bi-directional list synchronization.
 */
export const GoogleCentreMap = ({
  centres = [],
  selectedCentre = null,
  onSelectCentre = () => {},
  userLocation = { lat: 26.8467, lon: 80.9462 },
  locationMode = 'REGISTERED',
  height = 'h-96'
}) => {
  return (
    <div className="w-full relative rounded-md overflow-hidden border-2 border-dark-neutral shadow-brutal bg-white">
      <GoogleMapWrapper
        centres={centres}
        selectedCentre={selectedCentre}
        onSelectCentre={onSelectCentre}
        userLocation={userLocation}
        locationMode={locationMode}
        height={height}
        interactiveSelect={false}
      />
    </div>
  );
};

export default GoogleCentreMap;
