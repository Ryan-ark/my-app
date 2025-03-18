import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const comments = await prisma.comments.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        movie_id: true,
        text: true,
        date: true
      },
      take: 50,
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
} 