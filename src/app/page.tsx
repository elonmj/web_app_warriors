import { Event } from "@/types/Event";
import { promises as fs } from "fs";
import path from "path";
import ClientHomePage from "./components/ClientHomePage";
import { EventStatusType } from "@/types/Enums";

interface RawEvent {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  type: string;
  status: string;
  metadata?: {
    totalPlayers: number;
    totalMatches: number;
    currentRound: number;
    lastUpdated: string;
  };
}

async function getEvents(): Promise<Event[]> {
  try {
    const filePath = path.join(process.cwd(), "data", "events.json");
    const fileContent = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(fileContent);

    if (!data.events || !Array.isArray(data.events)) {
      throw new Error("Invalid data structure in events.json");
    }

    return data.events.map((event: RawEvent) => ({
      id: event.id,
      name: event.name,
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate),
      type: event.type as Event["type"],
      status: event.status as EventStatusType,
      metadata: event.metadata,
    }));
  } catch (error) {
    console.error("Error reading events:", error);
    return [];
  }
}

export default async function Home() {
  const events = await getEvents();

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <ClientHomePage initialEvents={events} />
    </main>
  );
}
