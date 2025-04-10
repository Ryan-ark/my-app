'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
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
import { 
  SensorData, 
  getSensorData, 
  subscribeToSensorData
} from '@/app/lib/sensorService';
import { TrendingUp, TrendingDown } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";

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
  const [isMobile, setIsMobile] = useState(false);

  // Helper function to get the latest reading
  const getLatestReading = (data: SensorData) => {
    const entries = Object.entries(data);
    if (entries.length === 0) return null;
    return entries[entries.length - 1][1];
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
      return Object.entries(data).map(entry => ({
        timestamp: new Date(entry[1].timestamp || '').toLocaleTimeString(),
        ec: parseSensorValue(entry[1]['\"EC\"']),
        temperature: parseSensorValue(entry[1]['\"Temperature\"']),
        ph: parseSensorValue(entry[1]['{\"pH\"']),
        do: parseSensorValue(entry[1]['\"DO\"']),
        weight: parseSensorValue(entry[1]['\"Weight\"']) / 1000 // Convert to kilograms
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

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Initial check
    checkIsMobile()
    
    // Add event listener
    window.addEventListener("resize", checkIsMobile)
    
    // Clean up
    return () => window.removeEventListener("resize", checkIsMobile)
  }, [])

  return (
    <>
      <Toaster />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-auto min-h-16 flex-col sm:flex-row shrink-0 items-center gap-2 border-b p-2">
            <div className="flex items-center gap-2 px-2 w-full sm:w-auto">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4 hidden sm:block" />
              <Breadcrumb className="hidden sm:flex">
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
              <span className="sm:hidden font-medium">Dashboard</span>
            </div>
            <div className="flex w-full sm:w-auto justify-between sm:ml-auto sm:pr-4 flex sm:items-center gap-2 sm:gap-4 mt-2 sm:mt-0">
              {lastUpdated && (
                <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap overflow-hidden">
                  Last: {isMobile ? lastUpdated.toLocaleTimeString() : lastUpdated.toLocaleString()}
                </span>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className={`flex items-center gap-1 sm:gap-2 ${isRefreshing ? 'opacity-50' : ''}`}
                >
                  <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {!isMobile && "Refresh"}
                </Button>
              </div>
            </div>
          </header>

          <div className="flex-1 space-y-4 p-2 sm:p-4 pt-4 sm:pt-6 overflow-x-hidden">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" role="alert">
                {error}
              </div>
            )}

            <div className="grid gap-2 sm:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">EC Level</CardTitle>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">Critical: 2.0</span>
                </CardHeader>
                <CardContent className="pt-2">
                  {latestReading ? (
                    <>
                      {renderGauge(parseSensorValue(latestReading['\"EC\"']), 0, 4, 2)}
                      <div className="text-xs sm:text-sm text-center -mt-4">mS/cm</div>
                    </>
                  ) : (
                    <div className="text-lg sm:text-2xl font-bold text-center">N/A</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Temperature</CardTitle>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">Critical: 32°C</span>
                </CardHeader>
                <CardContent className="pt-2">
                  {latestReading ? (
                    <>
                      {renderGauge(parseSensorValue(latestReading['\"Temperature\"']), 20, 40, 32)}
                      <div className="text-xs sm:text-sm text-center -mt-4">°C</div>
                    </>
                  ) : (
                    <div className="text-lg sm:text-2xl font-bold text-center">N/A</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">pH Level</CardTitle>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">Range: 6.5-8.5</span>
                </CardHeader>
                <CardContent className="pt-2">
                  {latestReading ? (
                    <>
                      {renderGauge(parseSensorValue(latestReading['{\"pH\"']), 0, 14, 7, true)}
                      <div className="text-xs sm:text-sm text-center -mt-4">pH</div>
                    </>
                  ) : (
                    <div className="text-lg sm:text-2xl font-bold text-center">N/A</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">DO Level</CardTitle>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">Critical: 5 mg/L</span>
                </CardHeader>
                <CardContent className="pt-2">
                  {latestReading ? (
                    <>
                      {renderGauge(parseSensorValue(latestReading['\"DO\"']), 0, 15, 5, true)}
                      <div className="text-xs sm:text-sm text-center -mt-4">mg/L</div>
                    </>
                  ) : (
                    <div className="text-lg sm:text-2xl font-bold text-center">N/A</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Weight</CardTitle>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">Last Reading</span>
                </CardHeader>
                <CardContent className="pt-2">
                  {latestReading ? (
                    <div className="flex flex-col items-center space-y-1 sm:space-y-2">
                      <div className="flex items-end justify-center gap-1 sm:gap-2">
                        <span className="text-xl sm:text-3xl font-bold">
                          {(parseSensorValue(latestReading['\"Weight\"']) / 1000).toFixed(3)}
                        </span>
                        <span className="text-xs sm:text-sm mb-0.5 sm:mb-1">kg</span>
                      </div>
                      {weightTrend && (
                        <div className={`flex items-center gap-1 text-xs sm:text-sm ${
                          weightTrend.direction === 'up' 
                            ? 'text-green-500' 
                            : 'text-red-500'
                        }`}>
                          {weightTrend.direction === 'up' ? (
                            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                          ) : (
                            <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />
                          )}
                          <span>{(parseFloat(weightTrend.difference) / 1000).toFixed(3)}kg</span>
                          <span className="text-muted-foreground text-[10px] sm:text-xs">
                            {weightTrend.direction === 'up' ? 'increase' : 'decrease'}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-lg sm:text-2xl font-bold text-center">N/A</div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-2 sm:gap-4 grid-cols-1 md:grid-cols-2">
              <Card>
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-sm sm:text-base">EC Level Trend</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px] sm:h-[250px] md:h-[300px] p-0 sm:p-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="ecGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" tick={{fontSize: isMobile ? 10 : 12}} />
                      <YAxis tick={{fontSize: isMobile ? 10 : 12}} />
                      <RechartsTooltip />
                      <ReferenceLine y={2.0} stroke="red" strokeDasharray="3 3" 
                        label={isMobile ? {} : { value: 'Critical (2.0)', position: 'right', fill: 'red', fontSize: 10 }} />
                      <Area type="monotone" dataKey="ec" stroke="#0ea5e9" fillOpacity={1} fill="url(#ecGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-sm sm:text-base">Temperature Trend</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px] sm:h-[250px] md:h-[300px] p-0 sm:p-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" tick={{fontSize: isMobile ? 10 : 12}} />
                      <YAxis tick={{fontSize: isMobile ? 10 : 12}} />
                      <RechartsTooltip />
                      <ReferenceLine y={32} stroke="red" strokeDasharray="3 3" 
                        label={isMobile ? {} : { value: 'Critical (32°C)', position: 'right', fill: 'red', fontSize: 10 }} />
                      <Area type="monotone" dataKey="temperature" stroke="#f97316" fillOpacity={1} fill="url(#tempGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-sm sm:text-base">DO Level Trend</CardTitle>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="h-2 w-2 sm:h-3 sm:w-3 block bg-red-500"></span>
                      <span className="text-[10px] sm:text-xs">Critical (5 mg/L)</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="h-[200px] sm:h-[250px] md:h-[300px] p-0 sm:p-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart 
                      data={chartData}
                      margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="doGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" tick={{fontSize: isMobile ? 10 : 12}} />
                      <YAxis domain={[0, 15]} tick={{fontSize: isMobile ? 10 : 12}} />
                      <RechartsTooltip />
                      <ReferenceLine 
                        y={5} 
                        stroke="red" 
                        strokeDasharray="3 3" 
                        label={isMobile ? {} : { 
                          value: 'Critical (5 mg/L)', 
                          position: 'insideBottomRight',
                          fill: 'red',
                          fontSize: 10
                        }} 
                      />
                      <Area type="monotone" dataKey="do" stroke="#6366f1" fillOpacity={1} fill="url(#doGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-sm sm:text-base">Weight Trend</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px] sm:h-[250px] md:h-[300px] p-0 sm:p-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart 
                      data={chartData}
                      margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" tick={{fontSize: isMobile ? 10 : 12}} />
                      <YAxis tick={{fontSize: isMobile ? 10 : 12}} />
                      <RechartsTooltip formatter={(value: number) => [`${value.toFixed(3)} kg`, 'Weight']} />
                      <Area type="monotone" dataKey="weight" stroke="#a855f7" fillOpacity={1} fill="url(#weightGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-sm sm:text-base">pH Level Trend</CardTitle>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="h-2 w-2 sm:h-3 sm:w-3 block bg-red-500"></span>
                      <span className="text-[10px] sm:text-xs">Critical (6.5 - 8.5)</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="h-[200px] sm:h-[250px] md:h-[300px] p-0 sm:p-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={chartData}
                      margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" tick={{fontSize: isMobile ? 10 : 12}} />
                      <YAxis domain={[5, 15]} tick={{fontSize: isMobile ? 10 : 12}} />
                      <RechartsTooltip />
                      <ReferenceLine 
                        y={8.5} 
                        stroke="red" 
                        strokeDasharray="3 3" 
                        label={isMobile ? {} : { 
                          value: 'Upper (8.5)', 
                          position: 'insideTopRight',
                          fill: 'red',
                          fontSize: 10
                        }} 
                      />
                      <ReferenceLine 
                        y={6.5} 
                        stroke="red" 
                        strokeDasharray="3 3" 
                        label={isMobile ? {} : { 
                          value: 'Lower (6.5)', 
                          position: 'insideBottomRight',
                          fill: 'red',
                          fontSize: 10
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="ph" 
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={{ r: isMobile ? 2 : 4 }}
                        activeDot={{ r: isMobile ? 4 : 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
