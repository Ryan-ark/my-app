import { ref, onValue, get, set, push } from 'firebase/database';
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

export const updateWeightData = async (newWeight: number): Promise<string> => {
  try {
    // First get the latest sensor data
    const currentData = await getSensorData();
    const entries = Object.entries(currentData);
    
    if (entries.length === 0) {
      throw new Error('No sensor data available');
    }
    
    // Get the latest entry
    const latestEntry = entries[entries.length - 1][1];
    
    // Create a new entry with updated weight
    const newEntry: SensorReading = {
      ...latestEntry,
      "\"Weight\"": JSON.stringify(newWeight),
      timestamp: new Date().toISOString()
    };
    
    // Add the new entry to Firebase
    const sensorRef = ref(database, 'sensor_data');
    const newEntryRef = push(sensorRef);
    await set(newEntryRef, newEntry);
    
    return newEntryRef.key || '';
  } catch (error) {
    console.error('Error updating weight data:', error);
    throw error;
  }
}; 