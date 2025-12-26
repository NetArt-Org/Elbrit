import {format} from "date-fns";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalTitle,
    ModalTrigger,
} from "@/components/ui/responsive-modal";
import {cn} from "@/lib/utils";
import {useCalendar} from "@/components/calendar/contexts/calendar-context";
import {formatTime} from "@/components/calendar/helpers";
import {dayCellVariants} from "@/components/calendar/views/month-view/day-cell";
import {EventBullet} from "@/components/calendar/views/month-view/event-bullet";
import {EventDetailsDialog} from "@/components/calendar/dialogs/event-details-dialog";
import MobileAddEventBar from "../mobile/MobileAddEventBar";

export function EventListDialog({
    date,
    events,
    open,
  onOpenChange,
    maxVisibleEvents = 10,
    children
}) {
    const {badgeVariant, use24HourFormat} = useCalendar();
    if (!date) return null;
    const cellEvents = events;
    const hiddenEventsCount = Math.max(cellEvents.length - maxVisibleEvents, 0);

    const defaultTrigger = (
        <span className="cursor-pointer">
			<span className="sm:hidden">+{hiddenEventsCount}</span>
			<span className="hidden sm:inline py-0.5 px-2 my-1 rounded-xl border">
				{hiddenEventsCount}
                <span className="mx-1">more...</span>
			</span>
		</span>
    );

    return (
        <Modal modal={false} open={open} onOpenChange={onOpenChange}>
            <ModalTrigger asChild>{children || defaultTrigger}</ModalTrigger>
            <ModalContent className="sm:max-w-[425px]">
                <ModalHeader>
                    <ModalTitle className="my-2">
                        <div className="flex items-center gap-1">
                            <EventBullet color={cellEvents[0]?.color} className="" />
                            <p className="text-sm font-medium">
                            Events on {date ? format(date, "EEEE, MMMM d, yyyy") : ""}
                            </p>
                        </div>
                    </ModalTitle>
                </ModalHeader>
                <div className="max-h-[55vh] overflow-y-auto space-y-2 pb-24">
                    {cellEvents.length > 0 ? (
                        cellEvents.map((event) => (
                            <EventDetailsDialog event={event} key={event.id}>
                                <div
                                    className={cn(
                                        "flex items-center gap-1 p-1 border rounded-md hover:bg-muted cursor-pointer",
                                        {
                                            [dayCellVariants({color: event.color})]:
                                                badgeVariant === "colored",
                                        }
                                    )}>
                                        <EventBullet color={event.color} />
                                        <div className="flex justify-between items-center w-full">
                                            <p className="text-sm font-medium">{event.title}</p>
                                            <p className="text-xs">
                                                {formatTime(event.startDate, use24HourFormat)}
                                            </p>
                                        </div>
                                </div>
                            </EventDetailsDialog>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            No events for this date.
                        </p>
                    )}
                <MobileAddEventBar date={date} />
                </div>
            </ModalContent>
        </Modal>
    );
}
