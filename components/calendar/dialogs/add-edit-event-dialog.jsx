import { zodResolver } from "@hookform/resolvers/zod";
import { addMinutes, differenceInCalendarDays, set } from "date-fns";
import { useEffect, useMemo, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { LOGGED_IN_USER } from "@/components/auth/calendar-users";
import { TAG_IDS, TAGS } from "@/components/calendar/mocks";
import { mapFormToErpEvent } from "@/services/event-to-erp-graphql";
import { saveDocToErp, saveEvent, fetchEmployeeLeaveBalance, saveLeaveApplication, updateLeaveAttachment, updateLeadDob } from "@/services/event.service";
import { useWatch } from "react-hook-form";
import { LeaveTypeCards } from "@/components/calendar/leave/LeaveTypeCards";
import { TodoWysiwyg } from "@/components/ui/TodoWysiwyg";
import { Form, FormControl, FormField, } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalTrigger, } from "@/components/ui/responsive-modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { RHFFieldWrapper, RHFComboboxField, RHFDateTimeField, InlineCheckboxField, FormFooter, } from "@/components/calendar/form-fields";
import { useCalendar } from "@/components/calendar/contexts/calendar-context";
import { useDisclosure } from "@/components/calendar/hooks";
import { eventSchema } from "@/components/calendar/schemas";
import { buildCalendarParticipants } from "@/lib/utils";
import { TAG_FORM_CONFIG } from "@/lib/calendar/form-config";
import { loadParticipantOptionsByTag } from "@/lib/participants";
import { TimePicker } from "@/components/ui/TimePicker";
import { mapFormToErpTodo, mapErpTodoToCalendar } from "@/services/todo-to-erp-graphql";
import { mapErpLeaveToCalendar, mapFormToErpLeave } from "@/services/leave-to-erp";
import { useEmployeeResolvers } from "@/lib/employeeResolver";
import { uploadLeaveMedicalCertificate } from "@/services/file.service";

export function AddEditEventDialog({ children, event, defaultTag, }) {
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
			title: event?.title ?? "", description: event?.description ?? "", startDate: initialDates.startDate, endDate: initialDates.endDate, tags: event?.tags ?? defaultTag ?? "Other", hqTerritory: event?.hqTerritory ?? "", employees: undefined, doctor: undefined, leaveType: event?.leaveType ?? "Casual Leave", reportTo: undefined, medicalAttachment: event?.medicalAttachment ?? "", allDay: false, todoStatus: "Open", priority: "Medium", leavePeriod: "Full", halfDayDate: undefined, approvedBy: undefined
		},
	});

	const startDate = useWatch({ control: form.control, name: "startDate" });
	const endDate = useWatch({ control: form.control, name: "endDate" });
	const allDay = useWatch({ control: form.control, name: "allDay" });
	const leaveType = useWatch({ control: form.control, name: "leaveType", });
	const leavePeriod = useWatch({ control: form.control, name: "leavePeriod", });
	const { doctor, employees, hqTerritory, tags: selectedTag, } = useWatch({ control: form.control });

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
	const reset = fields =>
		Object.entries(fields).forEach(([name, defaultValue]) =>
			form.resetField(name, { defaultValue })
		);

	const resetFieldsOnTagChange = () => {
		reset({
			employees: undefined, doctor: isDoctorMulti ? [] : undefined,
			todoStatus: "Open", priority: "Medium", title: "",
		});
		// ❌ HQ is REQUIRED for this tag — never reset it
		if (selectedTag !== TAG_IDS.HQ_TOUR_PLAN) {
			reset({ hqTerritory: "" });
		}

		if (selectedTag !== TAG_IDS.LEAVE) {
			reset({
				leaveType: undefined,
				leavePeriod: "Full",
				medicalAttachment: undefined,
			});
		}
	};


	const leaveDays = useMemo(() => {
		if (selectedTag !== TAG_IDS.LEAVE) return 0;
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
		if (selectedTag !== TAG_IDS.LEAVE) return false;
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
		if (!isOpen || selectedTag !== TAG_IDS.LEAVE) return;
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
		if (selectedTag !== TAG_IDS.TODO_LIST) return;
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
		const nextTitle = tagConfig.autoTitle(values, {
			doctorOptions,
			employeeOptions,
		});

		if (!nextTitle) return;

		if (values.title !== nextTitle) {
			form.setValue("title", nextTitle, {
				shouldDirty: false,
				shouldValidate: true, // 🔑 REQUIRED
			});
		}
	}, [selectedTag, hqTerritory, doctor, employees, doctorOptions, employeeOptions, isEditing,]);

	/* --------------------------------------------------
	   AUTO SELECT LOGGED IN USER
	-------------------------------------------------- */
	useEffect(() => {
		if (!selectedTag) return;

		loadParticipantOptionsByTag({ tag: selectedTag, employeeOptions, hqTerritoryOptions, doctorOptions, setEmployeeOptions, setHqTerritoryOptions, setDoctorOptions, });

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
		if (selectedTag === TAG_IDS.MEETING || selectedTag === TAG_IDS.BIRTHDAY) return;
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
		if (selectedTag !== TAG_IDS.MEETING) return;
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
	const buildDoctorVisitTitle = (doctorId, values) => {
		const doc = doctorOptions.find(d => d.value === doctorId);
		const empId = Array.isArray(values.employees)
			? values.employees[0]
			: values.employees;

		const emp = employeeOptions.find(e => e.value === empId);

		if (!doc) return values.title || "DV";

		const doctorName = doc.label.replace(/\s+/g, "");
		const employeeName = emp?.label?.replace(/\s+/g, "") ?? "Emp";

		return `${doctorName}-${employeeName}`;
	};
	const finalize = (message) => {
		toast.success(message);
		onClose();
	};

	const upsertCalendarEvent = (calendarEvent) => {
		event ? updateEvent(calendarEvent) : addEvent(calendarEvent);
	};
	const handleBirthday = async (values) => {
		if (!values.endDate) {
			values.endDate = values.startDate;
		}

		if (values.doctor) {
			const doctorId = Array.isArray(values.doctor)
				? values.doctor[0]
				: values.doctor;

			try {
				await updateLeadDob(doctorId, values.startDate);
			} catch (err) {
				console.error("Failed to update doctor DOB", err);
				toast.error("Failed to update Doctor DOB");
				return false;
			}
		}

		return true;
	};
	const handleLeave = async (values) => {
		if (requiresMedical && !values.medicalAttachment) {
			toast.error("Medical certificate required");
			return;
		}

		const leaveDoc = mapFormToErpLeave(values);
		delete leaveDoc.fsl_attach;

		const savedLeave = await saveLeaveApplication(leaveDoc);

		if (requiresMedical && values.medicalAttachment) {
			const uploadResult = await uploadLeaveMedicalCertificate(
				values,
				savedLeave.name
			);

			if (uploadResult?.fileUrl) {
				await updateLeaveAttachment(
					savedLeave.name,
					uploadResult.fileUrl
				);
			}
		}

		const calendarLeave = mapErpLeaveToCalendar({
			...leaveDoc,
			name: savedLeave.name,
			color: "#DC2626",
		});

		upsertCalendarEvent(calendarLeave);
		finalize("Leave applied successfully");
	};
	const handleTodo = async (values) => {
		const todoDoc = mapFormToErpTodo(values, employeeResolvers);
		const savedTodo = await saveDocToErp(todoDoc);

		const calendarTodo = mapErpTodoToCalendar(
			{ ...todoDoc, name: savedTodo.name },
			employeeResolvers
		);

		upsertCalendarEvent(calendarTodo);
		finalize("Todo saved");
	};
	const handleDoctorVisitPlan = async (values) => {
		for (const doctorId of values.doctor) {
			const erpDoc = mapFormToErpEvent(
				{
					...values,
					title: buildDoctorVisitTitle(doctorId, values),
					doctor: doctorId,
				},
				{}
			);

			const savedEvent = await saveEvent(erpDoc);

			const calendarEvent = {
				erpName: savedEvent.name, title: buildDoctorVisitTitle(doctorId, values), description: values.description, startDate: erpDoc.starts_on, endDate: erpDoc.ends_on, color: tagConfig.fixedColor, tags: values.tags, owner: LOGGED_IN_USER.id,
				participants: buildCalendarParticipants(
					{ ...values, doctor: doctorId },
					employeeOptions,
					doctorOptions
				),
			};

			addEvent(calendarEvent);
		}

		finalize(`Created ${values.doctor.length} Doctor Visit events`);
	};
	const handleDefaultEvent = async (values) => {
		const erpDoc = mapFormToErpEvent(values, {
			erpName: event?.erpName,
		});

		const savedEvent = await saveEvent(erpDoc);

		const calendarEvent = {
			...(event ?? {}), erpName: savedEvent.name, title: values.title, description: values.description, startDate: erpDoc.starts_on, endDate: erpDoc.ends_on, color: tagConfig.fixedColor, tags: values.tags, owner: event ? event.owner : LOGGED_IN_USER.id, hqTerritory: values.hqTerritory || "",
			participants: buildCalendarParticipants(
				values,
				employeeOptions,
				doctorOptions
			),
		};

		upsertCalendarEvent(calendarEvent);
		finalize("Event saved");
	};
	const onSubmit = async (values) => {
		/* ========= NORMALIZATION ========= */
		if (values.tags === "Birthday") {
			const ok = await handleBirthday(values);
			if (!ok) return;
		}

		/* ========= TAG ROUTING ========= */
		switch (values.tags) {
			case TAG_IDS.LEAVE:
				await handleLeave(values);
				return;

			case TAG_IDS.TODO_LIST:
				await handleTodo(values);
				return;

			case TAG_IDS.DOCTOR_VISIT_PLAN:
				if (Array.isArray(values.doctor) && values.doctor.length) {
					await handleDoctorVisitPlan(values);
				}
				return;

			default:
				await handleDefaultEvent(values);
		}
		finalize("Leave applied successfully");
	};

	return (
		<Modal open={isOpen} onOpenChange={onToggle}>
			<ModalTrigger asChild>{children}</ModalTrigger>

			<ModalContent className=" max-h-[90vh] min-h-[70vh] flex flex-col overflow-scroll">
				<ModalHeader>
					<ModalTitle>{isEditing ? "Edit Event" : "Add Event"}</ModalTitle>
					{/* <ModalDescription /> */}
				</ModalHeader>

				<Form {...form} >
					<form
						id="event-form"
						onSubmit={form.handleSubmit(onSubmit)}
						className="grid gap-4"
					>
						{/* ================= TAGS ================= */}
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

						{/* ================= LEAVE TYPE ================= */}
						{selectedTag === TAG_IDS.LEAVE && (
							<FormField
								control={form.control}
								name="leaveType"
								render={({ field, fieldState }) => (
									<RHFFieldWrapper
										label="Leave Type"
										error={fieldState.error?.message}
									>
										<LeaveTypeCards
											balance={leaveBalance}
											loading={leaveLoading}
											value={field.value}
											onChange={field.onChange}
										/>
										{field.value && leaveBalance?.[field.value] && (
											<div className="mt-2 text-sm text-muted-foreground">
												Balance: {leaveBalance[field.value].available} /{" "}
												{leaveBalance[field.value].allocated}
											</div>
										)}
									</RHFFieldWrapper>
								)}
							/>
						)}

						{/* ================= TITLE ================= */}
						{!tagConfig.hide?.includes("title") && (
							<FormField
								control={form.control}
								name="title"
								render={({ field, fieldState }) => (
									<RHFFieldWrapper
										label="Title"
										error={fieldState.error?.message}
									>
										<FormControl>
											<Input placeholder="Enter title" {...field} />
										</FormControl>
									</RHFFieldWrapper>
								)}
							/>
						)}

						{/* ================= HQ TERRITORY ================= */}
						{selectedTag === TAG_IDS.HQ_TOUR_PLAN && (
							<RHFComboboxField control={form.control} name="hqTerritory" label="HQ Territory" options={hqTerritoryOptions} placeholder="Select HQ Territory"
							/>
						)}

						{/* ================= DOCTOR ================= */}
						{!tagConfig.hide?.includes("doctor") && (
							<RHFComboboxField control={form.control} name="doctor" label="Doctor" options={doctorOptions} multiple={isDoctorMulti} placeholder="Select doctor" selectionLabel="doctor"
							/>
						)}

						{/* ================= MEETING ================= */}
						{selectedTag === TAG_IDS.MEETING ? (
							<>
								<RHFDateTimeField
									control={form.control}
									form={form}
									name="startDate"
									label="Date"
									hideTime
								/>

								<FormField
									control={form.control}
									name="allDay"
									render={({ field }) => (
										<InlineCheckboxField
											label="All day"
											checked={field.value}
											onChange={field.onChange}
										/>
									)}
								/>

								{!form.watch("allDay") && (
									<div className="grid grid-cols-2 gap-3">
										<FormField
											control={form.control}
											name="startDate"
											render={({ field }) => (
												<RHFFieldWrapper label="Start Time">
													<TimePicker
														value={field.value}
														onChange={field.onChange}
														use24Hour={false}
													/>
												</RHFFieldWrapper>
											)}
										/>

										<FormField
											control={form.control}
											name="endDate"
											render={({ field }) => (
												<RHFFieldWrapper label="End Time">
													<TimePicker
														value={field.value}
														minTime={startDate}
														use24Hour={false}
														onChange={(date) => {
															endDateTouchedRef.current = true;
															field.onChange(date);
														}}
													/>
												</RHFFieldWrapper>
											)}
										/>
									</div>
								)}
							</>
						) : (
							/* ================= NON-MEETING ================= */
							<div
								className={`grid gap-3 ${(isFieldVisible("startDate") &&
									isFieldVisible("endDate")) ||
									selectedTag === TAG_IDS.TODO_LIST
									? "grid-cols-2"
									: "grid-cols-1"
									}`}
							>
								{isFieldVisible("startDate") && (
									<RHFDateTimeField control={form.control} form={form} name="startDate" label={getFieldLabel("startDate", "Start Date")} hideTime={tagConfig.dateOnly} allowAllDates={selectedTag === TAG_IDS.BIRTHDAY}
									/>
								)}

								{isFieldVisible("endDate") && (
									<RHFDateTimeField control={form.control} form={form} name="endDate" label={getFieldLabel("endDate", "End Date")} hideTime={tagConfig.dateOnly}
										onChange={(date) => {
											endDateTouchedRef.current = true;
											form.setValue("endDate", date);
										}}
									/>
								)}

								{selectedTag === TAG_IDS.TODO_LIST && (
									<FormField 
										control={form.control}
										name="priority"
										render={({ field, fieldState }) => (
											<RHFFieldWrapper
												label="Priority"
												error={fieldState.error?.message}
											>
												<Select
													value={field.value}
													onValueChange={field.onChange}
												>
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
											</RHFFieldWrapper>
										)}
									/>
								)}
							</div>
						)}

						{/* ================= ASSIGNED TO ================= */}
						{selectedTag === TAG_IDS.TODO_LIST && (
							<RHFComboboxField control={form.control} name="assignedTo" label="Assigned To" options={employeeOptions} multiple placeholder="Select employees" searchPlaceholder="Search employee"
							/>
						)}

						{/* ================= EMPLOYEES ================= */}
						{!tagConfig.hide?.includes("employees") &&
							(!tagConfig.employee?.autoSelectLoggedIn ||
								tagConfig.employee?.multiselect) && (
								<RHFComboboxField
									control={form.control}
									name="employees"
									label={
										selectedTag === TAG_IDS.TODO_LIST
											? "Allocated To"
											: "Employees"
									} 
									options={employeeOptions} multiple={isMulti} placeholder="Select employees" searchPlaceholder="Search employee"
								/>
							)}

						{/* ================= HALF DAY ================= */}
						{selectedTag === TAG_IDS.LEAVE && (
							<FormField
								control={form.control}
								name="leavePeriod"
								render={({ field }) => (
									<InlineCheckboxField
										label="Half Day"
										checked={field.value === "Half"}
										onChange={(checked) =>
											field.onChange(checked ? "Half" : "Full")
										}
									/>
								)}
							/>
						)}

						{selectedTag === TAG_IDS.LEAVE && leavePeriod === "Half" && (
							<RHFDateTimeField control={form.control} form={form} name="halfDayDate" label="Half Day Date" hideTime minDate={startDate} maxDate={endDate}
								onChange={(date) => {
									if (date < startDate || date > endDate) {
										toast.error(
											"Half Day date must be between From and To dates"
										);
										return;
									}
									form.setValue("halfDayDate", date);
								}}
							/>
						)}

						{/* ================= MEDICAL ATTACHMENT ================= */}
						{selectedTag === TAG_IDS.LEAVE && requiresMedical && (
							<FormField
								control={form.control}
								name="medicalAttachment"
								render={({ field, fieldState }) => (
									<RHFFieldWrapper
										label="Medical Certificate"
										error={fieldState.error?.message}
									>
										<Input
											type="file"
											onChange={(e) =>
												field.onChange(e.target.files?.[0])
											}
										/>
									</RHFFieldWrapper>
								)}
							/>
						)}

						{/* ================= DESCRIPTION ================= */}
						{!tagConfig.hide?.includes("description") && (
							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<RHFFieldWrapper label="Description">
										<TodoWysiwyg
											value={field.value}
											onChange={field.onChange}
										/>
									</RHFFieldWrapper>
								)}
							/>
						)}
					</form>
				</Form>

				<div className="pt-4 flex mt-auto justify-end">
					<FormFooter
						isEditing={isEditing}
						disabled={form.formState.isSubmitting}
					/>
				</div>
			</ModalContent>
		</Modal>
	);
}
