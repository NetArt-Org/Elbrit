import { zodResolver } from "@hookform/resolvers/zod";
import { addMinutes, set } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TAGS, PARTICIPANT_SOURCE_BY_TAG } from "@/components/calendar/mocks";
import { mapFormToErpEvent } from "@/services/event.mapper";
import { saveEvent } from "@/services/event.service";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { CURRENT_USER } from "@/components/auth/calendar-users";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Modal,
	ModalClose,
	ModalContent,
	ModalDescription,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	ModalTrigger,
} from "@/components/ui/responsive-modal";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { COLORS } from "@/components/calendar/constants";
import { useCalendar } from "@/components/calendar/contexts/calendar-context";
import { useDisclosure } from "@/components/calendar/hooks";
import { eventSchema } from "@/components/calendar/schemas";
import { buildCalendarParticipants } from "@/lib/utils";
import { RHFCombobox } from "@/components/ui/RHFCombobox";
import { loadParticipantOptionsByTag, setParticipantFormDefaults } from "@/lib/participants";

export function AddEditEventDialog({
	children,
	startDate,
	startTime,
	event, defaultTag,
}) {
	const { isOpen, onClose, onToggle } = useDisclosure();
	const { addEvent, updateEvent } = useCalendar();
	const isEditing = !!event;
	const [employeeOptions, setEmployeeOptions] = useState([]);
	const [salesPartnerOptions, setSalesPartnerOptions] = useState([]);

	const initialDates = useMemo(() => {
		if (!isEditing && !event) {
			if (!startDate) {
				const now = new Date();
				return { startDate: now, endDate: addMinutes(now, 30) };
			}
			const start = startTime
				? set(new Date(startDate), {
					hours: startTime.hour,
					minutes: startTime.minute,
					seconds: 0,
				})
				: new Date(startDate);
			const end = addMinutes(start, 30);
			return { startDate: start, endDate: end };
		}

		return {
			startDate: new Date(event.startDate),
			endDate: new Date(event.endDate),
		};
	}, [startDate, startTime, event, isEditing]);

	const form = useForm({
		resolver: zodResolver(eventSchema),
		defaultValues: {
			title: event?.title ?? "",
			description: event?.description ?? "",
			startDate: initialDates.startDate,
			endDate: initialDates.endDate,
			color: event?.color ?? "blue",
			tags: event?.tags ?? defaultTag ?? "Event",
			employees: undefined,
			salesPartner: undefined,
		},
	});

	useEffect(() => {
		if (!isOpen) return;

		form.reset({
			title: event?.title ?? "",
			description: event?.description ?? "",
			startDate: initialDates.startDate,
			endDate: initialDates.endDate,
			color: event?.color ?? "blue",
			tags: event?.tags ?? defaultTag ?? "Event",
		});
	}, [isOpen, event]);

	const selectedTag = form.watch("tags");
	useEffect(() => {
		loadParticipantOptionsByTag({
		  tag: selectedTag,
		  employeeOptions,
		  salesPartnerOptions,
		  setEmployeeOptions,
		  setSalesPartnerOptions,
		});
	  }, [selectedTag]);

	const onSubmit = async (values) => {
		if (isEditing && !event?.erpName) {
			toast.error("This event cannot be edited");
			return;
		}

		try {
			const erpDoc = mapFormToErpEvent(values, {
				erpName: event?.erpName,
			});
			// ✅ TESTING ONLY — log payload
			const saved = await saveEvent(erpDoc);

			const calendarEvent = {
				...(event ?? {}),
				erpName: saved.name,
				title: values.title,
				description: values.description,
				startDate: erpDoc.starts_on,
				endDate: erpDoc.ends_on,
				color: values.color,
				tags: values.tags,
				owner: CURRENT_USER,
				participants: buildCalendarParticipants(
					values,
					employeeOptions,
					salesPartnerOptions
				),
			};

			event?.erpName
				? updateEvent(calendarEvent)
				: addEvent(calendarEvent);

			toast.success("Event saved successfully");

			// ✅ CLOSE FIRST
			onClose();

			// ✅ RESET AFTER CLOSE (next tick)
			setTimeout(() => {
				form.reset();
			}, 0);

		} catch (error) {
			console.error("Save Event failed:", error);
			toast.error(
				error?.message || "Unable to save event. Please try again."
			);
		}
	};
	useEffect(() => {
		setParticipantFormDefaults({ isOpen, event, form });
	  }, [isOpen, event]);
	  
	return (
		<Modal open={isOpen} onOpenChange={onToggle} modal={true}>
			<ModalTrigger asChild>{children}</ModalTrigger>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>{isEditing ? "Edit Event" : "Add New Event"}</ModalTitle>
					<ModalDescription>
						{isEditing
							? "Modify your existing event."
							: "Create a new event for your calendar."}
					</ModalDescription>
				</ModalHeader>

				<Form {...form}>
					<form
						id="event-form"
						onSubmit={form.handleSubmit(onSubmit)}
						className="grid gap-4 py-4">

						<FormField
							control={form.control}
							name="title"
							render={({ field, fieldState }) => (
								<FormItem>
									<FormLabel htmlFor="title" className="required">
										Title
									</FormLabel>
									<FormControl>
										<Input
											id="title"
											placeholder="Enter a title"
											{...field}
											className={fieldState.invalid ? "border-red-500" : ""} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)} />
						<FormField
							control={form.control}
							name="tags"
							render={({ field }) => (
								<FormItem>
									<FormControl>
										<div className="flex flex-wrap gap-2">
											{TAGS.map((tag) => {
												const isActive = String(field.value) === tag.id;
												return (
													<button
														key={tag.id}
														type="button"
														onClick={() => field.onChange(tag.id)}
														className={`
                  rounded-full px-4 py-1.5 text-sm font-medium transition
                  ${isActive
																? "bg-black text-white shadow"
																: "bg-muted text-muted-foreground hover:bg-muted/70"
															}
                `}
													>
														{tag.label}
													</button>
												);
											})}
										</div>
									</FormControl>

									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="grid grid-cols-2 gap-3">
							<FormField
								control={form.control}
								name="startDate"
								render={({ field }) => (
									<DateTimePicker form={form} field={field} hideTime
										defaultHour={0}
										defaultMinute={0} />
								)} />
							<FormField
								control={form.control}
								name="endDate"
								render={({ field }) => (
									<DateTimePicker form={form} field={field} hideTime
										defaultHour={0}
										defaultMinute={0} />
								)} />
						</div>
						{PARTICIPANT_SOURCE_BY_TAG[selectedTag]?.includes("EMPLOYEE") && (
							<FormField
								control={form.control}
								name="employees"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Employee</FormLabel>
										<FormControl>
											<RHFCombobox
												value={field.value}
												onChange={field.onChange}
												options={employeeOptions}
												placeholder="Select employee"
												searchPlaceholder="Search employee..."
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						{PARTICIPANT_SOURCE_BY_TAG[selectedTag]?.includes("SALESPARTNER") && (
							<FormField
								control={form.control}
								name="salesPartner"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Doctor / Institute</FormLabel>
										<FormControl>
											<RHFCombobox
												value={field.value}
												onChange={field.onChange}
												options={salesPartnerOptions}
												placeholder="Select doctor / institute"
												searchPlaceholder="Search doctor / institute..."
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						<FormField
							control={form.control}
							name="color"
							render={({ field, fieldState }) => (
								<FormItem>
									<FormLabel className="required">Variant</FormLabel>
									<FormControl>
										<Select value={field.value} onValueChange={field.onChange}>
											<SelectTrigger
												className={`w-full ${fieldState.invalid ? "border-red-500" : ""
													}`}>
												<SelectValue placeholder="Select a variant" />
											</SelectTrigger>
											<SelectContent>
												{COLORS.map((color) => (
													<SelectItem value={color} key={color}>
														<div className="flex items-center gap-2">
															<div className={`size-3.5 rounded-full bg-${color}-600 dark:bg-${color}-700`} />
															{color}
														</div>
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)} />
						<FormField
							control={form.control}
							name="description"
							render={({ field, fieldState }) => (
								<FormItem>
									<FormLabel className="required">Description</FormLabel>
									<FormControl>
										<Textarea
											{...field}
											placeholder="Enter a description"
											className={fieldState.invalid ? "border-red-500" : ""} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)} />
					</form>
				</Form>
				<ModalFooter className="flex justify-end gap-2">
					<ModalClose asChild>
						<Button type="button" variant="outline">
							Cancel
						</Button>
					</ModalClose>
					<Button form="event-form" type="submit">
						{isEditing ? "Save Changes" : "Create Event"}
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}
