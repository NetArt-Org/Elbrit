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
import { useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCalendar } from "@/components/calendar/contexts/calendar-context";
import { useMediaQuery } from "@/components/calendar/hooks";
import {
  formatTime,
  getBgColor,
  getColorClass,
  getEventsForMonth,
  getFirstLetters,
  toCapitalize,
  navigateDate,
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

const SWIPE_THRESHOLD = 80;

export const AgendaEvents = ({ scope = "all" }) => {
  const {
    events,
    use24HourFormat,
    badgeVariant,
    agendaModeGroupBy,
    selectedDate,
    setSelectedDate,
    activeDate,
    setActiveDate,
    view,
    mobileLayer,
  } = useCalendar();

  const isMobile = useMediaQuery("(max-width: 768px)");
  const lockedAxisRef = useRef(null);

  /* ===============================
     HORIZONTAL SWIPE HANDLER
  =============================== */
  const handleAgendaDragEnd = (_, info) => {
    const axis = lockedAxisRef.current;
    lockedAxisRef.current = null;

    if (axis !== "x") return;
    if (Math.abs(info.offset.x) < SWIPE_THRESHOLD) return;

    const direction = info.offset.x < 0 ? "next" : "previous";

    setSelectedDate((prev) => {
      let nextDate;

      /* -----------------------------
         DAY PRIORITY
      ----------------------------- */
      if (activeDate || selectedDate) {
        nextDate = navigateDate(prev, "day", direction);
        setActiveDate(nextDate);
        return nextDate;
      }

      /* -----------------------------
         CONTEXT AWARE FALLBACK
      ----------------------------- */
      if (view === "week") {
        nextDate = navigateDate(prev, "week", direction);
        setActiveDate(startOfWeek(nextDate));
        return nextDate;
      }

      if (view === "month") {
        nextDate = navigateDate(prev, "month", direction);
        setActiveDate(nextDate);
        return nextDate;
      }

      /* Agenda mobile fallback */
      nextDate = navigateDate(prev, "day", direction);
      setActiveDate(nextDate);
      return nextDate;
    });
  };

  /* ===============================
     EVENT FILTERING
  =============================== */
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
      return events.filter((event) =>
        isWithinInterval(parseISO(event.startDate), {
          start: startOfWeek(selectedDate),
          end: endOfWeek(selectedDate),
        })
      );
    }

    if (scope === "month") {
      return getEventsForMonth(events, selectedDate);
    }

    return events;
  }, [events, selectedDate, scope]);

  /* ===============================
     GROUP EVENTS
  =============================== */
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

  /* ===============================
     RENDER
  =============================== */
  return (
    <motion.div
      drag={isMobile ? "x" : false}
      dragDirectionLock
      onDirectionLock={(axis) => (lockedAxisRef.current = axis)}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.12}
      onDragEnd={isMobile ? handleAgendaDragEnd : undefined}
      style={{ touchAction: "pan-y" }}
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
                            <AvatarFallback className={getBgColor(event.color)}>
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
                        <span>{formatTime(event.startDate, use24HourFormat)}</span>
                        <span>-</span>
                        <span>{formatTime(event.endDate, use24HourFormat)}</span>
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
