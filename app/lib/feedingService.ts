export interface FeedingScheduleData {
  id?: string;
  name: string;
  description?: string;
  feedAmount: number;
  feedType: string;
  scheduledAt: Date;
  isRecurring: boolean;
  recurringDays: number[];
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for API communication with string dates
interface FeedingScheduleAPIData {
  id?: string;
  name?: string;
  description?: string;
  feedAmount?: number;
  feedType?: string;
  scheduledAt?: string;
  isRecurring?: boolean;
  recurringDays?: number[];
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface FeedingScheduleResponse {
  id: string;
  name: string;
  description: string | null;
  feedAmount: number;
  feedType: string;
  scheduledAt: string;
  isRecurring: boolean;
  recurringDays: number[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const createFeedingSchedule = async (data: FeedingScheduleData) => {
  try {
    const response = await fetch('/api/feeding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create feeding schedule');
    }

    const savedData = await response.json();
    
    return {
      ...savedData,
      scheduledAt: savedData.scheduledAt ? new Date(savedData.scheduledAt) : undefined,
      createdAt: savedData.createdAt ? new Date(savedData.createdAt) : undefined,
      updatedAt: savedData.updatedAt ? new Date(savedData.updatedAt) : undefined,
    };
  } catch (error) {
    console.error('Error creating feeding schedule:', error);
    throw error;
  }
};

export const getFeedingSchedules = async () => {
  try {
    const response = await fetch('/api/feeding');
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch feeding schedules');
    }

    const data = await response.json();
    
    return data.map((schedule: FeedingScheduleResponse) => ({
      ...schedule,
      scheduledAt: schedule.scheduledAt ? new Date(schedule.scheduledAt) : undefined,
      createdAt: schedule.createdAt ? new Date(schedule.createdAt) : undefined,
      updatedAt: schedule.updatedAt ? new Date(schedule.updatedAt) : undefined,
    }));
  } catch (error) {
    console.error('Error fetching feeding schedules:', error);
    throw error;
  }
};

export const updateFeedingSchedule = async (id: string, data: Partial<FeedingScheduleData>) => {
  try {
    // Create a properly formatted API payload
    const dataToSend: FeedingScheduleAPIData = {};
    
    // Copy all fields except dates
    if (data.name !== undefined) dataToSend.name = data.name;
    if (data.description !== undefined) dataToSend.description = data.description;
    if (data.feedAmount !== undefined) dataToSend.feedAmount = data.feedAmount;
    if (data.feedType !== undefined) dataToSend.feedType = data.feedType;
    if (data.isRecurring !== undefined) dataToSend.isRecurring = data.isRecurring;
    if (data.recurringDays !== undefined) dataToSend.recurringDays = data.recurringDays;
    if (data.status !== undefined) dataToSend.status = data.status;
    
    // Convert Date objects to ISO strings
    if (data.scheduledAt) {
      dataToSend.scheduledAt = data.scheduledAt.toISOString();
    }
    
    console.log('Updating feeding schedule:', id, JSON.stringify(dataToSend));
    
    const response = await fetch(`/api/feeding?id=${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSend),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Server response error:', errorData);
      throw new Error(errorData.error || 'Failed to update feeding schedule');
    }

    const updatedData = await response.json();
    console.log('Updated data received:', updatedData);
    
    // Convert string dates back to Date objects
    return {
      ...updatedData,
      scheduledAt: updatedData.scheduledAt ? new Date(updatedData.scheduledAt) : undefined,
      createdAt: updatedData.createdAt ? new Date(updatedData.createdAt) : undefined,
      updatedAt: updatedData.updatedAt ? new Date(updatedData.updatedAt) : undefined,
    };
  } catch (error) {
    console.error('Error updating feeding schedule:', error);
    throw error;
  }
};

export const deleteFeedingSchedule = async (id: string) => {
  try {
    const response = await fetch(`/api/feeding?id=${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete feeding schedule');
    }

    return true;
  } catch (error) {
    console.error('Error deleting feeding schedule:', error);
    throw error;
  }
}; 