import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const theaters = await prisma.theaters.findMany({
      select: {
        id: true,
        theaterId: true,
        location: true
      },
      take: 50
    });

    return NextResponse.json(theaters);
  } catch (error) {
    console.error('Error fetching theaters:', error);
    return NextResponse.json({ error: 'Failed to fetch theaters' }, { status: 500 });
  }
} 