'use client';

import { useEffect, useState } from 'react';
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
  Area,
  ReferenceLine,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis
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
import { TrendingUp, TrendingDown } from "lucide-react";

interface FormattedSensorData {
  timestamp: string;
  ec: number;
  temperature: number;
  ph: number;
  do: number;
  weight: number;
}

export default function Dashboard() {
  const [sensorData, setSensorData] = useState<SensorData>({});
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Helper function to get the latest reading
  const getLatestReading = (data: SensorData) => {
    const keys = Object.keys(data);
    if (keys.length === 0) return null;
    return data[keys[keys.length - 1]];
  };

  // Helper function to parse sensor values
  const parseSensorValue = (value: string | undefined): number => {
    if (!value) return 0;
    try {
      // Remove quotes and braces, then parse as float
      const cleanValue = value.replace(/["\{\}]/g, '').trim();
      return parseFloat(cleanValue) || 0;
    } catch (err) {
      console.error('Error parsing sensor value:', err);
      return 0;
    }
  };

  // Format data for charts
  const formatChartData = (data: SensorData): FormattedSensorData[] => {
    try {
      return Object.entries(data).map(([key, reading]) => ({
        timestamp: new Date(reading.timestamp || '').toLocaleTimeString(),
        ec: parseSensorValue(reading['\"EC\"']),
        temperature: parseSensorValue(reading['\"Temperature\"']),
        ph: parseSensorValue(reading['{\"pH\"']),
        do: parseSensorValue(reading['\"DO\"']),
        weight: parseSensorValue(reading['\"Weight\"'])
      })).slice(-10); // Get last 10 readings
    } catch (err) {
      console.error('Error formatting chart data:', err);
      return [];
    }
  };

  useEffect(() => {
    let isSubscribed = true;

    const fetchData = async () => {
      try {
        const data = await getSensorData();
        console.log('Fetched data:', data); // Debug log
        if (isSubscribed) {
          setSensorData(data);
          setLastUpdated(new Date());
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        if (isSubscribed) {
          setError(err instanceof Error ? err.message : 'Failed to fetch data');
        }
      }
    };

    fetchData();

    const unsubscribe = subscribeToSensorData((data) => {
      console.log('Real-time update:', data); // Debug log
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await getSensorData();
      setSensorData(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Helper function to calculate percentage for gauges
  const calculatePercentage = (value: number, min: number, max: number) => {
    return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  };

  // Helper function to get color based on value and thresholds
  const getColor = (value: number, criticalValue: number, isReverse: boolean = false) => {
    if (isReverse) {
      return value <= criticalValue ? '#ef4444' : '#22c55e';
    }
    return value >= criticalValue ? '#ef4444' : '#22c55e';
  };

  const renderGauge = (value: number, min: number, max: number, criticalValue: number, isReverse: boolean = false) => {
    const percentage = calculatePercentage(value, min, max);
    const data = [{ value: percentage, fill: getColor(value, criticalValue, isReverse) }];

    return (
      <div className="relative" style={{ height: '160px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="65%"
            outerRadius="100%"
            data={data}
            startAngle={180}
            endAngle={0}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              background
              dataKey="value"
              cornerRadius={30}
              fill="#82ca9d"
            />
            <text
              x="50%"
              y="55%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-current font-bold text-2xl"
            >
              {value.toFixed(2)}
            </text>
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const getWeightTrend = (data: SensorData) => {
    const readings = Object.entries(data);
    if (readings.length < 2) return null;
    
    const currentWeight = parseSensorValue(readings[readings.length - 1][1]['\"Weight\"']);
    const previousWeight = parseSensorValue(readings[readings.length - 2][1]['\"Weight\"']);
    
    if (currentWeight === previousWeight) return null;
    return {
      direction: currentWeight > previousWeight ? 'up' : 'down',
      difference: Math.abs(currentWeight - previousWeight).toFixed(2)
    };
  };

  const latestReading = getLatestReading(sensorData);
  const chartData = formatChartData(sensorData);
  const weightTrend = getWeightTrend(sensorData);

  // Debug logs
  console.log('Latest reading:', latestReading);
  console.log('Chart data:', chartData);

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

          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">EC Level</CardTitle>
                <span className="text-xs text-muted-foreground">Critical: 2.0 mS/cm</span>
              </CardHeader>
              <CardContent className="pt-2">
                {latestReading ? (
                  <>
                    {renderGauge(parseSensorValue(latestReading['\"EC\"']), 0, 4, 2)}
                    <div className="text-sm text-center -mt-4">mS/cm</div>
                  </>
                ) : (
                  <div className="text-2xl font-bold text-center">N/A</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Temperature</CardTitle>
                <span className="text-xs text-muted-foreground">Critical: 32°C</span>
              </CardHeader>
              <CardContent className="pt-2">
                {latestReading ? (
                  <>
                    {renderGauge(parseSensorValue(latestReading['\"Temperature\"']), 20, 40, 32)}
                    <div className="text-sm text-center -mt-4">°C</div>
                  </>
                ) : (
                  <div className="text-2xl font-bold text-center">N/A</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">pH Level</CardTitle>
                <span className="text-xs text-muted-foreground">Range: 6.5 - 8.5</span>
              </CardHeader>
              <CardContent className="pt-2">
                {latestReading ? (
                  <>
                    {renderGauge(parseSensorValue(latestReading['{\"pH\"']), 0, 14, 7, true)}
                    <div className="text-sm text-center -mt-4">pH</div>
                  </>
                ) : (
                  <div className="text-2xl font-bold text-center">N/A</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">DO Level</CardTitle>
                <span className="text-xs text-muted-foreground">Critical: 5 mg/L</span>
              </CardHeader>
              <CardContent className="pt-2">
                {latestReading ? (
                  <>
                    {renderGauge(parseSensorValue(latestReading['\"DO\"']), 0, 15, 5, true)}
                    <div className="text-sm text-center -mt-4">mg/L</div>
                  </>
                ) : (
                  <div className="text-2xl font-bold text-center">N/A</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Weight</CardTitle>
                <span className="text-xs text-muted-foreground">Last Reading</span>
              </CardHeader>
              <CardContent className="pt-2">
                {latestReading ? (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="flex items-end justify-center gap-2">
                      <span className="text-3xl font-bold">
                        {parseSensorValue(latestReading['\"Weight\"']).toFixed(2)}
                      </span>
                      <span className="text-sm mb-1">g</span>
                    </div>
                    {weightTrend && (
                      <div className={`flex items-center gap-1 text-sm ${
                        weightTrend.direction === 'up' 
                          ? 'text-green-500' 
                          : 'text-red-500'
                      }`}>
                        {weightTrend.direction === 'up' ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        <span>{weightTrend.difference}g</span>
                        <span className="text-muted-foreground text-xs">
                          {weightTrend.direction === 'up' ? 'increase' : 'decrease'}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-center">N/A</div>
                )}
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
                  <AreaChart data={chartData}>
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
                    <ReferenceLine y={2.0} stroke="red" strokeDasharray="3 3" label={{ value: 'Critical Level (2.0)', position: 'right', fill: 'red' }} />
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
                  <AreaChart data={chartData}>
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
                    <ReferenceLine y={32} stroke="red" strokeDasharray="3 3" label={{ value: 'Critical Level (32°C)', position: 'right', fill: 'red' }} />
                    <Area type="monotone" dataKey="temperature" stroke="#f97316" fillOpacity={1} fill="url(#tempGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>DO Level Trend</CardTitle>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 block bg-red-500"></span>
                    <span>Critical Level (5 mg/L)</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="doGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis domain={[0, 15]} />
                    <Tooltip />
                    <ReferenceLine 
                      y={5} 
                      stroke="red" 
                      strokeDasharray="3 3" 
                      label={{ 
                        value: 'Critical Level (5 mg/L)', 
                        position: 'insideBottomRight',
                        fill: 'red',
                        fontSize: 12
                      }} 
                    />
                    <Area type="monotone" dataKey="do" stroke="#6366f1" fillOpacity={1} fill="url(#doGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weight Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="weight" stroke="#a855f7" fillOpacity={1} fill="url(#weightGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>pH Level Trend</CardTitle>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 block bg-red-500"></span>
                    <span>Critical Range (6.5 - 8.5)</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis domain={[5, 15]} />
                    <Tooltip />
                    <ReferenceLine 
                      y={8.5} 
                      stroke="red" 
                      strokeDasharray="3 3" 
                      label={{ 
                        value: 'Upper Critical (8.5)', 
                        position: 'insideTopRight',
                        fill: 'red',
                        fontSize: 12
                      }} 
                    />
                    <ReferenceLine 
                      y={6.5} 
                      stroke="red" 
                      strokeDasharray="3 3" 
                      label={{ 
                        value: 'Lower Critical (6.5)', 
                        position: 'insideBottomRight',
                        fill: 'red',
                        fontSize: 12
                      }} 
                    />
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
