"use client";

import { Event } from "@/types/Event";
import ClientEventHeader from "./ClientEventHeader";

interface EventHeaderProps {
  event: Event;
  isAdmin?: boolean;
}

export default function EventHeader({ event, isAdmin }: EventHeaderProps) {
  return <ClientEventHeader event={event} isAdmin={isAdmin} />;
}