import { Event } from "@/types/Event";
import ClientEventCard from "./ClientEventCard";

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  return <ClientEventCard event={event} />;
}