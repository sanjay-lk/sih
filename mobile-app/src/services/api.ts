import Constants from 'expo-constants';
import axios from 'axios';

const backendUrl = (Constants?.expoConfig?.extra as any)?.backendUrl || 'http://localhost:4000';
export const api = axios.create({ baseURL: `${backendUrl}/api` });

export type AccidentPayload = {
  userId: string;
  location: { lat: number; lng: number };
  severityScore: number;
  timestamp: string;
};

export async function reportAccident(payload: AccidentPayload) {
  const res = await api.post('/report-accident', payload);
  return res.data;
}



