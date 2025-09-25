"""
TensorFlow Model Training for Accident Detection
Smart India Hackathon 2024
"""

import tensorflow as tf
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib
import os

class AccidentDetectionTrainer:
    """Train and export TensorFlow Lite model for accident detection"""
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = [
            'accel_x', 'accel_y', 'accel_z', 'accel_magnitude',
            'gyro_x', 'gyro_y', 'gyro_z', 'gyro_magnitude',
            'speed', 'speed_change', 'audio_level'
        ]
    
    def generate_synthetic_data(self, n_samples=10000):
        """Generate synthetic training data for demonstration"""
        np.random.seed(42)
        
        # Normal driving scenarios (70% of data)
        normal_samples = int(n_samples * 0.7)
        normal_data = {
            'accel_x': np.random.normal(0, 2, normal_samples),
            'accel_y': np.random.normal(0, 2, normal_samples),
            'accel_z': np.random.normal(9.8, 1, normal_samples),
            'gyro_x': np.random.normal(0, 0.5, normal_samples),
            'gyro_y': np.random.normal(0, 0.5, normal_samples),
            'gyro_z': np.random.normal(0, 0.5, normal_samples),
            'speed': np.random.normal(40, 15, normal_samples),
            'speed_change': np.random.normal(0, 5, normal_samples),
            'audio_level': np.random.normal(60, 10, normal_samples),
            'is_accident': np.zeros(normal_samples)
        }
        
        # Accident scenarios (30% of data)
        accident_samples = n_samples - normal_samples
        accident_data = {
            'accel_x': np.random.normal(-15, 8, accident_samples),
            'accel_y': np.random.normal(0, 10, accident_samples),
            'accel_z': np.random.normal(5, 8, accident_samples),
            'gyro_x': np.random.normal(0, 3, accident_samples),
            'gyro_y': np.random.normal(0, 5, accident_samples),
            'gyro_z': np.random.normal(0, 3, accident_samples),
            'speed': np.random.normal(20, 15, accident_samples),
            'speed_change': np.random.normal(-25, 10, accident_samples),
            'audio_level': np.random.normal(85, 15, accident_samples),
            'is_accident': np.ones(accident_samples)
        }
        
        # Combine data
        data = {}
        for key in normal_data.keys():
            data[key] = np.concatenate([normal_data[key], accident_data[key]])
        
        # Add derived features
        data['accel_magnitude'] = np.sqrt(
            data['accel_x']**2 + data['accel_y']**2 + data['accel_z']**2
        )
        data['gyro_magnitude'] = np.sqrt(
            data['gyro_x']**2 + data['gyro_y']**2 + data['gyro_z']**2
        )
        
        return pd.DataFrame(data)
    
    def build_model(self, input_shape):
        """Build neural network model"""
        model = tf.keras.Sequential([
            tf.keras.layers.Dense(128, activation='relu', input_shape=(input_shape,)),
            tf.keras.layers.Dropout(0.3),
            tf.keras.layers.Dense(64, activation='relu'),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(32, activation='relu'),
            tf.keras.layers.Dense(1, activation='sigmoid')
        ])
        
        model.compile(
            optimizer='adam',
            loss='binary_crossentropy',
            metrics=['accuracy', 'precision', 'recall']
        )
        
        return model
    
    def train(self, save_model=True):
        """Train the accident detection model"""
        print("Generating synthetic training data...")
        df = self.generate_synthetic_data()
        
        # Prepare features and labels
        X = df[self.feature_names].values
        y = df['is_accident'].values
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Build and train model
        print("Building and training model...")
        self.model = self.build_model(X_train_scaled.shape[1])
        
        # Training callbacks
        callbacks = [
            tf.keras.callbacks.EarlyStopping(patience=10, restore_best_weights=True),
            tf.keras.callbacks.ReduceLROnPlateau(patience=5, factor=0.5)
        ]
        
        # Train model
        history = self.model.fit(
            X_train_scaled, y_train,
            validation_data=(X_test_scaled, y_test),
            epochs=100,
            batch_size=32,
            callbacks=callbacks,
            verbose=1
        )
        
        # Evaluate model
        test_loss, test_accuracy, test_precision, test_recall = self.model.evaluate(
            X_test_scaled, y_test, verbose=0
        )
        
        print(f"\nModel Performance:")
        print(f"Test Accuracy: {test_accuracy:.4f}")
        print(f"Test Precision: {test_precision:.4f}")
        print(f"Test Recall: {test_recall:.4f}")
        print(f"F1 Score: {2 * (test_precision * test_recall) / (test_precision + test_recall):.4f}")
        
        if save_model:
            self.save_model()
        
        return history
    
    def save_model(self):
        """Save model and scaler"""
        os.makedirs('models', exist_ok=True)
        
        # Save TensorFlow model
        self.model.save('models/accident_detection_model.h5')
        print("Saved TensorFlow model to models/accident_detection_model.h5")
        
        # Save scaler
        joblib.dump(self.scaler, 'models/scaler.pkl')
        print("Saved scaler to models/scaler.pkl")
        
        # Convert to TensorFlow Lite
        self.convert_to_tflite()
    
    def convert_to_tflite(self):
        """Convert model to TensorFlow Lite format"""
        converter = tf.lite.TFLiteConverter.from_keras_model(self.model)
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        
        # Convert model
        tflite_model = converter.convert()
        
        # Save TFLite model
        with open('models/accident_detection.tflite', 'wb') as f:
            f.write(tflite_model)
        
        print("Saved TensorFlow Lite model to models/accident_detection.tflite")
        
        # Get model size
        model_size = len(tflite_model) / 1024  # KB
        print(f"TFLite model size: {model_size:.2f} KB")
    
    def predict_sample(self, sensor_data):
        """Make prediction on sample data"""
        if self.model is None:
            raise ValueError("Model not trained yet. Call train() first.")
        
        # Prepare input
        features = np.array([[
            sensor_data['accel_x'], sensor_data['accel_y'], sensor_data['accel_z'],
            sensor_data['accel_magnitude'], sensor_data['gyro_x'], sensor_data['gyro_y'],
            sensor_data['gyro_z'], sensor_data['gyro_magnitude'], sensor_data['speed'],
            sensor_data['speed_change'], sensor_data['audio_level']
        ]])
        
        # Scale features
        features_scaled = self.scaler.transform(features)
        
        # Predict
        prediction = self.model.predict(features_scaled)[0][0]
        
        return {
            'accident_probability': float(prediction),
            'is_accident': prediction > 0.5,
            'confidence': 'high' if prediction > 0.8 or prediction < 0.2 else 'medium'
        }

def main():
    """Main training function"""
    print("=== AI Accident Detection Model Training ===")
    
    trainer = AccidentDetectionTrainer()
    
    # Train model
    history = trainer.train()
    
    # Test with sample data
    print("\n=== Testing Model ===")
    
    # Test case 1: Normal driving
    normal_sample = {
        'accel_x': 1.0, 'accel_y': 0.5, 'accel_z': 9.8, 'accel_magnitude': 9.9,
        'gyro_x': 0.1, 'gyro_y': 0.2, 'gyro_z': 0.1, 'gyro_magnitude': 0.24,
        'speed': 45.0, 'speed_change': 2.0, 'audio_level': 60.0
    }
    
    # Test case 2: Accident scenario
    accident_sample = {
        'accel_x': -20.0, 'accel_y': 5.0, 'accel_z': -8.0, 'accel_magnitude': 22.2,
        'gyro_x': 3.0, 'gyro_y': 6.0, 'gyro_z': 2.0, 'gyro_magnitude': 7.0,
        'speed': 15.0, 'speed_change': -30.0, 'audio_level': 90.0
    }
    
    normal_result = trainer.predict_sample(normal_sample)
    accident_result = trainer.predict_sample(accident_sample)
    
    print(f"Normal driving prediction: {normal_result}")
    print(f"Accident scenario prediction: {accident_result}")
    
    print("\n=== Training Complete ===")
    print("Models saved in 'models/' directory:")
    print("- accident_detection_model.h5 (TensorFlow)")
    print("- accident_detection.tflite (TensorFlow Lite)")
    print("- scaler.pkl (Feature scaler)")

if __name__ == "__main__":
    main()
