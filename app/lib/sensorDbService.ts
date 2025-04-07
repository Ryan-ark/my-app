export interface SensorReadingData {
  id?: string;
  DO?: number | null;
  EC?: number | null;
  Temp?: number | null;
  Weight?: number | null;
  pH?: string | number | null;
  timestamp?: Date;
  createdAt?: Date;
}

interface SensorReadingResponse {
  id: string;
  EC: number | null;
  Temp: number | null;
  pH: string | null;
  DO: number | null;
  Weight: number | null;
  timestamp: string;
  createdAt: string;
}

export const saveSensorReading = async (data: SensorReadingData) => {
  try {
    // Transform the data to match the database schema
    const transformedData = {
      ec: typeof data.EC === 'number' ? data.EC : null,
      temperature: typeof data.Temp === 'number' && data.Temp !== -127 ? data.Temp : null,
      ph: data.pH !== undefined ? String(data.pH) : null,
      do: typeof data.DO === 'number' ? data.DO : null,
      weight: typeof data.Weight === 'number' ? data.Weight : 0,
      timestamp: data.timestamp || new Date(),
    };

    const response = await fetch('/api/sensor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transformedData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save sensor reading');
    }

    const savedData = await response.json();
    
    // Transform the response back to match our application's data structure
    return {
      id: savedData.id,
      EC: savedData.EC,
      Temp: savedData.Temp,
      pH: savedData.pH,
      DO: savedData.DO,
      Weight: savedData.Weight ?? 0,
      timestamp: savedData.timestamp ? new Date(savedData.timestamp) : undefined,
      createdAt: savedData.createdAt ? new Date(savedData.createdAt) : undefined,
    };
  } catch (error) {
    console.error('Error saving sensor reading:', error);
    throw error;
  }
};

export const getLatestReadings = async () => {
  try {
    const response = await fetch('/api/sensor');
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch sensor readings');
    }

    const data = await response.json();
    
    // Transform the data to match our application's structure
    return data.map((reading: SensorReadingResponse) => ({
      id: reading.id,
      EC: reading.EC,
      Temp: reading.Temp,
      pH: reading.pH,
      DO: reading.DO,
      Weight: reading.Weight ?? 0,
      timestamp: reading.timestamp ? new Date(reading.timestamp) : undefined,
      createdAt: reading.createdAt ? new Date(reading.createdAt) : undefined,
    }));
  } catch (error) {
    console.error('Error fetching sensor readings:', error);
    throw error;
  }
}; 