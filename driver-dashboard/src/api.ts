import axios from 'axios';

export const backend = axios.create({ 
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:4001' 
});

export interface AccidentReport {
  userId: string;
  location: {
    lat: number;
    lng: number;
  };
  severityScore: number;
  timestamp: string;
}

export interface AccidentEvent {
  _id: string;
  userId: string;
  severity: number;
  location: { lat: number; lng: number };
  status: string;
  timestamp: string;
  acknowledged: boolean;
}

export const reportAccident = async (report: AccidentReport) => {
  const response = await backend.post('/api/report-accident', report);
  return response.data;
};

export const getMyEvents = async (userId: string) => {
  // This would be a new endpoint we'd need to add to the backend
  // For now, we'll simulate it
  const response = await backend.get(`/api/events/user/${userId}`);
  return response.data;
};
