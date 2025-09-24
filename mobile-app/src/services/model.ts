// Stub TFLite inference. Replace with actual tflite-react-native or expo-tflite in a real app.

export type InferenceInput = { samples: { ax: number; ay: number; az: number; gx: number; gy: number; gz: number; timestamp: number }[] };

export async function loadModel(): Promise<void> {
  // no-op stub
}

export function inferCrashProbability(input: InferenceInput): { probability: number; severity: number } {
  // Simple heuristic: if large change in acceleration magnitude within short window
  if (input.samples.length < 5) return { probability: 0.01, severity: 0.01 };
  let maxMag = 0;
  for (const s of input.samples) {
    const mag = Math.sqrt(s.ax*s.ax + s.ay*s.ay + s.az*s.az);
    if (mag > maxMag) maxMag = mag;
  }
  const probability = Math.min(1, Math.max(0, (maxMag - 1.5) / 3));
  const severity = probability; // stub
  return { probability, severity };
}



