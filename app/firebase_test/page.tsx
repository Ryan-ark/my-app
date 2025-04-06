'use client';

import { useEffect, useState } from 'react';
import { getSensorData, subscribeToSensorData, SensorData } from '@/app/lib/sensorService';

export default function FirebaseTest() {
  const [sensorData, setSensorData] = useState<SensorData>({});
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Helper function to get the latest reading
  const getLatestReading = (data: SensorData) => {
    const keys = Object.keys(data);
    if (keys.length === 0) return null;
    
    // Get the latest key (Firebase keys are timestamps, so the last one is the most recent)
    const latestKey = keys[keys.length - 1];
    console.log('Latest key:', latestKey);
    console.log('Latest reading:', data[latestKey]);
    return data[latestKey];
  };

  useEffect(() => {
    let isSubscribed = true;

    // Initial data fetch
    const fetchData = async () => {
      try {
        const data = await getSensorData();
        console.log('Fetched data:', data);
        if (isSubscribed) {
          setSensorData(data);
          setLastUpdated(new Date());
        }
      } catch (err) {
        if (isSubscribed) {
          setError(err instanceof Error ? err.message : 'Failed to fetch data');
        }
      }
    };

    fetchData();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToSensorData((data) => {
      console.log('Real-time update:', data);
      if (isSubscribed) {
        setSensorData(data);
        setLastUpdated(new Date());
      }
    });

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, []);

  const latestReading = getLatestReading(sensorData);

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Real-time Sensor Readings</h2>
        
        <div className="flex gap-4 text-sm text-gray-600 mb-4">
          {lastUpdated && (
            <p>Last updated: {lastUpdated.toLocaleString()}</p>
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
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Timestamp</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {latestReading?.timestamp ? new Date(latestReading.timestamp).toLocaleString() : 'N/A'}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">EC</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {latestReading && latestReading['\"EC\"'] ? `${latestReading['\"EC\"']} mS/cm` : 'N/A'}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Temperature</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {latestReading && latestReading['\"Temperature\"'] ? `${latestReading['\"Temperature\"']} °C` : 'N/A'}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">pH</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {latestReading && latestReading['{\"pH\"'] ? latestReading['{\"pH\"'] : 'N/A'}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">DO</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {latestReading && latestReading['\"DO\"'] ? `${latestReading['\"DO\"']} mg/L` : 'N/A'}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Weight</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {latestReading && latestReading['\"Weight\"'] ? `${latestReading['\"Weight\"'].replace('}', '')} g` : 'N/A'}
                </td>
              </tr>
            </tbody>
          </table>
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