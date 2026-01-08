"use client";;
import { format, parseISO } from "date-fns";
import { useState, useRef } from "react";
import { Calendar, Clock, Text, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCalendar } from "@/components/calendar/contexts/calendar-context";
import { AddEditEventDialog } from "@/components/calendar/dialogs/add-edit-event-dialog";
import { formatTime } from "@/components/calendar/helpers";
import { deleteEventFromErp } from "@/services/event.service";
export function EventDetailsDialog({
	event,
	children
}) {
	const [open, setOpen] = useState(false);
	const startDate = parseISO(event.startDate);
	const endDate = parseISO(event.endDate);
	const { use24HourFormat, removeEvent } = useCalendar();
	const deleteLockRef = useRef(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild onClick={() => setOpen(true)}>{children}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{event.title}</DialogTitle>
				</DialogHeader>

				<ScrollArea className="max-h-[80vh]">
					<div className="space-y-4 p-4">
						<div className="flex items-start gap-2">
							<User className="mt-1 size-4 shrink-0 text-muted-foreground" />
							<div>
								<p className="text-sm font-medium">Responsible</p>
								<p className="text-sm text-muted-foreground">
									{event.owner.name ?? event.owner.name}
								</p>
							</div>
						</div>

						<div className="flex items-start gap-2">
							<Calendar className="mt-1 size-4 shrink-0 text-muted-foreground" />
							<div>
								<p className="text-sm font-medium">Start Date</p>
								<p className="text-sm text-muted-foreground">
									{format(startDate, "EEEE dd MMMM")}
									<span className="mx-1">at</span>
									{formatTime(parseISO(event.startDate), use24HourFormat)}
								</p>
							</div>
						</div>

						<div className="flex items-start gap-2">
							<Clock className="mt-1 size-4 shrink-0 text-muted-foreground" />
							<div>
								<p className="text-sm font-medium">End Date</p>
								<p className="text-sm text-muted-foreground">
									{format(endDate, "EEEE dd MMMM")}
									<span className="mx-1">at</span>
									{formatTime(parseISO(event.endDate), use24HourFormat)}
								</p>
							</div>
						</div>

						<div className="flex items-start gap-2">
							<Text className="mt-1 size-4 shrink-0 text-muted-foreground" />
							<div>
								<p className="text-sm font-medium">Description</p>
								<p className="text-sm text-muted-foreground">
									{event.description}
								</p>
							</div>
						</div>
					</div>
				</ScrollArea>
				<div className="flex justify-end gap-2">
					<AddEditEventDialog event={event}>
						<Button variant="outline">Edit</Button>
					</AddEditEventDialog>
					<Button
						variant="destructive"
						onClick={async () => {
							if (deleteLockRef.current) return;
							deleteLockRef.current = true;
						  
							try {
							  await deleteEventFromErp(event.erpName); // SINGLE SOURCE
							  removeEvent(event.erpName);              // UI update
							  setOpen(false);
							  toast.success("Event deleted successfully.");
							} catch (e) {
							  toast.error("Error deleting event.");
							} finally {
							  deleteLockRef.current = false;
							}
						  }}
						  
					>
						Delete
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
