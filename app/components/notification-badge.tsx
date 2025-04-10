'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { getNotifications, markNotificationAsRead, subscribeToNotifications, Notification, NotificationData } from '@/app/lib/notificationService';

interface NotificationBadgeProps {
  variant?: "outline" | "default";
  className?: string;
}

export function NotificationBadge({ variant = "outline", className = "" }: NotificationBadgeProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch notifications on component mount
  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        const notificationsData = await getNotifications();
        const notificationsList = Object.entries(notificationsData).map(([id, notification]) => ({
          ...notification,
          id: notification.id || id // Use existing ID or Firebase key
        })).sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setNotifications(notificationsList);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToNotifications((notificationsData: NotificationData) => {
      const notificationsList = Object.entries(notificationsData).map(([id, notification]) => ({
        ...notification,
        id: notification.id || id // Use existing ID or Firebase key
      })).sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      setNotifications(notificationsList);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Mark an individual notification as read
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.id || notification.read) return;
    
    try {
      await markNotificationAsRead(notification.id);
      
      // Update local state immediately
      setNotifications(prev => 
        prev.map(n => 
          n.id === notification.id 
            ? { ...n, read: true } 
            : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all unread notifications as read
  const markAllAsRead = async () => {
    setIsLoading(true);
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      
      // No unread notifications
      if (unreadNotifications.length === 0) {
        setIsLoading(false);
        return;
      }
      
      // Create a copy of current notifications to update
      const updatedNotifications = [...notifications];
      
      // Update each unread notification in Firebase
      for (const notification of unreadNotifications) {
        if (notification.id) {
          await markNotificationAsRead(notification.id);
          
          // Find and update in our local copy
          const index = updatedNotifications.findIndex(n => n.id === notification.id);
          if (index !== -1) {
            updatedNotifications[index] = { ...updatedNotifications[index], read: true };
          }
        }
      }
      
      // Update state with our manually tracked changes
      setNotifications(updatedNotifications);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle popover state change
  const handleOpenChange = (open: boolean) => {
    if (open && !isPopoverOpen) {
      // When opening the popover, mark all as read
      markAllAsRead();
    }
    setIsPopoverOpen(open);
  };

  // Compute unread count from local state
  const unreadCount = notifications.filter(n => !n.read).length;

  const getThresholdColor = (threshold: string) => {
    switch (threshold) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      case 'refill':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // For debugging
  console.log('Current notifications:', notifications);
  console.log('Unread count:', unreadCount);

  return (
    <Popover open={isPopoverOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          size="sm"
          className={`relative p-0 w-9 h-9 rounded-full ${className}`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="flex items-center justify-between p-4">
          <div className="font-medium">
            Notifications
            {isLoading && <span className="ml-1 text-gray-500 text-xs">(Loading...)</span>}
          </div>
          {notifications.length > 0 && unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto py-1 px-2 text-xs hover:bg-gray-100"
              onClick={markAllAsRead}
              disabled={isLoading}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <Separator />
        {notifications.length > 0 ? (
          <ScrollArea className="h-[calc(80vh-10rem)] max-h-80">
            <div className="space-y-1 p-2">
              {notifications.map((notification, index) => (
                <div 
                  key={notification.id || `notification-${index}`}
                  className={`p-3 rounded-md cursor-pointer hover:bg-gray-50 transition-colors ${notification.read ? 'opacity-60' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                  data-notification-id={notification.id}
                  data-read-status={notification.read ? 'read' : 'unread'}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2">
                      <div className={`mt-0.5 h-2 w-2 rounded-full ${notification.read ? 'bg-gray-200' : 'bg-blue-500'}`} />
                      <div>
                        <div className="font-medium text-sm">{notification.parameter}</div>
                        <div className="text-xs text-gray-500">{formatTimestamp(notification.timestamp)}</div>
                      </div>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${getThresholdColor(notification.threshold)}`}>
                      {notification.threshold}
                    </div>
                  </div>
                  <div className="mt-1.5 text-sm ml-4">{notification.message}</div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="p-8 text-center text-sm text-gray-500">
            {isLoading ? 'Loading notifications...' : 'No notifications yet'}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
} 