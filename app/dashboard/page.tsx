'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { SensorData, getSensorData, subscribeToSensorData } from '@/app/lib/sensorService';
import { saveSensorReading, getLatestReadings, SensorReadingData } from '@/app/lib/sensorDbService';

export default function Dashboard() {
  const [sensorData, setSensorData] = useState<SensorData>({});
  const [historicalData, setHistoricalData] = useState<SensorReadingData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch historical data
  const fetchHistoricalData = useCallback(async () => {
    try {
      const readings = await getLatestReadings();
      setHistoricalData(readings);
    } catch (err) {
      console.error('Error fetching historical data:', err);
      setError('Failed to fetch historical data');
    }
  }, []);

  // Save current reading to database
  const saveCurrentReading = useCallback(async (data: SensorData) => {
    try {
      await saveSensorReading({
        ...data,
        timestamp: new Date(),
      });
      await fetchHistoricalData();
    } catch (err) {
      console.error('Error saving reading:', err);
    }
  }, [fetchHistoricalData]);

  useEffect(() => {
    let isSubscribed = true;

    const fetchData = async () => {
      try {
        const data = await getSensorData();
        if (isSubscribed) {
          setSensorData(data);
          setLastUpdated(new Date());
          await saveCurrentReading(data);
        }
      } catch (err) {
        if (isSubscribed) {
          setError(err instanceof Error ? err.message : 'Failed to fetch data');
        }
      }
    };

    fetchData();
    fetchHistoricalData();

    const unsubscribe = subscribeToSensorData((data) => {
      if (isSubscribed) {
        setSensorData(data);
        setLastUpdated(new Date());
        saveCurrentReading(data);
      }
    });

    const saveInterval = setInterval(() => {
      setSensorData(currentData => {
        saveCurrentReading(currentData);
        return currentData;
      });
    }, 120000);

    return () => {
      isSubscribed = false;
      unsubscribe();
      clearInterval(saveInterval);
    };
  }, [fetchHistoricalData, saveCurrentReading]);

  const formatChartData = (data: SensorReadingData[]) => {
    return data.map(reading => ({
      ...reading,
      timestamp: new Date(reading.timestamp!).toLocaleTimeString(),
    })).reverse();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await getSensorData();
      setSensorData(data);
      setLastUpdated(new Date());
      await saveCurrentReading(data);
      await fetchHistoricalData();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#">Sensor Monitoring</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto pr-4 flex items-center gap-4">
            {lastUpdated && (
              <span className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleString()}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`flex items-center gap-2 ${isRefreshing ? 'opacity-50' : ''}`}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </header>

        <div className="flex-1 space-y-4 p-4 pt-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" role="alert">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">EC Level</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sensorData.ec?.toFixed(2) || 'N/A'} mS/cm</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Temperature</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sensorData.temperature?.toFixed(1) || 'N/A'} °C</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">pH Level</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sensorData.ph?.toFixed(2) || 'N/A'}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>EC Level Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={formatChartData(historicalData)}>
                    <defs>
                      <linearGradient id="ecGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="ec" stroke="#0ea5e9" fillOpacity={1} fill="url(#ecGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Temperature Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={formatChartData(historicalData)}>
                    <defs>
                      <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="temperature" stroke="#f97316" fillOpacity={1} fill="url(#tempGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>pH Level Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formatChartData(historicalData)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis domain={[6, 8]} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="ph" 
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
