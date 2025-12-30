"use client";

import { format, parseISO } from "date-fns";
import { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useCalendar } from "@/components/calendar/contexts/calendar-context";
import {
  formatTime,
  getBgColor,
  getColorClass,
  getFirstLetters,
  toCapitalize,
} from "@/components/calendar/helpers";
import { EventDetailsDialog } from "@/components/calendar/dialogs/event-details-dialog";
import { EventBullet } from "@/components/calendar/views/month-view/event-bullet";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarVerticalSwipeLayer } from "../../mobile/CalendarVerticalSwipeLayer";

export const AgendaEventsMobile = () => {
  const {
    events,
    use24HourFormat,
    badgeVariant,
    agendaModeGroupBy,
  } = useCalendar();
  const scrollRef = useRef(null);
  const [isAtTop, setIsAtTop] = useState(true);
  
  const handleScroll = () => {
    if (!scrollRef.current) return;
    setIsAtTop(scrollRef.current.scrollTop === 0);
  };
    
  /* ===============================
     GROUP ALL EVENTS (PURE AGENDA)
  =============================== */
  const agendaEvents = useMemo(() => {
    return Object.groupBy(events, (event) =>
      agendaModeGroupBy === "date"
        ? format(parseISO(event.startDate), "yyyy-MM-dd")
        : event.color
    );
  }, [events, agendaModeGroupBy]);

  const groupedAndSortedEvents = useMemo(() => {
    return Object.entries(agendaEvents).sort(
      (a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()
    );
  }, [agendaEvents]);

  /* ===============================
     RENDER (NO MOTION, NO SWIPE)
  =============================== */
  return (
    <CalendarVerticalSwipeLayer enabled={isAtTop}>
    <div className="[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <Command className="overflow-y-scroll py-4 h-[80vh] bg-transparent"    ref={scrollRef}
        onScroll={handleScroll}>
        <div className="mb-4 mx-4">
          <CommandInput placeholder="Type a command or search..." />
        </div>

        <CommandList className="max-h-max px-2 border-t">
          {groupedAndSortedEvents.map(([groupKey, groupedEvents]) => (
            <CommandGroup
              key={groupKey}
              heading={
                agendaModeGroupBy === "date"
                  ? format(parseISO(groupKey), "EEEE, MMMM d, yyyy")
                  : toCapitalize(groupedEvents[0].color)
              }
            >
              {groupedEvents.map((event) => (
                <CommandItem
                  key={event.id}
                  className={cn(
                    "mb-2 p-2 border rounded-md transition-all",
                    {
                      [getColorClass(event.color)]:
                        badgeVariant === "colored",
                      "hover:bg-zinc-200 dark:hover:bg-gray-900":
                        badgeVariant === "dot",
                    }
                  )}
                >
                  <EventDetailsDialog event={event}>
                    <div className="w-full flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {badgeVariant === "dot" ? (
                          <EventBullet color={event.color} />
                        ) : (
                          <Avatar>
                            <AvatarImage src="" />
                            <AvatarFallback
                              className={getBgColor(event.color)}
                            >
                              {getFirstLetters(event.title)}
                            </AvatarFallback>
                          </Avatar>
                        )}

                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1 w-32">
                            {event.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-1 text-xs">
                        <span>
                          {formatTime(event.startDate, use24HourFormat)}
                        </span>
                        <span>-</span>
                        <span>
                          {formatTime(event.endDate, use24HourFormat)}
                        </span>
                      </div>
                    </div>
                  </EventDetailsDialog>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}

          <CommandEmpty>No results found.</CommandEmpty>
        </CommandList>
      </Command>
    </div>
    </CalendarVerticalSwipeLayer>
  );
};
