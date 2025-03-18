'use client';

import { useEffect, useState } from 'react';
import { SensorData, getSensorData, subscribeToSensorData } from '@/app/lib/sensorService';

export default function FirebaseTest() {
  const [sensorData, setSensorData] = useState<SensorData>({});
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    // Initial data fetch
    const fetchData = async () => {
      try {
        const data = await getSensorData();
        setSensorData(data);
        setLastUpdated(new Date());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      }
    };

    fetchData();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToSensorData((data) => {
      setSensorData(data);
      setLastUpdated(new Date());
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Real-time Sensor Readings</h2>
        
        {lastUpdated && (
          <p className="text-sm text-gray-600 mb-4">
            Last updated: {lastUpdated.toLocaleString()}
          </p>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parameter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Raw Data:</h3>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
            {JSON.stringify(sensorData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
} 