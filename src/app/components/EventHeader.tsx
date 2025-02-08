"use client";

import { Event } from "@/types/Event";
import ClientEventHeader from "./ClientEventHeader";

interface EventHeaderProps {
  event: Event;
}

export default function EventHeader({ event }: EventHeaderProps) {
  return <ClientEventHeader event={event} />;
}