import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

type Props = { events: { _id: string; location: { lat: number; lng: number }; severity: number }[] };

export default function Map({ events }: Props) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Fallback when no Mapbox token is provided
  if (!mapboxgl.accessToken) {
    return (
      <div className="w-full h-screen bg-gray-100 flex items-center justify-center flex-col">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">Map View</h2>
          <p className="text-gray-600 mb-4">Mapbox token not configured</p>
          <div className="text-sm text-gray-500">
            <p>Events detected: {events.length}</p>
            {events.map((event, idx) => (
              <div key={event._id} className="mt-2 p-2 bg-white rounded shadow">
                <div>Event #{idx + 1}</div>
                <div>Location: {event.location.lat.toFixed(4)}, {event.location.lng.toFixed(4)}</div>
                <div>Severity: {(event.severity * 100).toFixed(0)}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    try {
      mapRef.current = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [77.5946, 12.9716], // default to Bangalore
        zoom: 10,
      });
    } catch (error) {
      console.error('Failed to initialize map:', error);
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    try {
      // Clear old markers: for demo, we recreate on updates
      (mapRef.current as any)._markers?.forEach((m: mapboxgl.Marker) => m.remove());
      const markers: mapboxgl.Marker[] = [];
      events.forEach((e) => {
        const color = e.severity > 0.7 ? '#dc2626' : e.severity > 0.4 ? '#f59e0b' : '#16a34a';
        const el = document.createElement('div');
        el.style.background = color;
        el.style.width = '12px';
        el.style.height = '12px';
        el.style.borderRadius = '9999px';
        const marker = new mapboxgl.Marker(el).setLngLat([e.location.lng, e.location.lat]).addTo(mapRef.current!);
        markers.push(marker);
      });
      (mapRef.current as any)._markers = markers;
    } catch (error) {
      console.error('Failed to update markers:', error);
    }
  }, [events]);

  return <div ref={containerRef} className="w-full h-screen" />;
}



