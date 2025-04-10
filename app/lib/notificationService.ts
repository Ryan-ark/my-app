import { database } from './firebase';
import { ref, push, set, onValue, get } from 'firebase/database';
import { SensorData } from './sensorService';

// Thresholds based on the provided table data
export const THRESHOLDS = {
  pH: {
    optimal: { min: 6.5, max: 8.5 },
    warning: { min: 6.5, max: 8.5 },
    critical: { min: 6.0, max: 9.0 }
  },
  DO: {
    optimal: { min: 5.0, max: 7.0 },
    warning: { min: 4.5, max: 100 }, // No explicit upper limit for warning
    critical: { min: 3.0, max: 100 } // No explicit upper limit for critical
  },
  temperature: {
    optimal: { min: 26, max: 30 },
    warning: { min: 24, max: 31 },
    critical: { min: 22, max: 32 }
  },
  EC: {
    optimal: { min: 500, max: 1500 },
    warning: { min: 500, max: 1500 },
    critical: { min: 250, max: 2000 }
  },
  weight: {
    refill: { min: 0, max: 1.0 } // When weight is 1kg or less, refill notification
  }
};

export interface Notification {
  id?: string;
  parameter: string;
  value: number;
  threshold: 'warning' | 'critical' | 'refill';
  message: string;
  timestamp: string;
  read: boolean;
}

export interface NotificationData {
  [key: string]: Notification;
}

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

// Save notification to Firebase
export const saveNotification = async (notification: Omit<Notification, 'id'>): Promise<string> => {
  try {
    const notificationsRef = ref(database, 'notifications');
    const newNotificationRef = push(notificationsRef);
    await set(newNotificationRef, notification);
    return newNotificationRef.key || '';
  } catch (error) {
    console.error('Error saving notification:', error);
    throw error;
  }
};

// Get all notifications
export const getNotifications = async (): Promise<NotificationData> => {
  const notificationsRef = ref(database, 'notifications');
  
  try {
    const snapshot = await get(notificationsRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      
      // Ensure each notification has its ID
      const enhancedData: NotificationData = {};
      Object.entries(data).forEach(([key, value]) => {
        // Cast the value to the correct notification type
        const notification = value as Omit<Notification, 'id'>;
        enhancedData[key] = {
          ...notification,
          id: key // Add Firebase key as id if missing
        };
      });
      
      return enhancedData;
    }
    return {};
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

// Subscribe to notification updates
export const subscribeToNotifications = (callback: (data: NotificationData) => void) => {
  const notificationsRef = ref(database, 'notifications');
  
  return onValue(notificationsRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      
      // Ensure each notification has its ID
      const enhancedData: NotificationData = {};
      Object.entries(data).forEach(([key, value]) => {
        // Cast the value to the correct notification type
        const notification = value as Omit<Notification, 'id'>;
        enhancedData[key] = {
          ...notification,
          id: key // Add Firebase key as id if missing
        };
      });
      
      callback(enhancedData);
    } else {
      callback({});
    }
  });
};

// Check if current reading is within thresholds and create notifications if needed
export const checkThresholds = async (sensorData: SensorData): Promise<Notification[]> => {
  const notifications: Notification[] = [];
  const timestamp = new Date().toISOString();
  
  // Get the latest reading
  const entries = Object.entries(sensorData);
  if (entries.length === 0) return [];
  
  const latestReading = entries[entries.length - 1][1];
  
  // Check pH
  const phValue = parseSensorValue(latestReading['{\"pH\"']);
  if (phValue < THRESHOLDS.pH.critical.min) {
    notifications.push({
      parameter: 'pH',
      value: phValue,
      threshold: 'critical',
      message: `pH level is critically low: ${phValue}`,
      timestamp,
      read: false
    });
  } else if (phValue > THRESHOLDS.pH.critical.max) {
    notifications.push({
      parameter: 'pH',
      value: phValue,
      threshold: 'critical',
      message: `pH level is critically high: ${phValue}`,
      timestamp,
      read: false
    });
  } else if (phValue < THRESHOLDS.pH.warning.min || phValue > THRESHOLDS.pH.warning.max) {
    notifications.push({
      parameter: 'pH',
      value: phValue,
      threshold: 'warning',
      message: `pH level is outside optimal range: ${phValue}`,
      timestamp,
      read: false
    });
  }
  
  // Check DO (Dissolved Oxygen)
  const doValue = parseSensorValue(latestReading['\"DO\"']);
  if (doValue < THRESHOLDS.DO.critical.min) {
    notifications.push({
      parameter: 'DO',
      value: doValue,
      threshold: 'critical',
      message: `Dissolved Oxygen level is critically low: ${doValue} mg/L`,
      timestamp,
      read: false
    });
  } else if (doValue < THRESHOLDS.DO.warning.min) {
    notifications.push({
      parameter: 'DO',
      value: doValue,
      threshold: 'warning',
      message: `Dissolved Oxygen level is below optimal range: ${doValue} mg/L`,
      timestamp,
      read: false
    });
  }
  
  // Check Temperature
  const tempValue = parseSensorValue(latestReading['\"Temperature\"']);
  if (tempValue < THRESHOLDS.temperature.critical.min) {
    notifications.push({
      parameter: 'Temperature',
      value: tempValue,
      threshold: 'critical',
      message: `Temperature is critically low: ${tempValue}°C`,
      timestamp,
      read: false
    });
  } else if (tempValue > THRESHOLDS.temperature.critical.max) {
    notifications.push({
      parameter: 'Temperature',
      value: tempValue,
      threshold: 'critical',
      message: `Temperature is critically high: ${tempValue}°C`,
      timestamp,
      read: false
    });
  } else if (tempValue < THRESHOLDS.temperature.warning.min || tempValue > THRESHOLDS.temperature.warning.max) {
    notifications.push({
      parameter: 'Temperature',
      value: tempValue,
      threshold: 'warning',
      message: `Temperature is outside optimal range: ${tempValue}°C`,
      timestamp,
      read: false
    });
  }
  
  // Check EC (Electrical Conductivity)
  const ecValue = parseSensorValue(latestReading['\"EC\"']);
  if (ecValue < THRESHOLDS.EC.critical.min) {
    notifications.push({
      parameter: 'EC',
      value: ecValue,
      threshold: 'critical',
      message: `EC level is critically low: ${ecValue} µS/cm`,
      timestamp,
      read: false
    });
  } else if (ecValue > THRESHOLDS.EC.critical.max) {
    notifications.push({
      parameter: 'EC',
      value: ecValue,
      threshold: 'critical',
      message: `EC level is critically high: ${ecValue} µS/cm`,
      timestamp,
      read: false
    });
  } else if (ecValue < THRESHOLDS.EC.warning.min || ecValue > THRESHOLDS.EC.warning.max) {
    notifications.push({
      parameter: 'EC',
      value: ecValue,
      threshold: 'warning',
      message: `EC level is outside optimal range: ${ecValue} µS/cm`,
      timestamp,
      read: false
    });
  }
  
  // Check Weight for refill notifications
  const weightValue = parseSensorValue(latestReading['\"Weight\"']) / 1000; // Convert to kg
  if (weightValue <= THRESHOLDS.weight.refill.max) {
    notifications.push({
      parameter: 'Weight',
      value: weightValue,
      threshold: 'refill',
      message: `Feed level is low (${weightValue.toFixed(2)} kg), refill needed`,
      timestamp,
      read: false
    });
  }
  
  // Save all new notifications to the database
  for (const notification of notifications) {
    await saveNotification(notification);
  }
  
  return notifications;
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = ref(database, `notifications/${notificationId}`);
    const snapshot = await get(notificationRef);
    
    if (snapshot.exists()) {
      const notification = snapshot.val();
      await set(notificationRef, {
        ...notification,
        read: true
      });
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Get unread notifications count
export const getUnreadNotificationsCount = async (): Promise<number> => {
  try {
    const notifications = await getNotifications();
    return Object.values(notifications).filter(n => !n.read).length;
  } catch (error) {
    console.error('Error counting unread notifications:', error);
    return 0;
  }
}; 