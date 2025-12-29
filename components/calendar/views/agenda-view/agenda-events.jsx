"use client";

import {
  format,
  parseISO,
  startOfWeek,
  startOfDay,
  endOfDay,
  endOfWeek,
  isWithinInterval,
} from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useMemo } from "react";
import { useMediaQuery } from "@/components/calendar/hooks";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCalendar } from "@/components/calendar/contexts/calendar-context";
import { EventDetailsDialog } from "@/components/calendar/dialogs/event-details-dialog";
import {
  formatTime,
  getBgColor,
  getColorClass,
  getEventsForMonth,
  getFirstLetters,
  toCapitalize,
  navigateDate,
} from "@/components/calendar/helpers";
import { EventBullet } from "@/components/calendar/views/month-view/event-bullet";

const SWIPE_THRESHOLD = 80;

export const AgendaEvents = ({ scope = "all" }) => {
  const {
    events,
    use24HourFormat,
    badgeVariant,
    agendaModeGroupBy,
    selectedDate,
    setSelectedDate,
    setActiveDate,
    mobileLayer,
  } = useCalendar();

  const isMobile = useMediaQuery("(max-width: 768px)");

  /* --------------------------------
     Disable swipe on full agenda screen
  -------------------------------- */
  const isAgendaScreen =
    scope === "agenda" || mobileLayer === "agenda";

  /* --------------------------------
     Swipe handling (day/week/month only)
  -------------------------------- */
  const handleAgendaDragEnd = (_, info) => {
    if (isAgendaScreen) return;

    const offsetX = info.offset.x;
    if (Math.abs(offsetX) < SWIPE_THRESHOLD) return;

    const direction = offsetX < 0 ? "next" : "previous";

    setSelectedDate((prev) => {
      const nextDate = navigateDate(prev, scope, direction);

      if (scope === "day") {
        setActiveDate(nextDate);
      } else {
        setActiveDate(null);
      }

      return nextDate;
    });
  };

  /* --------------------------------
     Scope filtering
  -------------------------------- */
  const scopedEvents = useMemo(() => {
    if (scope === "day") {
      return events.filter((event) =>
        isWithinInterval(parseISO(event.startDate), {
          start: startOfDay(selectedDate),
          end: endOfDay(selectedDate),
        })
      );
    }

    if (scope === "week") {
      const start = startOfWeek(selectedDate);
      const end = endOfWeek(selectedDate);

      return events.filter((event) =>
        isWithinInterval(parseISO(event.startDate), { start, end })
      );
    }

    if (scope === "month") {
      return getEventsForMonth(events, selectedDate);
    }

    return events;
  }, [events, selectedDate, scope]);

  /* --------------------------------
     Group events
  -------------------------------- */
  const agendaEvents = Object.groupBy(scopedEvents, (event) =>
    agendaModeGroupBy === "date"
      ? format(parseISO(event.startDate), "yyyy-MM-dd")
      : event.color
  );

  const groupedAndSortedEvents = useMemo(() => {
    return Object.entries(agendaEvents).sort(
      (a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()
    );
  }, [agendaEvents]);

  return (
    <motion.div
      drag={isMobile && !isAgendaScreen ? "x" : false}
      dragConstraints={
        isMobile && !isAgendaScreen ? { left: 0, right: 0 } : undefined
      }
      dragElastic={isMobile && !isAgendaScreen ? 0.12 : 0}
      onDragEnd={
        isMobile && !isAgendaScreen ? handleAgendaDragEnd : undefined
      }
      className="[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
    >
      <Command className="overflow-y-scroll py-4 h-[80vh] bg-transparent">
        {scope === "all" && (
          <div className="mb-4 mx-4">
            <CommandInput placeholder="Type a command or search..." />
          </div>
        )}

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
                    "mb-2 p-2 border rounded-md transition-all hover:cursor-pointer",
                    {
                      [getColorClass(event.color)]:
                        badgeVariant === "colored",
                      "hover:bg-zinc-200 dark:hover:bg-gray-900":
                        badgeVariant === "dot",
                      "hover:opacity-60":
                        badgeVariant === "colored",
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
                            <AvatarImage src="" alt="" />
                            <AvatarFallback
                              className={getBgColor(event.color)}
                            >
                              {getFirstLetters(event.title)}
                            </AvatarFallback>
                          </Avatar>
                        )}

                        <div className="flex flex-col">
                          <p className="font-medium">{event.title}</p>
                          <p className="text-muted-foreground text-sm line-clamp-1 w-1/3">
                            {event.description}
                          </p>
                        </div>
                      </div>

                      <div className="w-40 flex justify-center items-center gap-1">
                        <p className="text-xs">
                          {formatTime(
                            event.startDate,
                            use24HourFormat
                          )}
                        </p>
                        <span className="text-muted-foreground">-</span>
                        <p className="text-xs">
                          {formatTime(
                            event.endDate,
                            use24HourFormat
                          )}
                        </p>
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
    </motion.div>
  );
};
