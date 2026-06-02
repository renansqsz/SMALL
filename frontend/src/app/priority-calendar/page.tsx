"use client";

import { ProtectedPage } from "@/components/protected-page";
import { PriorityPyramidCalendar } from "@/components/ui/priority-pyramid-calendar";

export default function PriorityCalendarPage() {
  return (
    <ProtectedPage
      title="Calendário"
      description="Organize reuniões com data, horário, categoria e acesso rápido aos links."
      notice={null}
    >
      <PriorityPyramidCalendar />
    </ProtectedPage>
  );
}
