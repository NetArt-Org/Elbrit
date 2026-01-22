import { zodResolver } from "@hookform/resolvers/zod";
import { addMinutes, differenceInCalendarDays, set } from "date-fns";
import { useEffect, useMemo, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { LOGGED_IN_USER } from "@/components/auth/calendar-users";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { TAGS } from "@/components/calendar/mocks";
import { mapFormToErpEvent } from "@/services/event-to-erp-graphql";
import { saveDocToErp, saveEvent } from "@/services/event.service";
import { useWatch } from "react-hook-form";

import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

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

import { useCalendar } from "@/components/calendar/contexts/calendar-context";
import { useDisclosure } from "@/components/calendar/hooks";
import { eventSchema } from "@/components/calendar/schemas";
import { buildCalendarParticipants } from "@/lib/utils";
import { RHFCombobox } from "@/components/ui/RHFCombobox";
import { TAG_FORM_CONFIG } from "@/lib/calendar/form-config";
import { loadParticipantOptionsByTag } from "@/lib/participants";
import { TimePicker } from "@/components/ui/TimePicker";
import { mapFormToErpTodo } from "@/services/todo-to-erp-graphql";
import { mapErpTodoToCalendar } from "@/services/erp-todo-to-calendar";

export function AddEditEventDialog({
	children,
	event,
	defaultTag,
}) {
	const { isOpen, onClose, onToggle } = useDisclosure();
	const { addEvent, updateEvent } = useCalendar();
	const isEditing = !!event;
	const [hqTerritoryOptions, setHqTerritoryOptions] = useState([]);
	const [doctorOptions, setDoctorOptions] = useState([]);
	const [employeeOptions, setEmployeeOptions] = useState([]);
	const endDateTouchedRef = useRef(false); // existing
	const initialDates = useMemo(() => {
		if (!event) {
			const now = new Date();
			return {
				startDate: now,
				endDate: addMinutes(now, 60),
			};
		}
		return {
			startDate: new Date(event.startDate),
			endDate: new Date(event.endDate),
		};
	}, [event]);

	const form = useForm({
		resolver: zodResolver(eventSchema),
		defaultValues: {
			title: event?.title ?? "",
			description: event?.description ?? "",
			startDate: initialDates.startDate,
			endDate: initialDates.endDate,
			tags: event?.tags ?? defaultTag ?? "Other",
			hqTerritory: event?.hqTerritory ?? "",
			employees: undefined,
			doctor: undefined,
			// Leave
			leaveType: undefined,
			reportTo: undefined,
			medicalAttachment: undefined,
			allDay: false,
			todoStatus: "Open",
			priority: "Medium",
		},
	});

	const startDate = useWatch({ control: form.control, name: "startDate" });
	const endDate = useWatch({ control: form.control, name: "endDate" });
	const allDay = useWatch({ control: form.control, name: "allDay" });
	const selectedTag = form.watch("tags");
	const tagConfig = TAG_FORM_CONFIG[selectedTag] ?? TAG_FORM_CONFIG.DEFAULT;
	const isMulti = tagConfig?.employee?.multiselect === true;
	const isFieldVisible = (field) => {
		if (tagConfig.show) return tagConfig.show.includes(field);
		if (tagConfig.hide) return !tagConfig.hide.includes(field);
		return true;
	};

	const getFieldLabel = (field, fallback) => {
		return tagConfig.labels?.[field] ?? fallback;
	};

	/* ---------------------------------------------
	   TODO: FORCE START DATE = NOW (HIDDEN)
	--------------------------------------------- */
	useEffect(() => {
		if (selectedTag !== "Todo List") return;
		if (isEditing) return;

		const now = new Date();

		form.setValue("startDate", now, {
			shouldDirty: false,
			shouldValidate: false,
		});
	}, [selectedTag]);

	/* ---------------------------------------------
		 RESET MANUAL FLAG ONLY WHEN START DATE CHANGES
		 ✅ FIX – prevents overwriting manual edits
	  --------------------------------------------- */
	useEffect(() => {
		endDateTouchedRef.current = false;
	}, [startDate]);
	/* ---------------------------------------------
	   LOAD PARTICIPANTS (UNCHANGED)
	--------------------------------------------- */
	useEffect(() => {
		if (!isOpen || !event?.participants?.length) return;

		const employeeIds = event.participants
			.filter((p) => p.type === "Employee")
			.map((p) => p.id);

		const doctor = event.participants.find(
			(p) => p.type === "Lead"
		);

		if (employeeIds.length) {
			form.setValue(
				"employees",
				tagConfig.employee?.multiselect
					? employeeIds
					: employeeIds[0],
				{ shouldDirty: false, shouldValidate: false }
			);
		}

		if (doctor) {
			form.setValue("doctor", doctor.id, {
				shouldDirty: false,
				shouldValidate: false,
			});
		}
	}, [isOpen, event?.participants]);

	useEffect(() => {
		if (!isOpen) return;

		// ❗ NEVER reset in edit mode
		if (!isEditing) {
			form.reset(form.getValues());
		}
	}, [isOpen, isEditing]);

	/* ---------------------------------------------
	   FORCE ALL-DAY CHECKBOX ONLY
	   ❌ No time/date mutation
	--------------------------------------------- */
	useEffect(() => {
		if (!tagConfig?.forceAllDay) return;

		form.setValue("allDay", true, {
			shouldDirty: false,
			shouldValidate: false,
		});
	}, [selectedTag]);

	/* --------------------------------------------------
	   AUTO TITLE (SAFE)
	-------------------------------------------------- */
	useEffect(() => {
		if (isEditing) return;
		if (!tagConfig.autoTitle) return;

		const values = form.getValues();
		const title = tagConfig.autoTitle(values, {
			doctorOptions,
			employeeOptions,
		});

		if (title && values.title !== title) {
			form.setValue("title", title, {
				shouldDirty: false,
				shouldValidate: false,
			});
		}
	}, [
		startDate,
		selectedTag,
		doctorOptions,
		employeeOptions
	]);


	/* --------------------------------------------------
	   AUTO SELECT LOGGED IN USER
	-------------------------------------------------- */
	useEffect(() => {
		if (!selectedTag) return;

		loadParticipantOptionsByTag({
			tag: selectedTag,
			employeeOptions,
			hqTerritoryOptions,
			doctorOptions,
			setEmployeeOptions,
			setHqTerritoryOptions,
			setDoctorOptions,
		});

		// 🔒 ABSOLUTE GUARD
		if (isEditing) return;

		if (!tagConfig.employee?.autoSelectLoggedIn) return;

		const value = tagConfig.employee.multiselect
			? [LOGGED_IN_USER.id]
			: LOGGED_IN_USER.id;

		form.setValue("employees", value, { shouldDirty: false });
	}, [selectedTag]);

	/* ---------------------------------------------
   NON-MEETING DATE LOGIC (MEETING-LIKE)
   ✅ FIX – guarded writes only
--------------------------------------------- */
	useEffect(() => {
		if (!startDate) return;
		if (selectedTag === "Meeting" || selectedTag === "Birthday") return;
		if (endDateTouchedRef.current) return;

		const now = new Date();

		const normalizedStart = set(startDate, {
			hours: now.getHours(),
			minutes: now.getMinutes(),
			seconds: 0,
		});

		if (startDate.getTime() !== normalizedStart.getTime()) {
			form.setValue("startDate", normalizedStart, { shouldDirty: false });
			return;
		}

		if (!form.getValues("endDate")) return;

		const normalizedEnd = set(startDate, {
			hours: 23,
			minutes: 59,
			seconds: 59,
		});

		if (endDate?.getTime() !== normalizedEnd.getTime()) {
			form.setValue("endDate", normalizedEnd, { shouldDirty: false });
		}
	}, [startDate, selectedTag]);
	/* ---------------------------------------------
   MEETING TIME LOGIC (MERGED)
--------------------------------------------- */
	useEffect(() => {
		if (selectedTag !== "Meeting") return;
		if (!startDate) return;
		// ❌ DO NOT override manual edits
		if (endDateTouchedRef.current) return;
		// 🟢 ALL DAY LOGIC
		if (allDay) {
			const now = new Date();

			const start = set(startDate, {
				hours: now.getHours(),
				minutes: now.getMinutes(),
				seconds: 0,
			});

			const end = set(startDate, {
				hours: 23,
				minutes: 59,
				seconds: 59,
			});

			form.setValue("startDate", start, { shouldDirty: true });
			form.setValue("endDate", end, { shouldDirty: true });
			return;
		}

		// 🟢 NORMAL MEETING (NOT ALL DAY)
		const newEnd = addMinutes(startDate, 60);

		form.setValue("endDate", newEnd, { shouldDirty: true });

	}, [selectedTag, startDate, allDay]);

	/* --------------------------------------------------
   SUBMIT
-------------------------------------------------- */
const onSubmit = async (values) => {
	if (values.tags === "Birthday" && !values.endDate) {
	  values.endDate = values.startDate;
	}
  
	if (selectedTag === "Leave") {
	  const days =
		differenceInCalendarDays(values.endDate, values.startDate) + 1;
  
	  if (days > 2 && !values.medicalAttachment) {
		toast.error("Medical certificate required");
		return;
	  }
	}
  
	/* ==================================================
	   EVENT FLOW
	================================================== */
	const erpDoc = mapFormToErpEvent(values, {
	  erpName: event?.erpName,
	});
  
	console.log("ERP DOC", erpDoc);
  
	const saved = await saveEvent(erpDoc);
  
	const calendarEvent = {
	  ...(event ?? {}),
	  erpName: saved.name,
	  title: values.title,
	  description: values.description,
	  startDate: erpDoc.starts_on,
	  endDate: erpDoc.ends_on,
	  color: tagConfig.fixedColor,
	  tags: values.tags,
	  owner: isEditing ? event.owner : LOGGED_IN_USER.id,
	  hqTerritory: values.hqTerritory || "",
	  participants: buildCalendarParticipants(
		values,
		employeeOptions,
		doctorOptions
	  ),
	};
  
	console.log("Calendar DOC", calendarEvent);
  
	event ? updateEvent(calendarEvent) : addEvent(calendarEvent);
  
	toast.success("Event saved");
  
	/* ==================================================
	   TODO LIST FLOW (API ONLY — UI COMMENTED)
	================================================== */
	if (values.tags === "Todo List") {
	  const todoDoc = mapFormToErpTodo(values, {
		erpName: event?.erpName,
		employeeOptions,
		referenceEventName: saved?.name, // ✅ correct field
	  });
  
	  console.log("ERP TODO DOC", todoDoc);
  
	  const savedTodo = await saveDocToErp(todoDoc);
  
	  /*
	  const calendarTodo = mapErpTodoToCalendar({
		...todoDoc,
		name: savedTodo.name,
	  });
  
	  console.log("Calendar TODO DOC", calendarTodo);
  
	  event ? updateEvent(calendarTodo) : addEvent(calendarTodo);
  
	  toast.success("Todo saved");
	  onClose();
	  */
	  onClose();
	  return;
	}
  };
  

	return (
		<Modal open={isOpen} onOpenChange={onToggle}>
			<ModalTrigger asChild>{children}</ModalTrigger>

			<ModalContent>
				<ModalHeader>
					<ModalTitle>{isEditing ? "Edit Event" : "Add Event"}</ModalTitle>
					<ModalDescription />
				</ModalHeader>

				<Form {...form}>
					<form
						id="event-form"
						onSubmit={form.handleSubmit(onSubmit)}
						className="grid gap-4"
					>
						{/* TAGS */}
						<FormField
							control={form.control}
							name="tags"
							render={({ field }) => (
								<div className="flex flex-wrap gap-2">
									{TAGS.map((tag) => (
										<button
											key={tag.id}
											type="button"
											onClick={() => field.onChange(tag.id)}
											className={`px-4 py-1 rounded-full ${field.value === tag.id
												? "bg-black text-white"
												: "bg-muted"
												}`}
										>
											{tag.label}
										</button>
									))}
								</div>
							)}
						/>

						{/* TITLE ALWAYS BELOW TAGS */}
						{!tagConfig.hide?.includes("title") && (
							<FormField
								control={form.control}
								name="title"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Title</FormLabel>
										<FormControl>
											<Input placeholder="Enter title" {...field} />
										</FormControl>
									</FormItem>
								)}
							/>
						)}
						{selectedTag === "HQ Tour Plan" && (
							<FormField
								control={form.control}
								name="hqTerritory"
								render={({ field }) => (
									<FormItem>
										<FormLabel>HQ Territory</FormLabel>
										<FormControl>
											<RHFCombobox
												options={hqTerritoryOptions}
												value={field.value}
												onChange={field.onChange}
												placeholder="Select HQ Territory"
											/>
										</FormControl>
									</FormItem>
								)}
							/>
						)}
						{/* DOCTOR FIRST */}
						{!tagConfig.hide?.includes("doctor") && (
							<FormField
								control={form.control}
								name="doctor"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Doctor</FormLabel>
										<FormControl>
											<RHFCombobox
												options={doctorOptions}
												value={field.value}
												onChange={field.onChange}
												placeholder="Select doctor"
											/>
										</FormControl>
									</FormItem>
								)}
							/>
						)}
						{selectedTag === "Meeting" ? (
							<>
								{/* DATE ROW */}
								<div className="grid grid-cols-2 gap-3">
									<FormField
										control={form.control}
										name="startDate"
										render={({ field }) => (
											<DateTimePicker
												form={form}
												field={field}
												hideTime={true}
												label="Start Date"
											/>
										)}
									/>

									<FormField
										control={form.control}
										name="endDate"
										render={({ field }) => (
											<DateTimePicker
												form={form}
												field={{
													...field,
													onChange: (date) => {
														endDateTouchedRef.current = true;
														field.onChange(date);
													},
												}}
												hideTime={true}
												label="End Date"
											/>

										)}
									/>
								</div>

								{/* ALL DAY */}
								<FormField
									control={form.control}
									name="allDay"
									render={({ field }) => (
										<FormItem className="flex items-center gap-2">
											<Checkbox
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
											<FormLabel style={{ marginTop: 0 }}>All day</FormLabel>
										</FormItem>
									)}
								/>

								{/* TIME ROW */}
								{!form.watch("allDay") && (
									<div className="grid grid-cols-2 gap-3">
										{/* START TIME */}
										<FormField
											control={form.control}
											name="startDate"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Start Time</FormLabel>
													<TimePicker
														value={field.value}
														onChange={(date) => field.onChange(date)}
														use24Hour={false}
													/>
												</FormItem>
											)}
										/>

										{/* END TIME */}
										<FormField
											control={form.control}
											name="endDate"
											render={({ field }) => (
												<FormItem>
													<FormLabel>End Time</FormLabel>
													<TimePicker
														value={field.value}
														onChange={(date) => {
															endDateTouchedRef.current = true;
															field.onChange(date);
														}}
														use24Hour={false}
														minTime={startDate}
													/>
												</FormItem>
											)}
										/>
									</div>
								)}
							</>
						) : (
							/* EXISTING NON-MEETING LOGIC (UNCHANGED) */
							<div
								className={`grid gap-3 ${isFieldVisible("startDate") && isFieldVisible("endDate")
										? "grid-cols-2"
										: "grid-cols-1"
									}`}
							>
								{/* START DATE */}
								{isFieldVisible("startDate") && (
									<FormField
										control={form.control}
										name="startDate"
										render={({ field }) => (
											<DateTimePicker
												form={form}
												field={field}
												label={getFieldLabel("startDate", "Start Date")}
												hideTime={tagConfig.dateOnly}
												allowAllDates={selectedTag === "Birthday"}
											/>
										)}
									/>
								)}

								{/* END / DUE DATE */}
								{isFieldVisible("endDate") && (
									<FormField
										control={form.control}
										name="endDate"
										render={({ field }) => (
											<DateTimePicker
												form={form}
												field={{
													...field,
													onChange: (date) => {
														endDateTouchedRef.current = true;
														field.onChange(date);
													},
												}}
												label={getFieldLabel("endDate", "End Date")}
												hideTime={tagConfig.dateOnly}
											/>
										)}
									/>
								)}
							</div>
						)}


						{/* EMPLOYEES */}
						{!tagConfig.hide?.includes("employees") &&
							(!tagConfig.employee?.autoSelectLoggedIn ||
								tagConfig.employee?.multiselect) && (
								<FormField
									control={form.control}
									name="employees"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Employees</FormLabel>
											<FormControl>
												<RHFCombobox
													value={field.value}
													onChange={field.onChange}
													options={employeeOptions}
													placeholder="Select employees"
													searchPlaceholder="Search employee"
													multiple={isMulti}
												/>
											</FormControl>
										</FormItem>
									)}
								/>
							)}
						{selectedTag === "Todo List" && (
							<div className="grid grid-cols-2 gap-3">
								<FormField
									control={form.control}
									name="todoStatus"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Status</FormLabel>
											<Select value={field.value} onValueChange={field.onChange}>
												<SelectTrigger>
													<SelectValue placeholder="Select status" />
												</SelectTrigger>
												<SelectContent>
													{["Open", "Closed", "Cancelled"].map((s) => (
														<SelectItem key={s} value={s}>
															{s}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="priority"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Priority</FormLabel>
											<Select value={field.value} onValueChange={field.onChange}>
												<SelectTrigger>
													<SelectValue placeholder="Select priority" />
												</SelectTrigger>
												<SelectContent>
													{["High", "Medium", "Low"].map((p) => (
														<SelectItem key={p} value={p}>
															{p}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</FormItem>
									)}
								/>
							</div>
						)}

						{/* LEAVE EXTRA */}
						{selectedTag === "Leave" && (
							<>
								<FormField
									control={form.control}
									name="leaveType"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Leave Type</FormLabel>
											<Select
												value={field.value}
												onValueChange={field.onChange}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select leave type" />
												</SelectTrigger>
												<SelectContent>
													{["SL", "PL", "CL", "ML"].map((t) => (
														<SelectItem key={t} value={t}>
															{t}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</FormItem>
									)}
								/>

								<div className="text-sm text-muted-foreground">
									Balance: 10 / 12
								</div>

								<FormField
									control={form.control}
									name="medicalAttachment"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Medical Certificate</FormLabel>
											<Input type="file" onChange={field.onChange} />
										</FormItem>
									)}
								/>
							</>
						)}

						{!tagConfig.hide?.includes("description") && (
							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Description</FormLabel>
										<Textarea {...field} />
									</FormItem>
								)}
							/>
						)}
					</form>
				</Form>
				<div className="pt-4">
					<ModalFooter>
						<ModalClose asChild>
							<Button variant="outline">Cancel</Button>
						</ModalClose>
						<Button type="submit" form="event-form">
							{isEditing ? "Update Event" : "Create Event"}
						</Button>
					</ModalFooter>
				</div>
			</ModalContent>
		</Modal>
	);
}
