"use client";

import { AddEditEventDialog } from "@/components/calendar/dialogs/add-edit-event-dialog";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCalendar } from "@/components/calendar/contexts/calendar-context";
import { isBefore, startOfDay } from "date-fns";

export default function MobileAddEventBar({ date: propDate }) {
  const { selectedDate } = useCalendar();

  const date = propDate || selectedDate || new Date();

  const isPastDate = isBefore(
    startOfDay(date),
    startOfDay(new Date())
  );

  // Do not render for past dates
  if (isPastDate) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="mx-4 mb-4 flex items-center justify-between rounded-xl border bg-background p-2 shadow-lg">
        {/* Date label */}
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">
            {date.toLocaleDateString("en-US", { weekday: "long" })}
          </span>
          <span className="text-sm font-medium">
            {date.toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>

        {/* Dialog trigger */}
        <AddEditEventDialog startDate={date}>
          <Button
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground"
            onPointerDownCapture={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </AddEditEventDialog>
      </div>
    </div>
  );
}
