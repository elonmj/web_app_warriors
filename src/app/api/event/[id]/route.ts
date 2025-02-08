import { NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const eventId = params.id;
  const filePath = path.join(DATA_DIR, 'events.json');

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const events = JSON.parse(fileContent);
    
    // Find event in the events array
    const event = events.find((e: any) => e.id === eventId);

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Return complete event data including metadata
    return NextResponse.json({
      id: event.id,
      name: event.name,
      startDate: event.startDate,
      endDate: event.endDate,
      type: event.type,
      status: event.status,
      metadata: event.metadata
    });
  } catch (error) {
    console.error('Error reading event data:', error);
    return NextResponse.json(
      { error: 'Failed to load event data' },
      { status: 500 }
    );
  }
}