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
  } from "@/components/calendar/helpers";
  import { EventBullet } from "@/components/calendar/views/month-view/event-bullet";
  
  export const AgendaEvents = ({ scope = "all" }) => {
    const {
      events,
      use24HourFormat,
      badgeVariant,
      agendaModeGroupBy,
      selectedDate,
    } = useCalendar();
  
    
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
  
      // ✅ Prioritize selected date for week/month
      if (agendaModeGroupBy === "date" && (scope === "week" || scope === "month")) {
        const selectedKey = format(selectedDate, "yyyy-MM-dd");
  
        const selectedGroup = entries.find(([key]) => key === selectedKey);
        const remainingGroups = entries.filter(([key]) => key !== selectedKey);
  
        return selectedGroup
          ? [selectedGroup, ...remainingGroups]
          : entries;
      }
  
      return entries;
    }, [agendaEvents, selectedDate, agendaModeGroupBy, scope]);
  
    return (
      <Command className="overflow-y-scroll [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] py-4 h-[80vh] bg-transparent">
        {scope === "all" && (
          <div className="mb-4 mx-4">
            <CommandInput placeholder="Type a command or search..." />
          </div>
        )}
  
        <CommandList className="max-h-max px-3 border-t">
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
                    "mb-2 p-4 border rounded-md data-[selected=true]:bg-bg transition-all hover:cursor-pointer",
                    {
                      [getColorClass(event.color)]: badgeVariant === "colored",
                      "hover:bg-zinc-200 dark:hover:bg-gray-900":
                        badgeVariant === "dot",
                      "hover:opacity-60": badgeVariant === "colored",
                    }
                  )}
                >
                  <EventDetailsDialog event={event}>
                    <div className="w-full flex items-center justify-between gap-4">
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
                        <p className="text-sm">
                          {formatTime(event.startDate, use24HourFormat)}
                        </p>
                        <span className="text-muted-foreground">-</span>
                        <p className="text-sm">
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
    );
  };
  