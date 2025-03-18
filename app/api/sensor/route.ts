import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const reading = await prisma.sensorReading.create({
      data: {
        ec: data.ec ?? null,
        temperature: data.temperature ?? null,
        ph: data.ph ?? null,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      },
    });
    return NextResponse.json(reading);
  } catch (error) {
    console.error('Error saving sensor reading:', error);
    return NextResponse.json(
      { error: 'Failed to save sensor reading' },
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
    return NextResponse.json(readings);
  } catch (error) {
    console.error('Error fetching sensor readings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sensor readings' },
      { status: 500 }
    );
  }
} 