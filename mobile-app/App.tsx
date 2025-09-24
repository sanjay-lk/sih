import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Button, Alert, Vibration, StyleSheet } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { requestPermissions, startSensorStream, getCurrentLocation, SensorSample } from './src/services/sensors';
import { loadModel, inferCrashProbability } from './src/services/model';
import { reportAccident } from './src/services/api';

export default function App() {
  const [monitoring, setMonitoring] = useState(false);
  const bufferRef = useRef<SensorSample[]>([]);
  const cancelRef = useRef<() => void>(() => {});

  useEffect(() => {
    (async () => {
      await requestPermissions();
      await loadModel();
      await Notifications.requestPermissionsAsync();
    })();
  }, []);

  const start = () => {
    setMonitoring(true);
    const stop = startSensorStream((s) => {
      const arr = bufferRef.current;
      arr.push(s);
      if (arr.length > 100) arr.shift();
      if (arr.length >= 20) {
        const windowSamples = arr.slice(-20);
        const { probability, severity } = inferCrashProbability({ samples: windowSamples });
        if (probability > 0.85) {
          onDetected(severity).catch(() => {});
        }
      }
    });
    cancelRef.current = stop;
  };

  const stop = () => {
    cancelRef.current?.();
    setMonitoring(false);
  };

  async function onDetected(severity: number) {
    if (!monitoring) return;
    Vibration.vibrate(1000);
    let cancelled = false;
    Alert.alert(
      'Accident detected',
      'Cancel within 10 seconds if safe.',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => { cancelled = true; } },
      ],
      { cancelable: true }
    );
    await new Promise((r) => setTimeout(r, 10000));
    if (cancelled) return;
    try {
      const loc = await getCurrentLocation();
      await reportAccident({
        userId: Device.osBuildId || 'demo_user',
        location: loc,
        severityScore: severity,
        timestamp: new Date().toISOString(),
      });
      Alert.alert('Rescue notified', 'Emergency contacts and hospital have been alerted.');
    } catch (e) {
      Alert.alert('Error', 'Failed to report accident.');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI-Powered Accident Detection</Text>
      <Text>Status: {monitoring ? 'Monitoring' : 'Idle'}</Text>
      <View style={{ height: 12 }} />
      {monitoring ? (
        <Button title="Stop Monitoring" onPress={stop} />
      ) : (
        <Button title="Start Monitoring" onPress={start} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
});



