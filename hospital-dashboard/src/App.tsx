import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import Map from './components/Map';
import AccidentCard from './components/AccidentCard';

type Event = {
  _id: string;
  userId: string;
  severity: number;
  location: { lat: number; lng: number };
  status: string;
  timestamp: string;
};

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4001';

export default function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  const socket = useMemo(() => io(backendUrl, { 
    path: '/socket.io',
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
  }), []);

  useEffect(() => {
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

    socket.on('hospital-feed', (msg: any) => {
      console.log('Received hospital-feed message:', msg);
      if (msg.type === 'NEW_EVENT') {
        setEvents((prev) => [msg.payload, ...prev]);
      } else if (msg.type === 'UPDATE_EVENT') {
        setEvents((prev) => prev.map(e => e._id === msg.payload._id ? msg.payload : e));
      }
    });

    return () => { 
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('hospital-feed');
      socket.close(); 
    };
  }, [socket]);

  return (
    <div className="min-h-screen grid grid-cols-3" >
      <div className="col-span-2 relative">
        <Map events={events} />
        {/* Connection Status Indicator */}
        <div className="absolute top-4 right-4 z-10">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
            connectionStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {connectionStatus === 'connected' ? '🟢 Connected' :
             connectionStatus === 'connecting' ? '🟡 Connecting...' :
             '🔴 Disconnected'}
          </div>
        </div>
      </div>
      <div className="col-span-1 p-4 space-y-3 overflow-y-auto bg-gray-50">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-800">Accident Events</h2>
          <p className="text-sm text-gray-600">Real-time accident detection feed</p>
          <div className="text-xs text-gray-500 mt-1">
            Backend: {backendUrl} | Events: {events.length}
          </div>
        </div>
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🚨</div>
            <p>No accidents detected</p>
            <p className="text-xs mt-2">Waiting for real-time events...</p>
          </div>
        ) : (
          events.map((e) => (
            <AccidentCard key={e._id} event={e} backendUrl={backendUrl} />
          ))
        )}
      </div>
    </div>
  );
}



