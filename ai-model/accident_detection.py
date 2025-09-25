"""
AI-Powered Accident Detection Model
Smart India Hackathon 2024

This module implements accident detection using sensor data and machine learning.
"""

import numpy as np
import json
from datetime import datetime
from typing import Dict, List, Tuple, Optional

class AccidentDetectionModel:
    """
    AI model for detecting accidents based on sensor data including:
    - Accelerometer data (sudden impacts)
    - Gyroscope data (vehicle orientation changes)
    - GPS data (speed changes, location)
    - Audio data (crash sounds)
    """
    
    def __init__(self):
        self.threshold_acceleration = 15.0  # m/s² - sudden deceleration threshold
        self.threshold_gyroscope = 5.0      # rad/s - rotation threshold
        self.threshold_speed_change = 30.0   # km/h - sudden speed change
        self.confidence_weights = {
            'acceleration': 0.4,
            'gyroscope': 0.3,
            'speed': 0.2,
            'audio': 0.1
        }
        
    def preprocess_sensor_data(self, raw_data: Dict) -> Dict:
        """
        Preprocess raw sensor data for analysis
        
        Args:
            raw_data: Dictionary containing sensor readings
            
        Returns:
            Processed sensor data
        """
        processed = {
            'timestamp': raw_data.get('timestamp', datetime.now().isoformat()),
            'acceleration': {
                'x': float(raw_data.get('accelerometer', {}).get('x', 0)),
                'y': float(raw_data.get('accelerometer', {}).get('y', 0)),
                'z': float(raw_data.get('accelerometer', {}).get('z', 0))
            },
            'gyroscope': {
                'x': float(raw_data.get('gyroscope', {}).get('x', 0)),
                'y': float(raw_data.get('gyroscope', {}).get('y', 0)),
                'z': float(raw_data.get('gyroscope', {}).get('z', 0))
            },
            'gps': {
                'latitude': float(raw_data.get('gps', {}).get('latitude', 0)),
                'longitude': float(raw_data.get('gps', {}).get('longitude', 0)),
                'speed': float(raw_data.get('gps', {}).get('speed', 0))
            },
            'audio_level': float(raw_data.get('audio_level', 0))
        }
        return processed
    
    def calculate_acceleration_magnitude(self, acceleration: Dict) -> float:
        """Calculate the magnitude of acceleration vector"""
        return np.sqrt(
            acceleration['x']**2 + 
            acceleration['y']**2 + 
            acceleration['z']**2
        )
    
    def calculate_gyroscope_magnitude(self, gyroscope: Dict) -> float:
        """Calculate the magnitude of gyroscope vector"""
        return np.sqrt(
            gyroscope['x']**2 + 
            gyroscope['y']**2 + 
            gyroscope['z']**2
        )
    
    def analyze_acceleration_pattern(self, acceleration: Dict) -> Tuple[float, str]:
        """
        Analyze acceleration patterns for accident detection
        
        Returns:
            Tuple of (confidence_score, pattern_description)
        """
        magnitude = self.calculate_acceleration_magnitude(acceleration)
        
        if magnitude > self.threshold_acceleration:
            confidence = min(magnitude / self.threshold_acceleration, 3.0) / 3.0
            return confidence, f"Sudden impact detected (magnitude: {magnitude:.2f} m/s²)"
        
        return 0.0, "Normal acceleration pattern"
    
    def analyze_gyroscope_pattern(self, gyroscope: Dict) -> Tuple[float, str]:
        """
        Analyze gyroscope patterns for vehicle rollover detection
        
        Returns:
            Tuple of (confidence_score, pattern_description)
        """
        magnitude = self.calculate_gyroscope_magnitude(gyroscope)
        
        if magnitude > self.threshold_gyroscope:
            confidence = min(magnitude / self.threshold_gyroscope, 2.0) / 2.0
            return confidence, f"Vehicle rotation detected (magnitude: {magnitude:.2f} rad/s)"
        
        return 0.0, "Normal rotation pattern"
    
    def analyze_speed_pattern(self, current_speed: float, previous_speeds: List[float]) -> Tuple[float, str]:
        """
        Analyze speed patterns for sudden stops or crashes
        
        Returns:
            Tuple of (confidence_score, pattern_description)
        """
        if len(previous_speeds) < 2:
            return 0.0, "Insufficient speed data"
        
        recent_speed = np.mean(previous_speeds[-3:])  # Average of last 3 readings
        speed_change = abs(recent_speed - current_speed)
        
        if speed_change > self.threshold_speed_change:
            confidence = min(speed_change / self.threshold_speed_change, 2.0) / 2.0
            return confidence, f"Sudden speed change detected ({speed_change:.1f} km/h)"
        
        return 0.0, "Normal speed pattern"
    
    def analyze_audio_pattern(self, audio_level: float) -> Tuple[float, str]:
        """
        Analyze audio patterns for crash sounds
        
        Returns:
            Tuple of (confidence_score, pattern_description)
        """
        # Simplified audio analysis - in real implementation, this would use
        # more sophisticated audio processing and ML models
        crash_threshold = 80.0  # dB threshold for crash sounds
        
        if audio_level > crash_threshold:
            confidence = min(audio_level / 100.0, 1.0)
            return confidence, f"High audio level detected ({audio_level:.1f} dB)"
        
        return 0.0, "Normal audio level"
    
    def predict_accident(self, sensor_data: Dict, speed_history: List[float] = None) -> Dict:
        """
        Main prediction function that analyzes all sensor data
        
        Args:
            sensor_data: Processed sensor data
            speed_history: List of previous speed readings
            
        Returns:
            Dictionary containing prediction results
        """
        if speed_history is None:
            speed_history = []
        
        # Analyze each sensor type
        accel_confidence, accel_desc = self.analyze_acceleration_pattern(sensor_data['acceleration'])
        gyro_confidence, gyro_desc = self.analyze_gyroscope_pattern(sensor_data['gyroscope'])
        speed_confidence, speed_desc = self.analyze_speed_pattern(
            sensor_data['gps']['speed'], speed_history
        )
        audio_confidence, audio_desc = self.analyze_audio_pattern(sensor_data['audio_level'])
        
        # Calculate weighted confidence score
        total_confidence = (
            accel_confidence * self.confidence_weights['acceleration'] +
            gyro_confidence * self.confidence_weights['gyroscope'] +
            speed_confidence * self.confidence_weights['speed'] +
            audio_confidence * self.confidence_weights['audio']
        )
        
        # Determine severity level
        if total_confidence >= 0.8:
            severity = "SEVERE"
            is_accident = True
        elif total_confidence >= 0.6:
            severity = "MODERATE"
            is_accident = True
        elif total_confidence >= 0.4:
            severity = "MINOR"
            is_accident = True
        else:
            severity = "NONE"
            is_accident = False
        
        return {
            'is_accident': is_accident,
            'confidence_score': total_confidence,
            'severity': severity,
            'timestamp': sensor_data['timestamp'],
            'location': {
                'latitude': sensor_data['gps']['latitude'],
                'longitude': sensor_data['gps']['longitude']
            },
            'analysis': {
                'acceleration': {'confidence': accel_confidence, 'description': accel_desc},
                'gyroscope': {'confidence': gyro_confidence, 'description': gyro_desc},
                'speed': {'confidence': speed_confidence, 'description': speed_desc},
                'audio': {'confidence': audio_confidence, 'description': audio_desc}
            },
            'recommendations': self.get_recommendations(severity, total_confidence)
        }
    
    def get_recommendations(self, severity: str, confidence: float) -> List[str]:
        """Get emergency response recommendations based on severity"""
        recommendations = []
        
        if severity == "SEVERE":
            recommendations.extend([
                "Immediately contact emergency services (911/108)",
                "Dispatch ambulance and fire rescue",
                "Alert nearby hospitals",
                "Notify traffic control for road clearance",
                "Send high-priority alerts to emergency contacts"
            ])
        elif severity == "MODERATE":
            recommendations.extend([
                "Contact emergency services",
                "Dispatch ambulance",
                "Alert nearby medical facilities",
                "Notify emergency contacts",
                "Monitor situation closely"
            ])
        elif severity == "MINOR":
            recommendations.extend([
                "Check for injuries",
                "Contact emergency services if needed",
                "Notify emergency contacts",
                "Document incident details",
                "Seek medical attention if required"
            ])
        
        return recommendations

# Example usage and testing functions
def simulate_accident_scenario():
    """Simulate different accident scenarios for testing"""
    model = AccidentDetectionModel()
    
    # Scenario 1: High-impact collision
    collision_data = {
        'accelerometer': {'x': -25.0, 'y': 5.0, 'z': -8.0},
        'gyroscope': {'x': 2.0, 'y': 7.0, 'z': 1.0},
        'gps': {'latitude': 12.9716, 'longitude': 77.5946, 'speed': 15.0},
        'audio_level': 95.0,
        'timestamp': datetime.now().isoformat()
    }
    
    # Scenario 2: Vehicle rollover
    rollover_data = {
        'accelerometer': {'x': -8.0, 'y': 12.0, 'z': -15.0},
        'gyroscope': {'x': 8.0, 'y': 2.0, 'z': 6.0},
        'gps': {'latitude': 12.9716, 'longitude': 77.5946, 'speed': 5.0},
        'audio_level': 75.0,
        'timestamp': datetime.now().isoformat()
    }
    
    # Scenario 3: Normal driving
    normal_data = {
        'accelerometer': {'x': 1.0, 'y': 0.5, 'z': 9.8},
        'gyroscope': {'x': 0.1, 'y': 0.2, 'z': 0.1},
        'gps': {'latitude': 12.9716, 'longitude': 77.5946, 'speed': 45.0},
        'audio_level': 60.0,
        'timestamp': datetime.now().isoformat()
    }
    
    scenarios = [
        ("High-Impact Collision", collision_data),
        ("Vehicle Rollover", rollover_data),
        ("Normal Driving", normal_data)
    ]
    
    speed_history = [50.0, 48.0, 45.0, 42.0, 20.0]  # Simulated speed history
    
    print("=== AI Accident Detection Model Test Results ===\n")
    
    for scenario_name, data in scenarios:
        processed_data = model.preprocess_sensor_data(data)
        result = model.predict_accident(processed_data, speed_history)
        
        print(f"Scenario: {scenario_name}")
        print(f"Accident Detected: {result['is_accident']}")
        print(f"Confidence Score: {result['confidence_score']:.3f}")
        print(f"Severity: {result['severity']}")
        print(f"Location: {result['location']['latitude']}, {result['location']['longitude']}")
        print("Analysis:")
        for sensor, analysis in result['analysis'].items():
            print(f"  {sensor.capitalize()}: {analysis['description']} (confidence: {analysis['confidence']:.3f})")
        print("Recommendations:")
        for i, rec in enumerate(result['recommendations'], 1):
            print(f"  {i}. {rec}")
        print("-" * 60)

if __name__ == "__main__":
    simulate_accident_scenario()
