# AI Model - Crash Detection (Stub)

- Goal: Train anomaly detection (autoencoder/LSTM) for crash vs normal using accelerometer + gyroscope.
- Data: Public datasets (NHTSA/Kaggle) or synthetic spikes.
- Features: ax, ay, az, gx, gy, gz at 10–50 Hz.

## Outline

1) Preprocess
- Normalize per-axis; segment into 2s windows with overlap.

2) Model
- LSTM autoencoder or 1D CNN classifier.

3) Train
- AE: reconstruction loss (MSE). Classifier: BCE.

4) Threshold
- Speed drop >40 km/h in <2s ⇒ high severity.
- Calibrate probability threshold ≈0.85.

5) Export
- Convert to TensorFlow Lite; save as models/placeholder.tflite

