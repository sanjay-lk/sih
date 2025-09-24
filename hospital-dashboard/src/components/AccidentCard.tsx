type Props = {
  event: any;
  backendUrl: string;
};

export default function AccidentCard({ event, backendUrl }: Props) {
  const onAction = async (action: 'ack' | 'assign' | 'dispatch') => {
    try {
      const path = action === 'ack' ? 'ack' : action;
      const response = await fetch(`${backendUrl}/api/events/${event._id}/${path}`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`Action ${action} completed:`, result);
    } catch (error) {
      console.error(`Failed to ${action} event:`, error);
      alert(`Failed to ${action} event. Please try again.`);
    }
  };

  return (
    <div className="border rounded p-3 shadow-sm bg-white">
      <div className="text-sm text-gray-500">{new Date(event.timestamp).toLocaleString()}</div>
      <div className="font-semibold">User: {event.userId}</div>
      <div>Severity: {(event.severity * 100).toFixed(0)}%</div>
      <div>Status: <span className="uppercase">{event.status}</span></div>
      <div className="mt-2 flex gap-2">
        <button onClick={() => onAction('ack')} className="px-2 py-1 bg-gray-200 rounded">Accept</button>
        <button onClick={() => onAction('assign')} className="px-2 py-1 bg-blue-500 text-white rounded">Assign</button>
        <button onClick={() => onAction('dispatch')} className="px-2 py-1 bg-green-600 text-white rounded">Dispatch Ambulance</button>
      </div>
    </div>
  );
}



