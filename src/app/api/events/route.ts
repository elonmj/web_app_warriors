import { NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import path from 'path';
import { Event } from '@/types/Event';

const DATA_DIR = path.join(process.cwd(), 'data');

export async function GET() {
  try {
    const filePath = path.join(DATA_DIR, 'events.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    if (!data.events || !Array.isArray(data.events)) {
      return NextResponse.json(
        { error: 'Invalid data structure in events.json' },
        { status: 500 }
      );
    }

    return NextResponse.json(data.events);
  } catch (error) {
    console.error('Error reading events data:', error);
    return NextResponse.json(
      { error: 'Failed to load events' },
      { status: 500 }
    );
  }
}