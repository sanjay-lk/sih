import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import AccidentReportForm from './components/AccidentReportForm';
import MyEvents from './components/MyEvents';
import LocationTracker from './components/LocationTracker';
import { AccidentEvent } from './api';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4001';

export default function App() {
  const [currentView, setCurrentView] = useState<'report' | 'events' | 'location'>('report');
  const [userId, setUserId] = useState<string>('');
  const [userEvents, setUserEvents] = useState<AccidentEvent[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  // Initialize user ID (in a real app, this would come from authentication)
  useEffect(() => {
    const storedUserId = localStorage.getItem('driverId');
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      const newUserId = `driver_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('driverId', newUserId);
      setUserId(newUserId);
    }
  }, []);

  // Socket connection for real-time updates
  useEffect(() => {
    if (!userId) return;

    const socket = io(backendUrl, {
      path: '/socket.io',
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('Connected to backend');
      setConnectionStatus('connected');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from backend');
      setConnectionStatus('disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnectionStatus('disconnected');
    });

    // Listen for updates to user's events
    socket.on('hospital-feed', (msg: any) => {
      if (msg.type === 'UPDATE_EVENT' && msg.payload.userId === userId) {
        setUserEvents(prev => prev.map(e => 
          e._id === msg.payload._id ? msg.payload : e
        ));
      }
    });

    return () => {
      socket.close();
    };
  }, [userId]);

  const handleNewAccidentReport = (event: AccidentEvent) => {
    setUserEvents(prev => [event, ...prev]);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">🚗 Driver Dashboard</h1>
              <p className="text-blue-200 text-sm">Smart Accident Detection System</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
                connectionStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {connectionStatus === 'connected' ? '🟢 Connected' :
                 connectionStatus === 'connecting' ? '🟡 Connecting...' :
                 '🔴 Disconnected'}
              </div>
              <div className="text-sm">
                <div>Driver ID:</div>
                <div className="font-mono text-xs">{userId}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setCurrentView('report')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                currentView === 'report'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              🚨 Report Accident
            </button>
            <button
              onClick={() => setCurrentView('events')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                currentView === 'events'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📋 My Events ({userEvents.length})
            </button>
            <button
              onClick={() => setCurrentView('location')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                currentView === 'location'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📍 Location Tracker
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {currentView === 'report' && (
          <AccidentReportForm 
            userId={userId} 
            onAccidentReported={handleNewAccidentReport}
          />
        )}
        {currentView === 'events' && (
          <MyEvents 
            events={userEvents}
            userId={userId}
          />
        )}
        {currentView === 'location' && (
          <LocationTracker userId={userId} />
        )}
      </main>
    </div>
  );
}
