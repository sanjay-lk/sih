import { AccidentEvent } from '../api';

interface Props {
  events: AccidentEvent[];
  userId: string;
}

export default function MyEvents({ events }: Props) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reported': return 'bg-yellow-100 text-yellow-800';
      case 'notified': return 'bg-blue-100 text-blue-800';
      case 'acknowledged': return 'bg-green-100 text-green-800';
      case 'assigned': return 'bg-purple-100 text-purple-800';
      case 'dispatched': return 'bg-indigo-100 text-indigo-800';
      case 'escalated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'reported': return '📝';
      case 'notified': return '📢';
      case 'acknowledged': return '✅';
      case 'assigned': return '👨‍⚕️';
      case 'dispatched': return '🚑';
      case 'escalated': return '🚨';
      default: return '❓';
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'reported': return 'Your accident has been reported and is being processed';
      case 'notified': return 'Emergency contacts have been notified';
      case 'acknowledged': return 'Hospital has acknowledged your emergency';
      case 'assigned': return 'Medical team has been assigned to your case';
      case 'dispatched': return 'Ambulance is on the way to your location';
      case 'escalated': return 'Your case has been escalated to higher priority';
      default: return 'Status unknown';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">📋 My Accident Reports</h2>
        
        {events.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🚗</div>
            <h3 className="text-xl font-medium text-gray-600 mb-2">No accidents reported</h3>
            <p className="text-gray-500">We hope you stay safe on the road!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getStatusIcon(event.status)}</span>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        Accident Report #{event._id.slice(-6)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(event.status)}`}>
                    {event.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">📍 Location</h4>
                    <p className="text-sm text-gray-600">
                      {event.location.lat.toFixed(4)}, {event.location.lng.toFixed(4)}
                    </p>
                    <a
                      href={`https://maps.google.com/?q=${event.location.lat},${event.location.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm underline"
                    >
                      View on Google Maps
                    </a>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">⚠️ Severity</h4>
                    <div className="flex items-center space-x-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            event.severity > 0.7 ? 'bg-red-500' :
                            event.severity > 0.4 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${event.severity * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">
                        {Math.round(event.severity * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700">
                    {getStatusDescription(event.status)}
                  </p>
                </div>

                {event.status === 'dispatched' && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-600">🚑</span>
                      <span className="font-medium text-blue-800">Ambulance Dispatched</span>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      Emergency medical team is on the way. Please stay at your location and remain calm.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
