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
import { saveDocToErp, saveEvent, fetchEmployeeLeaveBalance, saveLeaveApplication } from "@/services/event.service";
import { useWatch } from "react-hook-form";
import { LeaveTypeCards } from "@/components/calendar/leave/LeaveTypeCards";
import { TodoWysiwyg } from "@/components/ui/TodoWysiwyg";
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
import { mapFormToErpTodo, mapErpTodoToCalendar } from "@/services/todo-to-erp-graphql";
import { mapErpLeaveToCalendar, mapFormToErpLeave } from "@/services/leave-to-erp";
import { useEmployeeResolvers } from "@/lib/employeeResolver";

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
	const [leaveBalance, setLeaveBalance] = useState(null);
	const [leaveLoading, setLeaveLoading] = useState(false);
	const employeeResolvers = useEmployeeResolvers(employeeOptions);

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
		mode: "onChange",
		defaultValues: {
			title: event?.title ?? "",
			description: event?.description ?? "",
			startDate: initialDates.startDate,
			endDate: initialDates.endDate,
			tags: event?.tags ?? defaultTag ?? "Other",
			hqTerritory: event?.hqTerritory ?? "",
			employees: undefined,
			doctor: undefined,
			leaveType: "Casual Leave",
			reportTo: undefined,
			medicalAttachment: undefined,
			allDay: false,
			todoStatus: "Open",
			priority: "Medium",
			leavePeriod: "Full",
			halfDayDate: undefined,
			approvedBy:undefined
		},
	});

	const startDate = useWatch({ control: form.control, name: "startDate" });
	const endDate = useWatch({ control: form.control, name: "endDate" });
	const allDay = useWatch({ control: form.control, name: "allDay" });
	const leaveType = useWatch({ control: form.control, name: "leaveType", });
	const leavePeriod = useWatch({ control: form.control, name: "leavePeriod", });
	// approvedBy
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
	const resetFieldsOnTagChange = () => {
		// always reset these
		form.resetField("employees", { defaultValue: undefined });
		form.resetField("doctor", { defaultValue: undefined });
		form.resetField("hqTerritory", { defaultValue: "" });

		// Todo-only
		form.resetField("todoStatus", { defaultValue: "Open" });
		form.resetField("priority", { defaultValue: "Medium" });
		form.resetField("doctor", {
			defaultValue: isDoctorMulti ? [] : undefined,
		});

		form.resetField("title", { defaultValue: "" });
		// Leave-only — reset ONLY when leaving Leave
		if (selectedTag !== "Leave") {
			form.resetField("leaveType", { defaultValue: undefined });
			form.resetField("leavePeriod", { defaultValue: "Full" });
			form.resetField("medicalAttachment", { defaultValue: undefined });
		}
	};

	const leaveDays = useMemo(() => {
		if (selectedTag !== "Leave") return 0;
		if (!startDate || !endDate) return 0;

		// Half day is always 1 day logically
		if (leavePeriod === "Half") {
			const total =
				differenceInCalendarDays(endDate, startDate) + 1;
			return total - 0.5;
		}


		return differenceInCalendarDays(endDate, startDate) + 1;
	}, [selectedTag, startDate, endDate, leavePeriod]);
	const requiresMedical = useMemo(() => {
		if (selectedTag !== "Leave") return false;
		if (leaveType !== "Sick Leave") return false;

		const threshold =
			tagConfig.leave?.medicalCertificateAfterDays ?? 2;

		return leaveDays > threshold;
	}, [selectedTag, leaveType, leaveDays, tagConfig]);
	useEffect(() => {
		if (!requiresMedical) {
			form.setValue("medicalAttachment", undefined, {
				shouldDirty: false,
				shouldValidate: false,
			});
		}
	}, [requiresMedical]);

	const isDoctorMulti = tagConfig.doctor?.multiselect === true;
	const autoTitleRef = useRef(false);

	useEffect(() => {
		if (!isOpen) return;
		if (isEditing) return;

		resetFieldsOnTagChange();
		// ✅ CLEAR TITLE IF TAG HIDES IT
		if (tagConfig.hide?.includes("title")) {
			form.setValue("title", "", {
				shouldDirty: false,
				shouldValidate: false,
			});
		}
	}, [selectedTag]);
	/* ---------------------------------------------
		   Half day logic
		--------------------------------------------- */
	useEffect(() => {
		if (leavePeriod !== "Half") {
			form.setValue("halfDayDate", undefined, {
				shouldDirty: false,
				shouldValidate: false,
			});
		}
	}, [leavePeriod]); // 🔧 LEAVE HALF DAY FIX

	/* ---------------------------------------------
	   Leave Balance Fetching
	--------------------------------------------- */
	useEffect(() => {
		if (!isOpen || selectedTag !== "Leave") return;
		let alive = true;
		setLeaveLoading(true);

		fetchEmployeeLeaveBalance(LOGGED_IN_USER.id)
			.then((data) => {
				if (!alive) return;
				setLeaveBalance(data);
			})
			.catch((err) => {
				console.error("Leave balance error", err);
				setLeaveBalance({});
			})
			.finally(() => {
				if (alive) setLeaveLoading(false);
			});

		return () => {
			alive = false;
		};
	}, [isOpen, selectedTag]);

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
	   RESET FORM
	-------------------------------------------------- */
	// const initialDefaultsRef = useRef(form.getValues());

	useEffect(() => {
		if (!isOpen || isEditing) return;

		const now = new Date();
		const currentValues = form.getValues();

		form.reset({
			...currentValues,               // ✅ keeps title
			startDate: now,
			endDate: addMinutes(now, 60),
			tags: selectedTag,
		});
	}, [isOpen, selectedTag, isEditing]);


	/* --------------------------------------------------
	   AUTO TITLE (SAFE)
	-------------------------------------------------- */
	useEffect(() => {
		if (isEditing) return;
		if (!tagConfig.autoTitle) return;

		const values = form.getValues();

		const nextTitle = tagConfig.autoTitle(
			values,
			{ doctorOptions, employeeOptions }
		);

		if (!nextTitle) return;

		// ✅ overwrite only if auto-generated OR empty
		if (!values.title || autoTitleRef.current) {
			autoTitleRef.current = true;

			form.setValue("title", nextTitle, {
				shouldDirty: false,
				shouldValidate: false,
			});
		}
	}, [
		selectedTag,
		startDate,
		doctorOptions,
		employeeOptions,
		form.watch("doctor"),
		form.watch("employees"),
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

		const currentEnd = form.getValues("endDate");

		// Auto-fix ONLY if endDate is missing or invalid
		if (!currentEnd || currentEnd < startDate) {
			const normalizedEnd = set(startDate, {
				hours: 23,
				minutes: 59,
				seconds: 59,
			});

			form.setValue("endDate", normalizedEnd, {
				shouldDirty: false,
				shouldValidate: false,
			});
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
		/* ==================================================
		   NORMALIZATION
		================================================== */
		if (values.tags === "Birthday" && !values.endDate) {
			values.endDate = values.startDate;
		}

		/* ==================================================
		   LEAVE FLOW (ONLY)
		================================================== */
		if (values.tags === "Leave") {
			if (requiresMedical && !values.medicalAttachment) {
				toast.error("Medical certificate required");
				return;
			}


			const leaveDoc = mapFormToErpLeave(values);
			console.log("LEAVE DOC", leaveDoc);

			// const savedLeave = await saveLeaveApplication(leaveDoc);

			const calendarLeave = mapErpLeaveToCalendar({
				...leaveDoc,
				// name: savedLeave.name,
				color: "#DC2626",
			});

			// event ? updateEvent(calendarLeave) : addEvent(calendarLeave);
			// toast.success("Leave applied successfully");
			// onClose();
			return;
		}

		/* ==================================================
		   TODO LIST FLOW (ONLY)
		================================================== */
		if (values.tags === "Todo List") {
			const todoDoc = mapFormToErpTodo(values, employeeResolvers);


			console.log("ERP TODO DOC", todoDoc, values);

			const savedTodo = await saveDocToErp(todoDoc);

			const calendarTodo = mapErpTodoToCalendar({
				...todoDoc,
				name: savedTodo.name,
			}, employeeResolvers);
			console.log("CAlendar TODO DOC", calendarTodo);
			event ? updateEvent(calendarTodo) : addEvent(calendarTodo);
			toast.success("Todo saved");
			onClose();
			return;
		}

		/* ==================================================
		   DEFAULT EVENT FLOW
		================================================== */
		const erpDoc = mapFormToErpEvent(values, {
			erpName: event?.erpName,
		});

		console.log("ERP DOC", erpDoc);

		// const savedEvent = await saveEvent(erpDoc);

		const calendarEvent = {
			...(event ?? {}),
			// erpName: savedEvent.name,
			title: values.title,
			description: values.description,
			startDate: erpDoc.starts_on,
			endDate: erpDoc.ends_on,
			color: tagConfig.fixedColor,
			tags: values.tags,
			owner: event ? event.owner : LOGGED_IN_USER.id,
			hqTerritory: values.hqTerritory || "",
			participants: buildCalendarParticipants(
				values,
				employeeOptions,
				doctorOptions
			),
		};

		// event ? updateEvent(calendarEvent) : addEvent(calendarEvent);
		// toast.success("Event saved");
		// onClose();
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
						{selectedTag === "Leave" && (
							<>
								<FormField
									control={form.control}
									name="leaveType"
									render={({ field, fieldState }) => (
										<FormItem>
											<FormLabel>Leave Type</FormLabel>

											<LeaveTypeCards
												balance={leaveBalance}
												loading={leaveLoading}
												value={field.value}
												onChange={field.onChange}
											/>
											{field.value && leaveBalance?.[field.value] && (
												<div className="mt-2 text-sm text-muted-foreground">
													Balance:{" "}
													{leaveBalance[field.value].available}
													{" / "}
													{leaveBalance[field.value].allocated}
												</div>
											)}
											{fieldState.error && (
												<p className="text-sm text-red-500">
													{fieldState.error.message}
												</p>
											)}
										</FormItem>
									)}
								/>
							</>
						)}
						{/* TITLE ALWAYS BELOW TAGS */}
						{!tagConfig.hide?.includes("title") && (
							<FormField
								control={form.control}
								name="title"
								render={({ field, fieldState }) => (
									<FormItem>
										<FormLabel>Title</FormLabel>
										<FormControl>
											<Input placeholder="Enter title" {...field} />
										</FormControl>
										{fieldState.error && (
											<p className="text-sm text-red-500">
												{fieldState.error.message}
											</p>
										)}
									</FormItem>
								)}
							/>
						)}
						{selectedTag === "HQ Tour Plan" && (
							<FormField
								control={form.control}
								name="hqTerritory"
								render={({ field, fieldState }) => (
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
										{fieldState.error && (
											<p className="text-sm text-red-500">
												{fieldState.error.message}
											</p>
										)}
									</FormItem>
								)}
							/>
						)}
						{/* DOCTOR FIRST */}
						{!tagConfig.hide?.includes("doctor") && (
							<FormField
								control={form.control}
								name="doctor"
								render={({ field, fieldState }) => (
									<FormItem>
										<FormLabel>Doctor</FormLabel>
										<FormControl>
											<RHFCombobox
												options={doctorOptions}
												value={field.value}
												onChange={field.onChange}
												placeholder="Select doctor"
												multiple={isDoctorMulti}
												selectionLabel={'doctor'}
											/>
										</FormControl>
										{fieldState.error && (
											<p className="text-sm text-red-500">
												{fieldState.error.message}
											</p>
										)}
									</FormItem>
								)}
							/>
						)}
						{selectedTag === "Meeting" ? (
							<>
								{/* DATE ROW */}
								<div className="grid">
									<FormField
										control={form.control}
										name="startDate"
										render={({ field }) => (
											<DateTimePicker
												form={form}
												field={field}
												hideTime={true}
												label="Date"
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
								className={`grid gap-3 ${isFieldVisible("startDate") && isFieldVisible("endDate") || selectedTag === "Todo List"
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
								{selectedTag === "Todo List" && (
									<FormField
										control={form.control}
										name="priority"
										render={({ field, fieldState }) => (
											<FormItem className="flex flex-col" >
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
												{fieldState.error && (
													<p className="text-sm text-red-500">
														{fieldState.error.message}
													</p>
												)}
											</FormItem>
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
									render={({ field, fieldState }) => (
										<FormItem>
											<FormLabel> {selectedTag === "Todo List" ? "Allocated To" : "Employees"}</FormLabel>
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
											{fieldState.error && (
												<p className="text-sm text-red-500">
													{fieldState.error.message}
												</p>
											)}
										</FormItem>
									)}
								/>
							)}
						{selectedTag === "Leave" && (
							<FormField
								control={form.control}
								name="leavePeriod"
								render={({ field }) => (
									<FormItem className="flex items-center gap-2">
										{/* 🔧 LEAVE HALF DAY FIX: checkbox instead of radio */}
										<Checkbox
											checked={field.value === "Half"}
											onCheckedChange={(checked) => {
												field.onChange(checked ? "Half" : "Full");
											}}
										/>
										<FormLabel style={{ marginTop: 0 }}>
											Half Day
										</FormLabel>
									</FormItem>
								)}
							/>
						)}
						{selectedTag === "Leave" && leavePeriod === "Half" && (
							<FormField
								control={form.control}
								name="halfDayDate"
								render={({ field, fieldState }) => (
									<DateTimePicker
										form={form}
										field={{
											...field,
											onChange: (date) => {
												// 🔧 LEAVE HALF DAY FIX: range validation
												if (date < startDate || date > endDate) {
													toast.error("Half Day date must be between From and To dates");
													return;
												}
												field.onChange(date);
											},
										}}
										label="Half Day Date"
										hideTime={true}
										minDate={startDate}
										maxDate={endDate}
									/>
								)}
							/>
						)}

						{selectedTag === "Leave" && requiresMedical && (
							<FormField
								control={form.control}
								name="medicalAttachment"
								render={({ field, fieldState }) => (
									<FormItem>
										<FormLabel>Medical Certificate</FormLabel>
										<Input type="file" onChange={e => field.onChange(e.target.files?.[0])} />
										{fieldState.error && (
											<p className="text-sm text-red-500">{fieldState.error.message}</p>
										)}
									</FormItem>
								)}
							/>
						)}
						{!tagConfig.hide?.includes("description") && (
							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Description</FormLabel>
										{selectedTag === "Todo List" ? (
											<TodoWysiwyg
												value={field.value}
												onChange={field.onChange}
											/>
										) : (
											<Textarea {...field} />
										)}
									</FormItem>
								)}
							/>
						)}
					</form>
				</Form>
				<div className="pt-4">
					<ModalFooter className="gap-2">
						<ModalClose asChild>
							<Button variant="outline">Cancel</Button>
						</ModalClose>
						{event && event.tags=="Leave" && event.status=="APPROVED" ? null :
						<Button type="submit" form="event-form" disabled={!form.formState.isValid || form.formState.isSubmitting}>
							{isEditing ? "Update" : "Submit"}
						</Button>}
					</ModalFooter>
				</div>
			</ModalContent>
		</Modal>
	);
}
