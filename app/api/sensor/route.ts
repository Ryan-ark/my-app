import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data) {
      return NextResponse.json(
        { error: 'No data provided' },
        { status: 400 }
      );
    }

    // Create the reading with proper type handling
    const reading = await prisma.sensorReading.create({
      data: {
        ec: typeof data.ec === 'number' ? data.ec : null,
        temperature: typeof data.temperature === 'number' && data.temperature !== -127 ? data.temperature : null,
        ph: data.ph ? String(data.ph) : null,
        do_level: typeof data.do === 'number' ? data.do : null,
        weight: typeof data.weight === 'number' ? data.weight : 0,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      },
    });

    // Transform the response to match the application's structure
    const transformedReading = {
      id: reading.id,
      EC: reading.ec,
      Temp: reading.temperature,
      pH: reading.ph,
      DO: reading.do_level,
      Weight: reading.weight ?? 0,
      timestamp: reading.timestamp,
      createdAt: reading.createdAt,
    };

    return NextResponse.json(transformedReading);
  } catch (error) {
    console.error('Error saving sensor reading:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save sensor reading' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const readings = await prisma.sensorReading.findMany({
      take: 10,
      orderBy: {
        timestamp: 'desc',
      },
    });

    // Transform the readings to match the application's structure
    const transformedReadings = readings.map(reading => ({
      id: reading.id,
      EC: reading.ec,
      Temp: reading.temperature,
      pH: reading.ph,
      DO: reading.do_level,
      Weight: reading.weight ?? 0,
      timestamp: reading.timestamp,
      createdAt: reading.createdAt,
    }));

    return NextResponse.json(transformedReadings);
  } catch (error) {
    console.error('Error fetching sensor readings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch sensor readings' },
      { status: 500 }
    );
  }
} 