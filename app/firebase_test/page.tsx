'use client';

import { useEffect, useState, useCallback } from 'react';
import { SensorData, getSensorData, subscribeToSensorData } from '@/app/lib/sensorService';
import { saveSensorReading, getLatestReadings, SensorReadingData } from '@/app/lib/sensorDbService';

export default function FirebaseTest() {
  const [sensorData, setSensorData] = useState<SensorData>({});
  const [historicalData, setHistoricalData] = useState<SensorReadingData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Fetch historical data
  const fetchHistoricalData = useCallback(async () => {
    try {
      const readings = await getLatestReadings();
      setHistoricalData(readings);
    } catch (err) {
      console.error('Error fetching historical data:', err);
    }
  }, []);

  // Save current reading to database
  const saveCurrentReading = useCallback(async (data: SensorData) => {
    try {
      await saveSensorReading({
        ...data,
        timestamp: new Date(),
      });
      setLastSaved(new Date());
      await fetchHistoricalData(); // Refresh historical data
    } catch (err) {
      console.error('Error saving reading:', err);
    }
  }, [fetchHistoricalData]);

  useEffect(() => {
    let isSubscribed = true;

    // Initial data fetch
    const fetchData = async () => {
      try {
        const data = await getSensorData();
        if (isSubscribed) {
          setSensorData(data);
          setLastUpdated(new Date());
          await saveCurrentReading(data); // Save initial reading
        }
      } catch (err) {
        if (isSubscribed) {
          setError(err instanceof Error ? err.message : 'Failed to fetch data');
        }
      }
    };

    fetchData();
    fetchHistoricalData();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToSensorData((data) => {
      if (isSubscribed) {
        setSensorData(data);
        setLastUpdated(new Date());
      }
    });

    // Set up periodic saving (every 2 minutes)
    const saveInterval = setInterval(() => {
      // Use a callback to get the latest state
      setSensorData(currentData => {
        saveCurrentReading(currentData);
        return currentData;
      });
    }, 120000); // 2 minutes in milliseconds

    return () => {
      isSubscribed = false;
      unsubscribe();
      clearInterval(saveInterval);
    };
  }, [fetchHistoricalData, saveCurrentReading]); // Remove sensorData from dependencies

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Real-time Sensor Readings</h2>
        
        <div className="flex gap-4 text-sm text-gray-600 mb-4">
          {lastUpdated && (
            <p>Last updated: {lastUpdated.toLocaleString()}</p>
          )}
          {lastSaved && (
            <p>Last saved to database: {lastSaved.toLocaleString()}</p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            {error}
          </div>
        )}

        <div className="overflow-x-auto mb-8">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parameter
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">EC</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {sensorData.ec ? `${sensorData.ec} mS/cm` : 'N/A'}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Temperature</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {sensorData.temperature ? `${sensorData.temperature} °C` : 'N/A'}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">pH</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {sensorData.ph ? sensorData.ph : 'N/A'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Historical Data</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    EC (mS/cm)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Temperature (°C)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    pH
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {historicalData.map((reading) => (
                  <tr key={reading.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {reading.timestamp ? new Date(reading.timestamp).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {reading.ec ?? 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {reading.temperature ?? 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {reading.ph ?? 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Raw Data:</h3>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
            {JSON.stringify(sensorData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
} 