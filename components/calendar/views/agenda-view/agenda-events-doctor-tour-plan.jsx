"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@calendar/lib/utils";
import { CommandItem } from "@calendar/components/ui/command";
import { EventDetailsDialog } from "@calendar/components/calendar/dialogs/event-details-dialog";
import { Avatar, AvatarFallback } from "@calendar/components/ui/avatar";
import {
  getBgColor,
  getFirstLetters,
} from "@calendar/components/calendar/helpers";

export function AgendaEventsDoctorTourPlan({ events }) {
  const [open, setOpen] = useState(false);

  if (!events?.length) return null;

  return (
    <>
      {/* Accordion Header */}
      <CommandItem
        value="doctor-tour-group"
        onSelect={(e) => {
          e.preventDefault();
          setOpen((prev) => !prev);
        }}
        className="mb-2 p-2 border rounded-md cursor-pointer"
      >
        <div className="flex justify-between items-center w-full">
          <span className="font-medium">{events.length} Doctor Tour Plan</span>

          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              open && "rotate-180"
            )}
          />
        </div>
      </CommandItem>

      {/* Accordion Body */}
      {open &&
        events.map((event) => (
          <CommandItem
            key={event.id}
            value={event.id}
            className="mb-2 p-2 border rounded-md ml-6"
          >
            <EventDetailsDialog event={event}>
              <div className="flex gap-2 items-center w-full">
                <Avatar>
                  <AvatarFallback className={getBgColor(event.color)}>
                    {getFirstLetters(event.title)}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <p className="text-sm font-medium">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {event.owner?.name}
                  </p>
                </div>
              </div>
            </EventDetailsDialog>
          </CommandItem>
        ))}
    </>
  );
}