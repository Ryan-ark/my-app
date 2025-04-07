'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { RefreshCw, Send, Brain, Database, Sparkles, Lightbulb, ChevronRight } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Message,
  getChatCompletion,
  getFishGrowthForecast,
  getWaterQualityPredictions,
  getFeedingOptimizationTips,
  ForecastData
} from '../lib/groqService';
import { getSensorData, subscribeToSensorData, SensorData } from '../lib/sensorService';

interface FeedingTip {
  title: string;
  description: string;
  impact: string;
}

export default function AiAssistant() {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [sensorData, setSensorData] = useState<SensorData>({});
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: 'You are an AI assistant for an aquaponic fish feeding system. Provide helpful, accurate information about fish feeding, water quality, and system maintenance. Be concise and informative.'
    },
    {
      role: 'assistant',
      content: 'Hello! I\'m your Aqua Intelligence assistant. How can I help with your fish feeding system today?'
    }
  ]);
  const [growthForecast, setGrowthForecast] = useState<ForecastData[]>([]);
  const [waterQualityPredictions, setWaterQualityPredictions] = useState<ForecastData[]>([]);
  const [feedingTips, setFeedingTips] = useState<FeedingTip[]>([]);
  const [isLoadingGrowth, setIsLoadingGrowth] = useState(false);
  const [isLoadingWaterQuality, setIsLoadingWaterQuality] = useState(false);
  const [isLoadingTips, setIsLoadingTips] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Mobile detection
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Initial data loading
  useEffect(() => {
    loadForecastData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Firebase sensor data subscription
  useEffect(() => {
    let isSubscribed = true;
    
    // Initial fetch
    const fetchSensorData = async () => {
      try {
        const data = await getSensorData();
        if (isSubscribed) {
          setSensorData(data);
        }
      } catch (error) {
        console.error('Error fetching sensor data:', error);
      }
    };
    
    fetchSensorData();
    
    // Subscribe to real-time updates
    const unsubscribe = subscribeToSensorData((data) => {
      if (isSubscribed) {
        setSensorData(data);
      }
    });
    
    // Cleanup function
    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, []);

  const loadForecastData = async () => {
    try {
      // Load growth forecast
      setIsLoadingGrowth(true);
      const growthData = await getFishGrowthForecast();
      setGrowthForecast(growthData);
      setIsLoadingGrowth(false);
      
      // Load water quality predictions
      setIsLoadingWaterQuality(true);
      const waterQualityData = await getWaterQualityPredictions();
      setWaterQualityPredictions(waterQualityData);
      setIsLoadingWaterQuality(false);
      
      // Load feeding tips
      setIsLoadingTips(true);
      const tipsData = await getFeedingOptimizationTips();
      setFeedingTips(tipsData);
      setIsLoadingTips(false);
    } catch (error) {
      console.error('Error loading forecast data:', error);
      toast({
        title: "Error loading predictions",
        description: "Failed to load AI predictions. Please try again later.",
        variant: "destructive"
      });
      setIsLoadingGrowth(false);
      setIsLoadingWaterQuality(false);
      setIsLoadingTips(false);
    }
  };

  const handleRefresh = async () => {
    await loadForecastData();
    toast({
      title: "Data refreshed",
      description: "All AI predictions have been updated.",
      duration: 3000
    });
  };

  // Function to format sensor data for inclusion with messages
  const getLatestSensorReading = () => {
    const keys = Object.keys(sensorData);
    if (keys.length === 0) return null;
    
    // Get the latest key (Firebase keys are timestamps)
    const latestKey = keys[keys.length - 1];
    return sensorData[latestKey];
  };

  // Function to process response content and hide <think> tags
  const processResponseContent = (content: string) => {
    // Remove <think> sections (and everything inside them)
    return content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    
    // Get latest sensor data
    const latestSensorReading = getLatestSensorReading();
    
    // Create context with sensor data
    let sensorContext = '';
    if (latestSensorReading) {
      sensorContext = `\nCurrent sensor readings: 
      - Temperature: ${latestSensorReading['\"Temperature\"'] || 'N/A'} °C
      - pH: ${latestSensorReading['{\"pH\"'] || 'N/A'}
      - DO: ${latestSensorReading['\"DO\"'] || 'N/A'} mg/L
      - EC: ${latestSensorReading['\"EC\"'] || 'N/A'} mS/cm
      - Weight: ${latestSensorReading['\"Weight\"']?.replace('}', '') || 'N/A'} g
      - Timestamp: ${latestSensorReading.timestamp ? new Date(latestSensorReading.timestamp).toLocaleString() : 'N/A'}`;
    }
    
    // Create user message with sensor data for API, but without sensor data for UI
    const userMessageForUI: Message = {
      role: 'user',
      content: userInput  // Only show user input in UI
    };
    
    const userMessageWithSensorData: Message = {
      role: 'user',
      content: userInput + (sensorContext ? sensorContext : '')
    };
    
    // Update UI messages with user input (without showing sensor data in the UI)
    setMessages(prevMessages => [...prevMessages, userMessageForUI]);
    setUserInput('');
    setIsLoading(true);
    
    try {
      // Create currentMessages with the sensor data for the API
      const currentMessages = [...messages, userMessageWithSensorData];
      
      // Get AI response
      const response = await getChatCompletion(currentMessages);
      
      // Process response to remove <think> tags
      const processedResponse = processResponseContent(response);
      
      // Update messages with AI response
      setMessages(prevMessages => [
        ...prevMessages,
        {
          role: 'assistant',
          content: processedResponse
        }
      ]);
    } catch (error) {
      console.error('Error getting chat response:', error);
      toast({
        title: "Error",
        description: "Failed to get response from AI. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
                    <BreadcrumbLink href="#">AI Assistant</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Aqua Intelligence</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <span className="sm:hidden font-medium">Aqua Intelligence</span>
            </div>
            <div className="flex w-full sm:w-auto justify-end sm:ml-auto sm:pr-4 flex items-center gap-2 sm:gap-4 mt-2 sm:mt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoadingGrowth || isLoadingWaterQuality || isLoadingTips}
                className="flex items-center gap-1 sm:gap-2"
              >
                <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isLoadingGrowth || isLoadingWaterQuality || isLoadingTips ? 'animate-spin' : ''}`} />
                {!isMobile && "Refresh Predictions"}
              </Button>
            </div>
          </header>

          <div className="flex-1 p-2 sm:p-4 overflow-x-hidden">
            <div className="grid gap-2 sm:gap-4 grid-cols-1 lg:grid-cols-2 mb-4">
              <div className="col-span-full lg:col-span-1">
                <Card className="h-full">
                  <CardHeader className="p-3 sm:p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-5 w-5 text-indigo-500" />
                      <CardTitle className="text-base sm:text-lg">AI Assistant</CardTitle>
                    </div>
                    <CardDescription>
                      Ask questions about fish feeding, water quality, or system maintenance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 py-0">
                    <ScrollArea 
                      ref={chatContainerRef} 
                      className="h-[400px] pr-4"
                    >
                      <div className="flex flex-col gap-4">
                        {messages.slice(1).map((message, index) => (
                          <div
                            key={index}
                            className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                          >
                            <div className={`flex ${message.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'} items-start gap-2 max-w-[80%]`}>
                              <Avatar className={`h-8 w-8 ${message.role === 'assistant' ? '' : 'mt-2'}`}>
                                {message.role === 'assistant' ? (
                                  <>
                                    <AvatarImage src="/avatars/ai-assistant.png" />
                                    <AvatarFallback className="bg-indigo-100 text-indigo-600">AI</AvatarFallback>
                                  </>
                                ) : (
                                  <>
                                    <AvatarImage src="/avatars/admin.jpg" />
                                    <AvatarFallback className="bg-blue-100 text-blue-600">U</AvatarFallback>
                                  </>
                                )}
                              </Avatar>
                              <div
                                className={`rounded-lg px-3 py-2 text-sm ${
                                  message.role === 'assistant'
                                    ? 'bg-secondary text-secondary-foreground'
                                    : 'bg-primary text-primary-foreground'
                                }`}
                              >
                                {message.content}
                              </div>
                            </div>
                          </div>
                        ))}
                        {isLoading && (
                          <div className="flex justify-start">
                            <div className="flex flex-row items-start gap-2 max-w-[80%]">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src="/avatars/ai-assistant.png" />
                                <AvatarFallback className="bg-indigo-100 text-indigo-600">AI</AvatarFallback>
                              </Avatar>
                              <div className="rounded-lg px-3 py-2 text-sm bg-secondary text-secondary-foreground">
                                <div className="flex space-x-1">
                                  <div className="h-2 w-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                  <div className="h-2 w-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                  <div className="h-2 w-2 bg-current rounded-full animate-bounce"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                  <CardFooter className="p-3 sm:p-6 pt-3">
                    <div className="flex w-full items-center space-x-2">
                      <Textarea
                        placeholder="Ask about fish feeding, water quality..."
                        value={userInput}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setUserInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="min-h-[60px] flex-1"
                        disabled={isLoading}
                      />
                      <Button 
                        size="icon" 
                        onClick={handleSendMessage} 
                        disabled={isLoading || !userInput.trim()}
                      >
                        <Send className="h-4 w-4" />
                        <span className="sr-only">Send</span>
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </div>

              <div className="col-span-full lg:col-span-1">
                <Tabs defaultValue="growth" className="h-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="growth" className="flex items-center gap-1 sm:gap-2">
                      <Brain className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="text-xs sm:text-sm">Growth</span>
                    </TabsTrigger>
                    <TabsTrigger value="water" className="flex items-center gap-1 sm:gap-2">
                      <Database className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="text-xs sm:text-sm">Water Quality</span>
                    </TabsTrigger>
                    <TabsTrigger value="tips" className="flex items-center gap-1 sm:gap-2">
                      <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="text-xs sm:text-sm">Feeding Tips</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Growth Forecast Tab */}
                  <TabsContent value="growth" className="h-[490px] sm:h-[510px]">
                    <Card className="h-full">
                      <CardHeader className="p-3 sm:p-6 pb-2">
                        <CardTitle className="text-sm sm:text-base">Fish Growth Forecast</CardTitle>
                        <CardDescription>AI-predicted growth patterns for the next 7 days</CardDescription>
                      </CardHeader>
                      <CardContent className="px-3 sm:px-6 py-0">
                        {isLoadingGrowth ? (
                          <div className="h-[250px] flex items-center justify-center">
                            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                          </div>
                        ) : growthForecast.length > 0 ? (
                          <>
                            <div className="h-[250px] pt-2">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                  data={growthForecast}
                                  margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="date" tick={{fontSize: isMobile ? 10 : 12}} />
                                  <YAxis tick={{fontSize: isMobile ? 10 : 12}} />
                                  <RechartsTooltip />
                                  <Line
                                    type="monotone"
                                    dataKey="value"
                                    name="Weight (g)"
                                    stroke="#8884d8"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                            
                            <ScrollArea className="h-[160px] pr-4 mt-4">
                              <div className="space-y-2">
                                {growthForecast.map((item, index) => (
                                  <div key={index} className="border rounded-lg p-3">
                                    <div className="flex justify-between items-center mb-1">
                                      <div className="font-medium text-sm">{item.date}</div>
                                      <div className="text-sm bg-primary/10 rounded px-2 py-0.5">
                                        {item.value.toFixed(2)}g
                                      </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground mb-1">{item.prediction}</div>
                                    <div className="flex items-center gap-1 text-xs text-primary">
                                      <ChevronRight className="h-3 w-3" />
                                      <span>{item.suggestion}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </>
                        ) : (
                          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                            No forecast data available
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  {/* Water Quality Tab */}
                  <TabsContent value="water" className="h-[490px] sm:h-[510px]">
                    <Card className="h-full">
                      <CardHeader className="p-3 sm:p-6 pb-2">
                        <CardTitle className="text-sm sm:text-base">Water Quality Predictions</CardTitle>
                        <CardDescription>AI-predicted pH levels for the next 7 days</CardDescription>
                      </CardHeader>
                      <CardContent className="px-3 sm:px-6 py-0">
                        {isLoadingWaterQuality ? (
                          <div className="h-[250px] flex items-center justify-center">
                            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                          </div>
                        ) : waterQualityPredictions.length > 0 ? (
                          <>
                            <div className="h-[250px] pt-2">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={waterQualityPredictions}
                                  margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="date" tick={{fontSize: isMobile ? 10 : 12}} />
                                  <YAxis domain={[6, 8.5]} tick={{fontSize: isMobile ? 10 : 12}} />
                                  <RechartsTooltip />
                                  <Bar 
                                    dataKey="value" 
                                    name="pH Level" 
                                    fill="#82ca9d" 
                                    radius={[4, 4, 0, 0]}
                                  />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                            
                            <ScrollArea className="h-[160px] pr-4 mt-4">
                              <div className="space-y-2">
                                {waterQualityPredictions.map((item, index) => (
                                  <div key={index} className="border rounded-lg p-3">
                                    <div className="flex justify-between items-center mb-1">
                                      <div className="font-medium text-sm">{item.date}</div>
                                      <div className="text-sm bg-emerald-500/10 text-emerald-700 rounded px-2 py-0.5">
                                        pH {item.value.toFixed(1)}
                                      </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground mb-1">{item.prediction}</div>
                                    <div className="flex items-center gap-1 text-xs text-emerald-600">
                                      <ChevronRight className="h-3 w-3" />
                                      <span>{item.suggestion}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </>
                        ) : (
                          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                            No water quality prediction data available
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  {/* Feeding Tips Tab */}
                  <TabsContent value="tips" className="h-[490px] sm:h-[510px]">
                    <Card className="h-full">
                      <CardHeader className="p-3 sm:p-6 pb-2">
                        <CardTitle className="text-sm sm:text-base">Feeding Optimization Tips</CardTitle>
                        <CardDescription>AI-generated tips for optimal fish feeding</CardDescription>
                      </CardHeader>
                      <CardContent className="px-3 sm:px-6 py-0">
                        {isLoadingTips ? (
                          <div className="h-[400px] flex items-center justify-center">
                            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                          </div>
                        ) : feedingTips.length > 0 ? (
                          <ScrollArea className="h-[400px] pr-4">
                            <Accordion type="single" collapsible className="w-full">
                              {feedingTips.map((tip, index) => (
                                <AccordionItem key={index} value={`tip-${index}`}>
                                  <AccordionTrigger className="text-sm hover:no-underline py-3">
                                    <div className="flex items-center gap-2">
                                      <div className="bg-amber-100 text-amber-600 h-6 w-6 rounded-full flex items-center justify-center text-xs">
                                        {index + 1}
                                      </div>
                                      <span>{tip.title}</span>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent className="px-8">
                                    <div className="text-sm space-y-2">
                                      <p>{tip.description}</p>
                                      <div className="bg-muted p-2 rounded-md mt-2">
                                        <Label className="text-xs font-semibold block mb-1">Expected Impact:</Label>
                                        <p className="text-xs">{tip.impact}</p>
                                      </div>
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                            </Accordion>
                          </ScrollArea>
                        ) : (
                          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                            No feeding tips available
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
} 