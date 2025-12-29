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
  toCapitalize, navigateDate
} from "@/components/calendar/helpers";
import { EventBullet } from "@/components/calendar/views/month-view/event-bullet";

export const AgendaEvents = ({ scope = "all" }) => {
  const {
    events,
    use24HourFormat,
    badgeVariant, view,
    agendaModeGroupBy,
    selectedDate, setSelectedDate, setActiveDate, mobileLayer
  } = useCalendar();
  const SWIPE_THRESHOLD = 80;
  const isMobile = useMediaQuery("(max-width: 768px)");
  const handleAgendaDragEnd = (_, info) => {
    const offsetX = info.offset.x;

    if (offsetX < -SWIPE_THRESHOLD) {
      setSelectedDate(prev => {
        const next = navigateDate(prev, scope, "next");

        if (scope === "day") {
          setActiveDate(next);
        } else {
          setActiveDate(null);
        }

        return next;
      });
    }

    if (offsetX > SWIPE_THRESHOLD) {
      setSelectedDate(prev => {
        const prevDate = navigateDate(prev, scope, "previous");

        if (scope === "day") {
          setActiveDate(prevDate);
        } else {
          setActiveDate(null);
        }

        return prevDate;
      });
    }
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
    const entries = Object.entries(agendaEvents).sort(
      (a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()
    );
    return entries;
  }, [agendaEvents, selectedDate, agendaModeGroupBy, scope]);
  return (
    <>
      <motion.div
        drag={isMobile ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.12}
        onDragEnd={isMobile ? handleAgendaDragEnd : undefined}
        className="[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] "
      >
        <Command className="overflow-y-scroll [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] py-4 h-[80vh] bg-transparent">
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
                      "mb-2 p-2 border rounded-md data-[selected=true]:bg-bg transition-all hover:cursor-pointer",
                      {
                        [getColorClass(event.color)]: badgeVariant === "colored",
                        "hover:bg-zinc-200 dark:hover:bg-gray-900":
                          badgeVariant === "dot",
                        "hover:opacity-60": badgeVariant === "colored",
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
                              <AvatarFallback className={getBgColor(event.color)}>
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
                            {formatTime(event.startDate, use24HourFormat)}
                          </p>
                          <span className="text-muted-foreground">-</span>
                          <p className="text-xs">
                            {formatTime(event.endDate, use24HourFormat)}
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
    </>
  );
};
