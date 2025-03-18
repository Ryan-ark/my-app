import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const movies = await prisma.movies.findMany({
      select: {
        id: true,
        title: true,
        plot: true,
        genres: true,
        year: true,
        rated: true,
        runtime: true,
        num_mflix_comments: true
      },
      take: 50,
      orderBy: {
        year: 'desc'
      }
    });

    return NextResponse.json(movies);
  } catch (error) {
    console.error('Error fetching movies:', error);
    return NextResponse.json({ error: 'Failed to fetch movies' }, { status: 500 });
  }
} 