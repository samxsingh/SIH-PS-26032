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
  mandis = [],
  selectedCentre = null,
  onSelectCentre = () => {},
  onSelectMandi = () => {},
  userLocation = { lat: 26.8467, lon: 80.9462 },
  locationMode = 'REGISTERED',
  height = 'h-96',
  showRoute = false
}) => {
  return (
    <div className="w-full relative rounded-md overflow-hidden border-2 border-dark-neutral shadow-brutal bg-white">
      <GoogleMapWrapper
        centres={centres}
        mandis={mandis}
        selectedCentre={selectedCentre}
        onSelectCentre={onSelectCentre}
        onSelectMandi={onSelectMandi}
        userLocation={userLocation}
        locationMode={locationMode}
        height={height}
        interactiveSelect={false}
        showRoute={showRoute}
      />
    </div>
  );
};

export default GoogleCentreMap;
