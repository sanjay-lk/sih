import { useState, useEffect } from 'react';

interface Props {
  userId: string;
}

interface LocationData {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: Date;
}

export default function LocationTracker({ userId }: Props) {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [locationHistory, setLocationHistory] = useState<LocationData[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isTracking) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation: LocationData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date()
          };
          
          setCurrentLocation(newLocation);
          setLocationHistory(prev => [newLocation, ...prev.slice(0, 9)]); // Keep last 10 locations
          setError('');
        },
        (error) => {
          console.error('Location error:', error);
          setError(`Location error: ${error.message}`);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, [isTracking]);

  const toggleTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }
    
    setIsTracking(!isTracking);
    if (!isTracking) {
      setLocationHistory([]);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation: LocationData = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date()
        };
        
        setCurrentLocation(newLocation);
        setError('');
      },
      (error) => {
        console.error('Location error:', error);
        setError(`Location error: ${error.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">📍 Location Tracker</h2>
        
        {/* Controls */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={getCurrentLocation}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            📍 Get Current Location
          </button>
          <button
            onClick={toggleTracking}
            className={`px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 ${
              isTracking
                ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
            }`}
          >
            {isTracking ? '⏹️ Stop Tracking' : '▶️ Start Tracking'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">⚠️ {error}</p>
          </div>
        )}

        {/* Current Location */}
        {currentLocation && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">📍 Current Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Latitude:</strong> {currentLocation.lat.toFixed(6)}</p>
                <p><strong>Longitude:</strong> {currentLocation.lng.toFixed(6)}</p>
              </div>
              <div>
                <p><strong>Accuracy:</strong> ±{Math.round(currentLocation.accuracy)}m</p>
                <p><strong>Updated:</strong> {currentLocation.timestamp.toLocaleTimeString()}</p>
              </div>
            </div>
            <div className="mt-3">
              <a
                href={`https://maps.google.com/?q=${currentLocation.lat},${currentLocation.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-700 hover:text-green-900 underline"
              >
                🗺️ View on Google Maps
              </a>
            </div>
          </div>
        )}

        {/* Tracking Status */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">Tracking Status</h3>
              <p className="text-sm text-gray-600">
                {isTracking ? 'Location tracking is active' : 'Location tracking is inactive'}
              </p>
            </div>
            <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          </div>
        </div>

        {/* Location History */}
        {locationHistory.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-800 mb-4">📊 Location History</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {locationHistory.map((location, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg text-sm">
                  <div>
                    <span className="font-medium">
                      {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </span>
                    <span className="text-gray-500 ml-2">
                      (±{Math.round(location.accuracy)}m)
                    </span>
                  </div>
                  <div className="text-gray-500">
                    {location.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">ℹ️ Location Tracking Info</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• Location data helps emergency services find you quickly</p>
            <p>• Your location is only shared during emergencies</p>
            <p>• Tracking uses GPS for high accuracy</p>
            <p>• Data is stored locally and not shared with third parties</p>
          </div>
        </div>
      </div>
    </div>
  );
}
