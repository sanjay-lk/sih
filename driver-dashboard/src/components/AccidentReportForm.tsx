import { useState, useEffect } from 'react';
import { reportAccident, AccidentEvent } from '../api';

interface Props {
  userId: string;
  onAccidentReported: (event: AccidentEvent) => void;
}

export default function AccidentReportForm({ userId, onAccidentReported }: Props) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [severity, setSeverity] = useState<number>(0.5);
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string>('');

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationError('');
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError('Unable to get your location. Using default location.');
          // Default to Bangalore coordinates
          setLocation({ lat: 12.9716, lng: 77.5946 });
        }
      );
    } else {
      setLocationError('Geolocation is not supported by this browser.');
      setLocation({ lat: 12.9716, lng: 77.5946 });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) return;

    setIsSubmitting(true);
    try {
      const report = {
        userId,
        location,
        severityScore: severity,
        timestamp: new Date().toISOString()
      };

      const result = await reportAccident(report);
      console.log('Accident reported:', result);

      // Create a mock event object for immediate UI update
      const mockEvent: AccidentEvent = {
        _id: result.eventId,
        userId,
        severity,
        location,
        status: 'reported',
        timestamp: report.timestamp,
        acknowledged: false
      };

      onAccidentReported(mockEvent);

      // Reset form
      setSeverity(0.5);
      setDescription('');
      
      alert('Accident reported successfully! Emergency services have been notified.');
    } catch (error) {
      console.error('Failed to report accident:', error);
      alert('Failed to report accident. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSeverityLabel = (value: number) => {
    if (value < 0.3) return 'Minor';
    if (value < 0.7) return 'Moderate';
    return 'Severe';
  };

  const getSeverityColor = (value: number) => {
    if (value < 0.3) return 'text-green-600';
    if (value < 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">🚨 Report an Accident</h2>
        
        {/* Location Status */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">📍 Current Location</h3>
          {location ? (
            <div className="text-sm text-gray-600">
              <p>Latitude: {location.lat.toFixed(6)}</p>
              <p>Longitude: {location.lng.toFixed(6)}</p>
              {locationError && (
                <p className="text-yellow-600 mt-1">⚠️ {locationError}</p>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Getting your location...</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Severity Slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Accident Severity
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={severity}
                onChange={(e) => setSeverity(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>Minor</span>
                <span>Moderate</span>
                <span>Severe</span>
              </div>
              <div className="text-center">
                <span className={`font-semibold ${getSeverityColor(severity)}`}>
                  {getSeverityLabel(severity)} ({Math.round(severity * 100)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Emergency Actions */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-800 mb-2">🚑 Emergency Actions</h4>
            <div className="text-sm text-red-700 space-y-1">
              <p>• Emergency services will be automatically notified</p>
              <p>• Your emergency contacts will receive alerts</p>
              <p>• Hospital dashboard will show your location</p>
              <p>• Stay calm and wait for help to arrive</p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!location || isSubmitting}
            className={`w-full py-3 px-4 rounded-md font-medium text-white ${
              !location || isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Reporting Accident...
              </span>
            ) : (
              '🚨 REPORT ACCIDENT NOW'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
