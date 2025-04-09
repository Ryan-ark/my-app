import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/feeding - Get all feeding schedules
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  
  try {
    // If ID is provided, get a specific feeding schedule
    if (id) {
      const feedingSchedule = await prisma.feedingSchedule.findUnique({
        where: { id },
      });
      
      if (!feedingSchedule) {
        return NextResponse.json(
          { error: 'Feeding schedule not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(feedingSchedule);
    }
    
    // Otherwise, get all feeding schedules
    const feedingSchedules = await prisma.feedingSchedule.findMany({
      orderBy: {
        scheduledAt: 'asc',
      },
    });
    
    return NextResponse.json(feedingSchedules);
  } catch (error) {
    console.error('Error fetching feeding schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feeding schedules' },
      { status: 500 }
    );
  }
}

// POST /api/feeding - Create a new feeding schedule
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.feedAmount || !data.feedType || !data.scheduledAt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Convert scheduledAt to Date if it's a string
    if (typeof data.scheduledAt === 'string') {
      data.scheduledAt = new Date(data.scheduledAt);
    }
    
    const feedingSchedule = await prisma.feedingSchedule.create({
      data: {
        name: data.name,
        description: data.description,
        feedAmount: data.feedAmount,
        feedType: data.feedType,
        scheduledAt: data.scheduledAt,
        isRecurring: data.isRecurring || false,
        recurringDays: data.recurringDays || [],
        status: data.status || 'scheduled',
      },
    });
    
    return NextResponse.json(feedingSchedule, { status: 201 });
  } catch (error) {
    console.error('Error creating feeding schedule:', error);
    return NextResponse.json(
      { error: 'Failed to create feeding schedule' },
      { status: 500 }
    );
  }
}

// PATCH /api/feeding - Update a feeding schedule
export async function PATCH(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required for updating a feeding schedule' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    
    // Convert scheduledAt to Date if it's a string
    if (data.scheduledAt && typeof data.scheduledAt === 'string') {
      data.scheduledAt = new Date(data.scheduledAt);
    }
    
    // Check if the schedule exists
    const existingSchedule = await prisma.feedingSchedule.findUnique({
      where: { id },
    });
    
    if (!existingSchedule) {
      return NextResponse.json(
        { error: 'Feeding schedule not found' },
        { status: 404 }
      );
    }
    
    // Update the schedule
    const updatedSchedule = await prisma.feedingSchedule.update({
      where: { id },
      data,
    });
    
    return NextResponse.json(updatedSchedule);
  } catch (error) {
    console.error('Error updating feeding schedule:', error);
    return NextResponse.json(
      { error: 'Failed to update feeding schedule' },
      { status: 500 }
    );
  }
}

// DELETE /api/feeding - Delete a feeding schedule
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required for deleting a feeding schedule' },
        { status: 400 }
      );
    }
    
    // Check if the schedule exists
    const existingSchedule = await prisma.feedingSchedule.findUnique({
      where: { id },
    });
    
    if (!existingSchedule) {
      return NextResponse.json(
        { error: 'Feeding schedule not found' },
        { status: 404 }
      );
    }
    
    // Delete the schedule
    await prisma.feedingSchedule.delete({
      where: { id },
    });
    
    return NextResponse.json({ message: 'Feeding schedule deleted' });
  } catch (error) {
    console.error('Error deleting feeding schedule:', error);
    return NextResponse.json(
      { error: 'Failed to delete feeding schedule' },
      { status: 500 }
    );
  }
} 