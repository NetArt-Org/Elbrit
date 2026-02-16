"use client";;
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@calendar/components/ui/button";
import { TAG_FORM_CONFIG } from "@calendar/lib/calendar/form-config";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@calendar/components/ui/dialog";
import { ScrollArea } from "@calendar/components/ui/scroll-area";
import { useCalendar } from "@calendar/components/calendar/contexts/calendar-context";
import { AddEditEventDialog } from "@calendar/components/calendar/dialogs/add-edit-event-dialog";
import { deleteEventFromErp, saveEvent } from "@calendar/services/event.service";
import { EventDetailsFields } from "@calendar/components/calendar/dialogs/EventDetailsFields";
import { TAG_IDS } from "../mocks";
import { LOGGED_IN_USER } from "@calendar/components/auth/calendar-users";
import { resolveDoctorVisitState } from "@calendar/lib/doctorVisitState";
export async function joinDoctorVisit({ erpName, existingParticipants, employeeId }) {
	return saveEvent({
		name: erpName,
		event_participants: [
			...existingParticipants,
			{
				reference_doctype: "Employee",
				reference_docname: employeeId,
			},
		],
	});
}


export function EventDetailsDialog({
	event,
	children
}) {
	const isDoctorVisit = event.tags === TAG_IDS.DOCTOR_VISIT_PLAN;
	const visitState = resolveDoctorVisitState(
		event,
		LOGGED_IN_USER.id
	);

	const isEmployeeParticipant =
		event.event_participants?.some(
			(p) =>
				p.reference_doctype === "Employee" &&
				String(p.reference_docname) === String(LOGGED_IN_USER.id)
		) ?? false;

	const canJoinVisit = isDoctorVisit && !isEmployeeParticipant;

	const canVisitNow = isDoctorVisit && isEmployeeParticipant;
	const [open, setOpen] = useState(false);
	const { use24HourFormat, removeEvent, employeeOptions, doctorOptions, addEvent } = useCalendar();
	const deleteLockRef = useRef(false);
	const tagConfig =
		TAG_FORM_CONFIG[event.tags] ?? TAG_FORM_CONFIG.DEFAULT;

	const canDelete =
		tagConfig.ui?.allowDelete?.(event) ?? true;
	const canEdit =
		tagConfig.ui?.allowEdit?.(event) ?? true;
	const editAction = tagConfig.ui?.primaryEditAction;
	const eventWithOptions = {
		...event,
		_employeeOptions: employeeOptions,
		_doctorOptions: doctorOptions,
	};
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild onClick={() => setOpen(true)}>{children}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{event.title}</DialogTitle>
				</DialogHeader>

				<ScrollArea className="max-h-[80vh]">
					<div className="p-4">
						<EventDetailsFields
							event={eventWithOptions}
							config={tagConfig}
							use24HourFormat={use24HourFormat}
						/>
					</div>
				</ScrollArea>
				<div className="flex justify-end gap-2">
					{canEdit && (
						<>
							{/* Join Visit */}
							{canJoinVisit && (
								<Button variant="outline"
									onClick={async () => {
										try {
											const existingParticipants =
												event.event_participants?.map((p) => ({
													reference_doctype: p.reference_doctype,
													reference_docname: p.reference_docname,
												})) || [];

											await joinDoctorVisit({
												erpName: event.erpName,
												existingParticipants,
												employeeId: LOGGED_IN_USER.id,
											});
											const updated = rebuildCalendarEvent(
												event,
												updatedErpParticipants,
												{ employeeOptions, doctorOptions }
											);

											removeEvent(event.erpName);
											addEvent(updated);

											toast.success("You have joined the visit");
											setOpen(false);
										} catch (err) {
											console.error(err);
											toast.error("Failed to join visit");
										}
									}}
								>
									Join Visit
								</Button>
							)}
							{visitState.needsLocation && (
								<Button
									variant="secondary"
									onClick={async () => {
										try {
											await submitDoctorVisitLocation({
												event,
												loggedInUserId: LOGGED_IN_USER.id,
												removeEvent,
												addEvent,
											});

											toast.success("Location submitted successfully");
											setOpen(false);
										} catch (err) {
											toast.error("Failed to fetch location");
										}
									}}
								>
									Request Location
								</Button>
							)}
							{/* Visit Now (Primary Edit Action) */}
							{canVisitNow && (
								<AddEditEventDialog
									event={event}
									forceValues={editAction?.setOnEdit}
								>
									<Button variant="success">
										{editAction?.label ?? "Visit Now"}
									</Button>
								</AddEditEventDialog>
							)}

							{/* Normal Edit (Non-doctor events) */}
							{!isDoctorVisit && (
								<AddEditEventDialog
									event={event}
									forceValues={editAction?.setOnEdit}
								>
									<Button variant="outline">
										{editAction?.label ?? "Edit"}
									</Button>
								</AddEditEventDialog>
							)}
						</>
					)}

					{canDelete && (
						<Button
							variant="destructive"
							onClick={async () => {
								if (deleteLockRef.current) return;
								deleteLockRef.current = true;

								try {
									await deleteEventFromErp(event.erpName);
									removeEvent(event.erpName);
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
					)}
				</div>

			</DialogContent>
		</Dialog>
	);
}

function rebuildCalendarEvent(event, updatedErpParticipants, options) {
	return {
		...event,
		event_participants: updatedErpParticipants,
		participants: buildParticipantsWithDetails(
			updatedErpParticipants,
			options
		),
	};
}
