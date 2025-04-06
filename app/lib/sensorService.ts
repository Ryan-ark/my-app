import { ref, onValue, get } from 'firebase/database';
import { database } from './firebase';

interface SensorReading {
  "\"DO\"": string;
  "\"EC\"": string;
  "\"Temperature\"": string;
  "\"Weight\"": string;
  "{\"pH\"": string;
  timestamp: string;
}

export interface SensorData {
  [key: string]: SensorReading;
}

export const getSensorData = async (): Promise<SensorData> => {
  const sensorRef = ref(database, 'sensor_data');
  
  try {
    const snapshot = await get(sensorRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return {};
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    throw error;
  }
};

export const subscribeToSensorData = (callback: (data: SensorData) => void) => {
  const sensorRef = ref(database, 'sensor_data');
  
  return onValue(sensorRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    }
  });
}; 