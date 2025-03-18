export interface SensorReadingData {
  id?: string;
  ec?: number | null;
  temperature?: number | null;
  ph?: number | null;
  timestamp?: Date;
  createdAt?: Date;
}

export const saveSensorReading = async (data: SensorReadingData) => {
  try {
    const response = await fetch('/api/sensor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to save sensor reading');
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving sensor reading:', error);
    throw error;
  }
};

export const getLatestReadings = async () => {
  try {
    const response = await fetch('/api/sensor');
    
    if (!response.ok) {
      throw new Error('Failed to fetch sensor readings');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching sensor readings:', error);
    throw error;
  }
}; 