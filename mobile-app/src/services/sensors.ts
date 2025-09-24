import * as Location from 'expo-location';
import { Accelerometer, Gyroscope } from 'expo-sensors';

export type SensorSample = {
  ax: number; ay: number; az: number;
  gx: number; gy: number; gz: number;
  timestamp: number;
};

export async function requestPermissions() {
  await Location.requestForegroundPermissionsAsync();
  await Accelerometer.setUpdateInterval(100);
  await Gyroscope.setUpdateInterval(100);
}

export function startSensorStream(onSample: (s: SensorSample) => void) {
  const accSub = Accelerometer.addListener(({ x, y, z }) => {
    const t = Date.now();
    latest.ax = x; latest.ay = y; latest.az = z; latest.timestamp = t;
    flush();
  });
  const gyroSub = Gyroscope.addListener(({ x, y, z }) => {
    const t = Date.now();
    latest.gx = x; latest.gy = y; latest.gz = z; latest.timestamp = t;
    flush();
  });
  let lastEmitted = 0;
  const latest: SensorSample = { ax: 0, ay: 0, az: 0, gx: 0, gy: 0, gz: 0, timestamp: 0 };
  function flush() {
    if (Date.now() - lastEmitted > 100) {
      lastEmitted = Date.now();
      onSample({ ...latest });
    }
  }
  return () => { accSub.remove(); gyroSub.remove(); };
}

export async function getCurrentLocation(): Promise<{ lat: number; lng: number }> {
  const { coords } = await Location.getCurrentPositionAsync({});
  return { lat: coords.latitude, lng: coords.longitude };
}



