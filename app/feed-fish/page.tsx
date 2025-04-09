'use client';

import { useEffect, useState } from 'react';
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks, isBefore } from 'date-fns';
import { Calendar as CalendarIcon, PlusCircle, Edit, Trash2, Fish, AlertCircle, CheckCircle, RotateCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  getFeedingSchedules,
  createFeedingSchedule,
  updateFeedingSchedule,
  deleteFeedingSchedule,
  FeedingScheduleData
} from '../lib/feedingService';

// Feed types with icons and colors
const FEED_TYPES = [
  { value: 'standard', label: 'Standard Feed', color: 'bg-blue-100 text-blue-700' },
  { value: 'high-protein', label: 'High Protein', color: 'bg-green-100 text-green-700' },
  { value: 'growth-formula', label: 'Growth Formula', color: 'bg-purple-100 text-purple-700' },
  { value: 'vitamins', label: 'Vitamin Supplement', color: 'bg-amber-100 text-amber-700' },
  { value: 'special', label: 'Special Mix', color: 'bg-pink-100 text-pink-700' },
];

// Status badges and colors
const STATUS_BADGES = {
  scheduled: { color: 'bg-blue-100 text-blue-700', label: 'Scheduled' },
  completed: { color: 'bg-green-100 text-green-700', label: 'Completed' },
  cancelled: { color: 'bg-red-100 text-red-700', label: 'Cancelled' },
};

// Days of the week
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Default form state
const defaultScheduleForm = {
  name: '',
  description: '',
  feedAmount: 0,
  feedType: 'standard',
  scheduledAt: new Date(),
  isRecurring: false,
  recurringDays: [],
  status: 'scheduled',
};

export default function FeedFish() {
  const [isMobile, setIsMobile] = useState(false);
  const [schedules, setSchedules] = useState<FeedingScheduleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [showDialog, setShowDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState<FeedingScheduleData>(defaultScheduleForm);
  const [activeTab, setActiveTab] = useState('calendar');
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

  // Load feeding schedules
  useEffect(() => {
    loadSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const data = await getFeedingSchedules();
      setSchedules(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading schedules:', error);
      toast({
        title: "Error loading schedules",
        description: "Failed to load feeding schedules. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'feedAmount') {
      // Ensure feedAmount is a number
      setCurrentSchedule(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setCurrentSchedule(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setCurrentSchedule(prev => ({ ...prev, [name]: checked }));
  };

  // Handle recurring days changes
  const handleDayChange = (dayIndex: number) => {
    const newRecurringDays = [...currentSchedule.recurringDays];
    
    if (newRecurringDays.includes(dayIndex)) {
      // Remove day if already selected
      const index = newRecurringDays.indexOf(dayIndex);
      newRecurringDays.splice(index, 1);
    } else {
      // Add day if not selected
      newRecurringDays.push(dayIndex);
    }
    
    setCurrentSchedule(prev => ({
      ...prev,
      recurringDays: newRecurringDays
    }));
  };

  // Handle scheduled date/time changes
  const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'date') {
      // Update date but keep time
      const newDate = new Date(value);
      const oldDate = currentSchedule.scheduledAt;
      
      newDate.setHours(oldDate.getHours(), oldDate.getMinutes());
      setCurrentSchedule(prev => ({ ...prev, scheduledAt: newDate }));
    } else if (name === 'time') {
      // Update time but keep date
      const [hours, minutes] = value.split(':').map(Number);
      const newDate = new Date(currentSchedule.scheduledAt);
      
      newDate.setHours(hours, minutes);
      setCurrentSchedule(prev => ({ ...prev, scheduledAt: newDate }));
    }
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isEditing && currentSchedule.id) {
        // Update existing schedule
        await updateFeedingSchedule(currentSchedule.id, currentSchedule);
        toast({
          title: "Schedule updated",
          description: "Feeding schedule updated successfully.",
        });
      } else {
        // Create new schedule
        await createFeedingSchedule(currentSchedule);
        toast({
          title: "Schedule created",
          description: "New feeding schedule created successfully.",
        });
      }
      
      // Reload schedules and close dialog
      await loadSchedules();
      setShowDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast({
        title: "Error",
        description: "Failed to save feeding schedule. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this feeding schedule?')) {
      return;
    }
    
    try {
      await deleteFeedingSchedule(id);
      toast({
        title: "Schedule deleted",
        description: "Feeding schedule deleted successfully.",
      });
      await loadSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast({
        title: "Error",
        description: "Failed to delete feeding schedule. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle mark as completed
  const handleMarkAsCompleted = async (id: string) => {
    try {
      await updateFeedingSchedule(id, { status: 'completed' });
      toast({
        title: "Status updated",
        description: "Feeding schedule marked as completed.",
      });
      await loadSchedules();
    } catch (error) {
      console.error('Error updating schedule status:', error);
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Open dialog for new schedule
  const openNewScheduleDialog = () => {
    setIsEditing(false);
    setCurrentSchedule({
      ...defaultScheduleForm,
      scheduledAt: new Date()
    });
    setShowDialog(true);
  };

  // Open dialog for editing
  const openEditDialog = (schedule: FeedingScheduleData) => {
    setIsEditing(true);
    setCurrentSchedule(schedule);
    setShowDialog(true);
  };

  // Reset form
  const resetForm = () => {
    setCurrentSchedule(defaultScheduleForm);
    setIsEditing(false);
  };

  // Get unique dates in the current week that have schedules
  const getSchedulesForDay = (date: Date) => {
    return schedules.filter(schedule => 
      isSameDay(schedule.scheduledAt, date) ||
      (schedule.isRecurring && schedule.recurringDays.includes(date.getDay()))
    );
  };

  // Get all upcoming schedules
  const upcomingSchedules = schedules
    .filter(schedule => schedule.status === 'scheduled')
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());

  // Navigate week
  const goToNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  const goToPreviousWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  // Format date range for display
  const formattedDateRange = () => {
    const endOfWeek = addDays(currentWeekStart, 6);
    return `${format(currentWeekStart, 'MMM d')} - ${format(endOfWeek, 'MMM d, yyyy')}`;
  };

  // Generate the 7 days of the current week
  const weekDays = [...Array(7)].map((_, i) => addDays(currentWeekStart, i));

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
                    <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Feed Fish</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <span className="sm:hidden font-medium">Feed Fish</span>
            </div>
            <div className="flex w-full sm:w-auto justify-end sm:ml-auto sm:pr-4 flex items-center gap-2 sm:gap-4 mt-2 sm:mt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={loadSchedules}
                disabled={loading}
                className="flex items-center gap-1 sm:gap-2"
              >
                <RotateCw className={`h-3 w-3 sm:h-4 sm:w-4 ${loading ? 'animate-spin' : ''}`} />
                {!isMobile && "Refresh"}
              </Button>
              <Button
                onClick={openNewScheduleDialog}
                size="sm"
                className="flex items-center gap-1 sm:gap-2"
              >
                <PlusCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                {isMobile ? "Add" : "Add Feeding Schedule"}
              </Button>
            </div>
          </header>

          <div className="flex-1 p-2 sm:p-4 overflow-x-hidden">
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="space-y-4"
            >
              <TabsList>
                <TabsTrigger value="calendar" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Calendar View</span>
                </TabsTrigger>
                <TabsTrigger value="list" className="flex items-center gap-2">
                  <Fish className="h-4 w-4" />
                  <span>Upcoming Feedings</span>
                </TabsTrigger>
              </TabsList>
              
              {/* Calendar View */}
              <TabsContent value="calendar" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">{formattedDateRange()}</h2>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToNextWeek}>
                      Next
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-7 gap-2 my-4">
                  {/* Day headers */}
                  {weekDays.map((day, index) => (
                    <div key={`header-${index}`} className="text-center font-medium text-sm p-1">
                      {format(day, 'EEE')}
                      <div className="text-xs text-muted-foreground">{format(day, 'd')}</div>
                    </div>
                  ))}
                  
                  {/* Calendar cells */}
                  {weekDays.map((day, index) => {
                    const daySchedules = getSchedulesForDay(day);
                    const isPastDay = isBefore(day, new Date().setHours(0, 0, 0, 0));
                    
                    return (
                      <Card 
                        key={`day-${index}`} 
                        className={`min-h-[120px] sm:min-h-[180px] ${isPastDay ? 'bg-muted/20' : ''}`}
                      >
                        <CardContent className="p-2">
                          <ScrollArea className="h-[100px] sm:h-[160px]">
                            {daySchedules.length > 0 ? (
                              <div className="space-y-2">
                                {daySchedules.map((schedule) => (
                                  <div 
                                    key={schedule.id}
                                    className={`
                                      border rounded-md p-2 text-xs cursor-pointer hover:bg-accent
                                      ${schedule.status === 'completed' ? 'border-green-200 bg-green-50' : ''}
                                      ${schedule.status === 'cancelled' ? 'border-red-200 bg-red-50' : ''}
                                    `}
                                    onClick={() => openEditDialog(schedule)}
                                  >
                                    <div className="font-medium truncate">{schedule.name}</div>
                                    <div className="flex justify-between items-center mt-1">
                                      <div className="text-muted-foreground">
                                        {format(schedule.scheduledAt, 'h:mm a')}
                                      </div>
                                      <Badge variant="outline" className={getFeedTypeColor(schedule.feedType)}>
                                        {schedule.feedAmount}g
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="h-full flex flex-col justify-center items-center text-xs text-muted-foreground">
                                {isPastDay ? (
                                  <span>Past day</span>
                                ) : (
                                  <>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="h-10 w-10 rounded-full p-0"
                                      onClick={() => {
                                        const newDate = new Date(day);
                                        newDate.setHours(12, 0, 0);
                                        setCurrentSchedule({
                                          ...defaultScheduleForm,
                                          scheduledAt: newDate
                                        });
                                        setShowDialog(true);
                                      }}
                                    >
                                      <PlusCircle className="h-5 w-5" />
                                      <span className="sr-only">Add schedule</span>
                                    </Button>
                                    <span className="mt-1">No feedings</span>
                                  </>
                                )}
                              </div>
                            )}
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
              
              {/* List View */}
              <TabsContent value="list">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Upcoming Feeding Schedules</CardTitle>
                    <CardDescription>
                      Manage and track all your scheduled fish feedings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex justify-center py-10">
                        <RotateCw className="h-10 w-10 animate-spin text-muted-foreground" />
                      </div>
                    ) : upcomingSchedules.length > 0 ? (
                      <ScrollArea className="h-[500px] pr-4">
                        <div className="space-y-3">
                          {upcomingSchedules.map((schedule) => (
                            <Card key={schedule.id} className="border border-border">
                              <CardHeader className="p-4 pb-2">
                                <div className="flex justify-between items-start">
                                  <CardTitle className="text-base">{schedule.name}</CardTitle>
                                  <Badge 
                                    className={
                                      STATUS_BADGES[schedule.status as keyof typeof STATUS_BADGES]?.color || 
                                      'bg-gray-100 text-gray-800'
                                    }
                                  >
                                    {STATUS_BADGES[schedule.status as keyof typeof STATUS_BADGES]?.label || schedule.status}
                                  </Badge>
                                </div>
                                <CardDescription>
                                  {format(schedule.scheduledAt, 'EEEE, MMMM d, yyyy')} at {format(schedule.scheduledAt, 'h:mm a')}
                                  {schedule.isRecurring && (
                                    <span className="ml-2 text-xs font-medium text-amber-600">(Recurring)</span>
                                  )}
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="p-4 pt-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <Fish className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm">
                                        <Badge className={getFeedTypeColor(schedule.feedType)}>
                                          {getFeedTypeLabel(schedule.feedType)}
                                        </Badge>
                                        <span className="ml-2 font-semibold">{schedule.feedAmount}g</span>
                                      </span>
                                    </div>
                                    {schedule.description && (
                                      <p className="text-sm text-muted-foreground mt-2">
                                        {schedule.description}
                                      </p>
                                    )}
                                  </div>
                                  {schedule.isRecurring && (
                                    <div>
                                      <div className="text-sm text-muted-foreground mb-1">Repeats on:</div>
                                      <div className="flex flex-wrap gap-1">
                                        {schedule.recurringDays.map((day) => (
                                          <Badge key={day} variant="outline">
                                            {DAYS[day].substring(0, 3)}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                              <CardFooter className="p-4 pt-0 flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleMarkAsCompleted(schedule.id!)}
                                  className="text-green-700"
                                >
                                  <CheckCircle className="mr-1 h-4 w-4" />
                                  Complete
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(schedule)}
                                >
                                  <Edit className="mr-1 h-4 w-4" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(schedule.id!)}
                                  className="text-red-700"
                                >
                                  <Trash2 className="mr-1 h-4 w-4" />
                                  Delete
                                </Button>
                              </CardFooter>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="py-12 text-center">
                        <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                        <h3 className="text-lg font-medium mb-1">No Upcoming Feedings</h3>
                        <p className="text-muted-foreground mb-4">
                          You don{"'"}t have any upcoming feeding schedules.
                        </p>
                        <Button onClick={openNewScheduleDialog}>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add your first feeding schedule
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Feeding Schedule' : 'Add New Feeding Schedule'}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Update the details of your feeding schedule.' 
                : 'Create a new feeding schedule for your fish.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Schedule Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Morning Feed"
                  value={currentSchedule.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Details about this feeding schedule..."
                  value={currentSchedule.description || ''}
                  onChange={handleInputChange}
                  className="resize-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="feedAmount">Feed Amount (grams)</Label>
                  <Input
                    id="feedAmount"
                    name="feedAmount"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="50"
                    value={currentSchedule.feedAmount || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="feedType">Feed Type</Label>
                  <select
                    id="feedType"
                    name="feedType"
                    value={currentSchedule.feedType}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {FEED_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={format(currentSchedule.scheduledAt, 'yyyy-MM-dd')}
                    onChange={handleDateTimeChange}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    name="time"
                    type="time"
                    value={format(currentSchedule.scheduledAt, 'HH:mm')}
                    onChange={handleDateTimeChange}
                    required
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isRecurring"
                  name="isRecurring"
                  checked={currentSchedule.isRecurring}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="isRecurring">Recurring Schedule</Label>
              </div>
              
              {currentSchedule.isRecurring && (
                <div className="grid gap-2">
                  <Label>Repeat on Days</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {DAYS.map((day, index) => (
                      <Badge
                        key={day}
                        variant={currentSchedule.recurringDays.includes(index) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => handleDayChange(index)}
                      >
                        {day.substring(0, 3)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {isEditing && (
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    value={currentSchedule.status}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogPrimitive.Close asChild>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </DialogPrimitive.Close>
              <Button type="submit" disabled={loading}>
                {isEditing ? 'Update Schedule' : 'Create Schedule'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Helper function to get feed type label
function getFeedTypeLabel(value: string): string {
  const type = FEED_TYPES.find(t => t.value === value);
  return type ? type.label : value;
}

// Helper function to get feed type color
function getFeedTypeColor(value: string): string {
  const type = FEED_TYPES.find(t => t.value === value);
  return type ? type.color : 'bg-gray-100 text-gray-800';
} 