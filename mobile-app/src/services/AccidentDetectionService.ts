/**
 * Accident Detection Service for React Native
 * Integrates with device sensors and AI model
 */

import { DeviceMotion } from 'expo-sensors';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SensorData {
  timestamp: string;
  accelerometer: {
    x: number;
    y: number;
    z: number;
  };
  gyroscope: {
    x: number;
    y: number;
    z: number;
  };
  location: {
    latitude: number;
    longitude: number;
    speed: number;
  };
  audioLevel: number;
}

export interface AccidentPrediction {
  isAccident: boolean;
  confidence: number;
  severity: 'NONE' | 'MINOR' | 'MODERATE' | 'SEVERE';
  timestamp: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

class AccidentDetectionService {
  private isMonitoring: boolean = false;
  private sensorData: SensorData[] = [];
  private speedHistory: number[] = [];
  private lastLocation: Location.LocationObject | null = null;
  private audioRecording: Audio.Recording | null = null;
  
  // Thresholds for accident detection
  private readonly ACCELERATION_THRESHOLD = 15.0; // m/s²
  private readonly GYROSCOPE_THRESHOLD = 5.0; // rad/s
  private readonly SPEED_CHANGE_THRESHOLD = 30.0; // km/h
  private readonly AUDIO_THRESHOLD = 80.0; // dB (simplified)
  
  constructor() {
    this.setupSensors();
  }
  
  private async setupSensors() {
    // Request permissions
    await this.requestPermissions();
    
    // Setup device motion sensor
    DeviceMotion.setUpdateInterval(100); // 10Hz sampling rate
  }
  
  private async requestPermissions() {
    // Location permission
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    if (locationStatus !== 'granted') {
      throw new Error('Location permission not granted');
    }
    
    // Audio permission
    const { status: audioStatus } = await Audio.requestPermissionsAsync();
    if (audioStatus !== 'granted') {
      console.warn('Audio permission not granted - audio detection disabled');
    }
  }
  
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('Starting accident detection monitoring...');
    
    // Start sensor monitoring
    this.startDeviceMotionMonitoring();
    this.startLocationMonitoring();
    this.startAudioMonitoring();
    
    // Start analysis loop
    this.startAnalysisLoop();
  }
  
  async stopMonitoring(): Promise<void> {
    this.isMonitoring = false;
    console.log('Stopping accident detection monitoring...');
    
    // Stop sensors
    DeviceMotion.removeAllListeners();
    if (this.audioRecording) {
      await this.audioRecording.stopAndUnloadAsync();
      this.audioRecording = null;
    }
  }
  
  private startDeviceMotionMonitoring() {
    DeviceMotion.addListener((motionData) => {
      if (!this.isMonitoring) return;
      
      const { acceleration, rotation } = motionData;
      
      if (acceleration && rotation) {
        this.processSensorReading({
          accelerometer: {
            x: acceleration.x || 0,
            y: acceleration.y || 0,
            z: acceleration.z || 0
          },
          gyroscope: {
            x: rotation.alpha || 0,
            y: rotation.beta || 0,
            z: rotation.gamma || 0
          }
        });
      }
    });
  }
  
  private async startLocationMonitoring() {
    try {
      // Get initial location
      this.lastLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
      // Watch location changes
      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000, // Update every second
          distanceInterval: 1 // Update every meter
        },
        (location) => {
          if (!this.isMonitoring) return;
          
          this.processLocationUpdate(location);
        }
      );
    } catch (error) {
      console.error('Error starting location monitoring:', error);
    }
  }
  
  private async startAudioMonitoring() {
    try {
      // Setup audio recording for sound level detection
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      // Note: In a real implementation, you would use a proper audio level meter
      // This is a simplified version for demonstration
      this.simulateAudioLevelMonitoring();
    } catch (error) {
      console.error('Error starting audio monitoring:', error);
    }
  }
  
  private simulateAudioLevelMonitoring() {
    // Simulate audio level monitoring (replace with actual implementation)
    setInterval(() => {
      if (!this.isMonitoring) return;
      
      // Simulate normal audio levels with occasional spikes
      const baseLevel = 50 + Math.random() * 20; // 50-70 dB normal
      const audioLevel = Math.random() < 0.05 ? baseLevel + 30 : baseLevel; // 5% chance of spike
      
      this.processAudioLevel(audioLevel);
    }, 500);
  }
  
  private processSensorReading(sensorData: Partial<SensorData>) {
    const timestamp = new Date().toISOString();
    
    // Combine with latest location and audio data
    const currentData: SensorData = {
      timestamp,
      accelerometer: sensorData.accelerometer || { x: 0, y: 0, z: 0 },
      gyroscope: sensorData.gyroscope || { x: 0, y: 0, z: 0 },
      location: this.getLatestLocation(),
      audioLevel: this.getLatestAudioLevel()
    };
    
    // Store sensor data (keep last 100 readings)
    this.sensorData.push(currentData);
    if (this.sensorData.length > 100) {
      this.sensorData.shift();
    }
  }
  
  private processLocationUpdate(location: Location.LocationObject) {
    this.lastLocation = location;
    
    // Update speed history
    const speed = (location.coords.speed || 0) * 3.6; // Convert m/s to km/h
    this.speedHistory.push(speed);
    
    // Keep last 10 speed readings
    if (this.speedHistory.length > 10) {
      this.speedHistory.shift();
    }
  }
  
  private processAudioLevel(level: number) {
    // Store latest audio level (in a real app, this would be more sophisticated)
    AsyncStorage.setItem('latest_audio_level', level.toString());
  }
  
  private getLatestLocation() {
    if (!this.lastLocation) {
      return { latitude: 0, longitude: 0, speed: 0 };
    }
    
    return {
      latitude: this.lastLocation.coords.latitude,
      longitude: this.lastLocation.coords.longitude,
      speed: (this.lastLocation.coords.speed || 0) * 3.6 // Convert to km/h
    };
  }
  
  private async getLatestAudioLevel(): Promise<number> {
    try {
      const level = await AsyncStorage.getItem('latest_audio_level');
      return level ? parseFloat(level) : 50.0;
    } catch {
      return 50.0;
    }
  }
  
  private startAnalysisLoop() {
    const analysisInterval = setInterval(async () => {
      if (!this.isMonitoring) {
        clearInterval(analysisInterval);
        return;
      }
      
      // Analyze recent sensor data for accidents
      const prediction = await this.analyzeForAccident();
      
      if (prediction.isAccident) {
        console.log('ACCIDENT DETECTED!', prediction);
        this.handleAccidentDetection(prediction);
      }
    }, 1000); // Analyze every second
  }
  
  private async analyzeForAccident(): Promise<AccidentPrediction> {
    if (this.sensorData.length === 0) {
      return {
        isAccident: false,
        confidence: 0,
        severity: 'NONE',
        timestamp: new Date().toISOString(),
        location: this.getLatestLocation()
      };
    }
    
    // Get latest sensor reading
    const latest = this.sensorData[this.sensorData.length - 1];
    
    // Calculate acceleration magnitude
    const accelMagnitude = Math.sqrt(
      latest.accelerometer.x ** 2 +
      latest.accelerometer.y ** 2 +
      latest.accelerometer.z ** 2
    );
    
    // Calculate gyroscope magnitude
    const gyroMagnitude = Math.sqrt(
      latest.gyroscope.x ** 2 +
      latest.gyroscope.y ** 2 +
      latest.gyroscope.z ** 2
    );
    
    // Calculate speed change
    let speedChange = 0;
    if (this.speedHistory.length >= 2) {
      const currentSpeed = this.speedHistory[this.speedHistory.length - 1];
      const previousSpeed = this.speedHistory[this.speedHistory.length - 2];
      speedChange = Math.abs(currentSpeed - previousSpeed);
    }
    
    // Simple rule-based detection (in production, use ML model)
    let confidence = 0;
    
    if (accelMagnitude > this.ACCELERATION_THRESHOLD) {
      confidence += 0.4;
    }
    
    if (gyroMagnitude > this.GYROSCOPE_THRESHOLD) {
      confidence += 0.3;
    }
    
    if (speedChange > this.SPEED_CHANGE_THRESHOLD) {
      confidence += 0.2;
    }
    
    if (latest.audioLevel > this.AUDIO_THRESHOLD) {
      confidence += 0.1;
    }
    
    // Determine severity
    let severity: 'NONE' | 'MINOR' | 'MODERATE' | 'SEVERE' = 'NONE';
    if (confidence >= 0.8) severity = 'SEVERE';
    else if (confidence >= 0.6) severity = 'MODERATE';
    else if (confidence >= 0.4) severity = 'MINOR';
    
    return {
      isAccident: confidence >= 0.4,
      confidence,
      severity,
      timestamp: latest.timestamp,
      location: latest.location
    };
  }
  
  private async handleAccidentDetection(prediction: AccidentPrediction) {
    try {
      // Store accident data locally
      await AsyncStorage.setItem('last_accident', JSON.stringify(prediction));
      
      // Send to backend API
      await this.reportAccidentToBackend(prediction);
      
      // Trigger emergency notifications
      await this.triggerEmergencyNotifications(prediction);
      
    } catch (error) {
      console.error('Error handling accident detection:', error);
    }
  }
  
  private async reportAccidentToBackend(prediction: AccidentPrediction) {
    const backendUrl = 'http://localhost:4001'; // Replace with actual backend URL
    
    try {
      const response = await fetch(`${backendUrl}/api/report-accident`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: await this.getUserId(),
          location: {
            lat: prediction.location.latitude,
            lng: prediction.location.longitude
          },
          severityScore: prediction.confidence,
          timestamp: prediction.timestamp
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Accident reported to backend:', result);
      }
    } catch (error) {
      console.error('Failed to report accident to backend:', error);
    }
  }
  
  private async triggerEmergencyNotifications(prediction: AccidentPrediction) {
    // In a real app, this would:
    // 1. Send SMS to emergency contacts
    // 2. Make emergency calls
    // 3. Send push notifications
    // 4. Display emergency UI
    
    console.log('Emergency notifications triggered for accident:', prediction);
  }
  
  private async getUserId(): Promise<string> {
    let userId = await AsyncStorage.getItem('user_id');
    if (!userId) {
      userId = `mobile_user_${Date.now()}`;
      await AsyncStorage.setItem('user_id', userId);
    }
    return userId;
  }
  
  // Public methods for getting current status
  public getMonitoringStatus(): boolean {
    return this.isMonitoring;
  }
  
  public getLatestSensorData(): SensorData | null {
    return this.sensorData.length > 0 ? this.sensorData[this.sensorData.length - 1] : null;
  }
  
  public getSensorHistory(): SensorData[] {
    return [...this.sensorData];
  }
}

export default new AccidentDetectionService();
