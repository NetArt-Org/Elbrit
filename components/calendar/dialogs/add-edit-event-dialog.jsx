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
import { fetchItems } from "@/services/participants.service";
import { getAvailableItems, showFirstFormErrorAsToast, showFormErrorsAsToast, updatePobRow } from "@/lib/helper";
import { Button } from "@/components/ui/button";

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
	const [itemOptions, setItemOptions] = useState([]);
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
	const employeeParticipant = useMemo(() => {
		return event?.participants?.find(
			(p) => p.type === "Employee"
		);
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
			employees: event?.employees,
			doctor: event?.doctor,
			leaveType: event?.leaveType ?? "Casual Leave",
			reportTo: event?.reportTo ?? "",
			medicalAttachment: event?.medicalAttachment ?? "",
			allDay: event?.allDay ?? false,
			todoStatus: "Open",
			priority: "Medium",
			leavePeriod: "Full",
			halfDayDate: event?.halfDayDate ?? "",
			approvedBy: event?.approvedBy ?? "",
			attending: employeeParticipant?.attending ?? "No",
			kly_lat_long: employeeParticipant?.kly_lat_long ?? "",
			pob_given: event?.pob_given ?? "No",
			fsl_doctor_item: event?.fsl_doctor_item ?? [],
		},
	});

	const startDate = useWatch({ control: form.control, name: "startDate" });
	const endDate = useWatch({ control: form.control, name: "endDate" });
	const allDay = useWatch({ control: form.control, name: "allDay" });
	const leaveType = useWatch({ control: form.control, name: "leaveType", });
	const leavePeriod = useWatch({ control: form.control, name: "leavePeriod", });
	const { doctor, employees, hqTerritory, tags: selectedTag, attending } = useWatch({ control: form.control });
	const pobGiven = useWatch({
		control: form.control,
		name: "pob_given",
	});
	const pobItems = useWatch({
		control: form.control,
		name: "fsl_doctor_item",
	});
	useEffect(() => {
		if (!pobItems?.length || !itemOptions.length) return;

		pobItems.forEach((row, index) => {
			if (!row?.item__name) return;

			const item = itemOptions.find(i => i.value === row.item__name);
			if (!item) return;
			// avoid infinite loop
			if (row.rate === item.rate) return;

			updatePobRow(form, index, {
				rate: Number(item.rate) || 0,
			});
		});
	}, [pobItems, itemOptions]);

	const tagConfig = TAG_FORM_CONFIG[selectedTag] ?? TAG_FORM_CONFIG.DEFAULT;
	const visibleTags = useMemo(() => {
		if (isEditing && tagConfig.ui?.lockTagOnEdit) {
			return TAGS.filter(t => t.id === selectedTag);
		}
		return TAGS;
	}, [isEditing, selectedTag, tagConfig]);
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
	  Fetch POB ITEMS
	--------------------------------------------- */
	useEffect(() => {
		if (!isEditing) return;
		if (selectedTag !== TAG_IDS.DOCTOR_VISIT_PLAN) return;
		if (pobGiven !== "Yes") return;
		if (itemOptions.length) return;

		fetchItems().then(setItemOptions);
	}, [isEditing, pobGiven, selectedTag]);

	/* ---------------------------------------------
	  RESET POB ITEMS
	--------------------------------------------- */
	useEffect(() => {
		if (pobGiven !== "Yes") {
			form.setValue("fsl_doctor_item", [], {
				shouldDirty: true,
			});
		}
	}, [pobGiven]);

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
		   Longitude and latitude
		--------------------------------------------- */
	const FALLBACK_LAT_LONG = "0,0";

	useEffect(() => {
		if (!isEditing) return;
		if (!attending) return;

		// Do not override existing ERP value
		if (form.getValues("kly_lat_long")) return;

		const setFallback = () => {
			form.setValue("kly_lat_long", FALLBACK_LAT_LONG, {
				shouldDirty: true,
				shouldValidate: false,
			});
		};

		if (!navigator.geolocation) {
			toast.warning("Location not supported. Using fallback location.");
			setFallback();
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(pos) => {
				const latLong = `${pos.coords.latitude},${pos.coords.longitude}`;

				form.setValue("kly_lat_long", latLong, {
					shouldDirty: true,
					shouldValidate: false,
				});
			},
			(error) => {
				console.error("Location error:", error);

				// ✅ USER FRIENDLY MESSAGES
				if (error.code === error.PERMISSION_DENIED) {
					toast.error("Location permission denied. Using fallback location.");
				} else if (error.code === error.POSITION_UNAVAILABLE) {
					toast.error("Location unavailable. Using fallback location.");
				} else if (error.code === error.TIMEOUT) {
					toast.warning(
						"Unable to fetch location automatically. Using fallback location."
					);
				}

				setFallback();
			},
			{
				enableHighAccuracy: false,
				timeout: 20000,
				maximumAge: 60000,
			}
		);
	}, [attending, isEditing]);


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
		if (!employeeOptions.length && !doctorOptions.length) return;

		const employeeIds = event.participants
			.filter(p => p.type === "Employee")
			.map(p => String(p.id));

		const doctorIds = event.participants
			.filter(p => p.type === "Lead")
			.map(p => String(p.id));

		/* ---------- Employees ---------- */
		if (employeeIds.length) {
			const employeeValues = employeeIds
				.map(id => employeeOptions.find(o => o.value === id))
				.filter(Boolean);

			form.setValue(
				"employees",
				tagConfig.employee?.multiselect
					? employeeValues
					: employeeValues[0],
				{ shouldDirty: false }
			);
		}

		/* ---------- Doctors ---------- */
		if (doctorIds.length) {
			const doctorValues = doctorIds
				.map(id => doctorOptions.find(o => o.value === id))
				.filter(Boolean);

			form.setValue(
				"doctor",
				tagConfig.doctor?.multiselect
					? doctorValues
					: doctorValues[0],
				{ shouldDirty: false }
			);
		}
	}, [
		isOpen,
		event?.participants,
		employeeOptions,
		doctorOptions,
	]);

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

		const normalizedDoctors = (Array.isArray(values.doctor)
			? values.doctor
			: [values.doctor]
		).map((d) =>
			typeof d === "object"
				? d
				: doctorOptions.find((o) => o.value === d) ?? d
		);

		console.log("Normalized doctors:", normalizedDoctors);
		for (const doctor of normalizedDoctors) {
			const doctorId =
				typeof doctor === "object" ? doctor.value : doctor;

			const erpDoc = mapFormToErpEvent(
				{
					...values,
					title: buildDoctorVisitTitle(doctorId, values),
					doctor: doctor,
				},
				{}
			);
			console.log("ERP DOC DR VISIT PLAN", erpDoc)
			const savedEvent = await saveEvent(erpDoc);

			const calendarEvent = {
				erpName: savedEvent.name,
				title: buildDoctorVisitTitle(doctorId, values), description: values.description, startDate: erpDoc.starts_on, endDate: erpDoc.ends_on, color: tagConfig.fixedColor, tags: values.tags, owner: LOGGED_IN_USER.id,
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

		console.log("ERP DOC Before", erpDoc,event?.erpDoc)
		const savedEvent = await saveEvent(erpDoc);
		console.log("ERP DOC After", erpDoc,event?.erpDoc)
		const calendarEvent = {
			...(event ?? {}),
			erpName: savedEvent.name,
			title: values.title, description: values.description, startDate: erpDoc.starts_on, endDate: erpDoc.ends_on, color: tagConfig.fixedColor, tags: values.tags, owner: event ? event.owner : LOGGED_IN_USER.id, hqTerritory: values.hqTerritory || "",
			participants: buildCalendarParticipants(
				values,
				employeeOptions,
				doctorOptions
			),
		};

		upsertCalendarEvent(calendarEvent);
		finalize("Event saved");
	};
	const onInvalid = (errors) => {
		showFirstFormErrorAsToast(errors);
	  };
	  
	  
	const onSubmit = async (values) => {
		/* ========= NORMALIZATION ========= */
		if (values.tags === TAG_IDS.BIRTHDAY) {
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
				if (isEditing) {
					await handleDefaultEvent(values);
				} else if (Array.isArray(values.doctor) && values.doctor.length) {
					await handleDoctorVisitPlan(values);
				}
				return;

			default:
				await handleDefaultEvent(values);
		}
		finalize("Leave applied successfully");
	};
	console.log("FORM ERRORS", form.formState.errors);

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
						onSubmit={form.handleSubmit(onSubmit,onInvalid)}
						className="grid gap-4"
					>
						{/* ================= TAGS ================= */}
						<FormField
							control={form.control}
							name="tags"
							render={({ field }) => (
								<div className="flex flex-wrap gap-2">
									{visibleTags.map((tag) => (
										<button
											key={tag.id}
											type="button"
											disabled={isEditing && tagConfig.ui?.lockTagOnEdit}
											onClick={() => field.onChange(tag.id)}
											className={`px-4 py-1 rounded-full ${field.value === tag.id
												? "bg-black text-white"
												: "bg-muted"
												} ${isEditing ? "cursor-default" : ""}`}
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
							<FormField
								control={form.control}
								name="hqTerritory"
								render={({ field }) => (
									<RHFFieldWrapper label="HQ Territory">
										<RHFComboboxField  {...field} options={hqTerritoryOptions} placeholder="Select HQ Territory" />
									</RHFFieldWrapper>
								)}
							/>
						)}

						{/* ================= DOCTOR ================= */}
						{!tagConfig.hide?.includes("doctor") && (
							<FormField
								control={form.control}
								name="doctor"
								render={({ field }) => (
									<RHFFieldWrapper label="Doctor">
										<RHFComboboxField {...field} options={doctorOptions} multiple={isDoctorMulti} placeholder="Select doctor" selectionLabel="doctor"
										/>
									</RHFFieldWrapper>
								)}
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
							<FormField
								control={form.control}
								name="assignedTo"
								render={({ field }) => (
									<RHFFieldWrapper label="Assigned To">
										<RHFComboboxField {...field} options={employeeOptions} multiple placeholder="Select employees" searchPlaceholder="Search employee"
										/>
									</RHFFieldWrapper>
								)}
							/>
						)}

						{/* ================= EMPLOYEES ================= */}
						{!tagConfig.hide?.includes("employees") &&
							(!tagConfig.employee?.autoSelectLoggedIn ||
								tagConfig.employee?.multiselect) && (
								<FormField
									control={form.control}
									name="employees"

									render={({ field }) => (
										<RHFFieldWrapper label={
											selectedTag === TAG_IDS.TODO_LIST
												? "Allocated To"
												: "Employees"
										}>
											<RHFComboboxField {...field} options={employeeOptions} multiple={isMulti} placeholder="Select employees" searchPlaceholder="Search employee"
											/>
										</RHFFieldWrapper>
									)}
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
						{/* ================= DOCTOR VISIT (EDIT ONLY) ================= */}
						{isEditing && selectedTag === TAG_IDS.DOCTOR_VISIT_PLAN && (
							<div className="space-y-3 ">
								<h4 className="font-medium">Visit Status</h4>

								{/* Visited */}
								<FormField
									control={form.control}
									name="attending"
									render={({ field }) => (
										<InlineCheckboxField
										label="Visited"
										checked={field.value === "Yes"}
										onChange={(checked) =>
										  field.onChange(checked ? "Yes" : "No")
										}
									  />
									)}
								/>

								{/* Latitude & Longitude */}
								{/* {form.watch("attending") && (
									<div className="text-sm text-muted-foreground flex flex-col gap-1">
										<div className="font-medium">Latitude & Longitude:</div>{" "}
										<div>{form.watch("kly_lat_long") || "Fetching location..."}</div>
									</div>
								)} */}
							</div>
						)}
						{/* ================= POB QUESTION ================= */}
						{isEditing &&
							selectedTag === TAG_IDS.DOCTOR_VISIT_PLAN && attending === "Yes" && (
								<FormField
									control={form.control}
									name="pob_given"
									render={({ field }) => (
										<RHFFieldWrapper label="Did POB Given ?">
											<div className="flex gap-6">
												<label className="flex items-center gap-2">
													<input
														type="radio"
														value="Yes"
														checked={field.value === "Yes"}
														onChange={() => field.onChange("Yes")}
													/>
													<span>Yes</span>
												</label>

												<label className="flex items-center gap-2">
													<input
														type="radio"
														value="No"
														checked={field.value === "No"}
														onChange={() => field.onChange("No")}
													/>
													<span>No</span>
												</label>
											</div>
										</RHFFieldWrapper>
									)}
								/>
							)}

						{/* ================= POB ================= */}
						{isEditing &&
							selectedTag === TAG_IDS.DOCTOR_VISIT_PLAN &&
							pobGiven === "Yes" && (
								<div className="space-y-4">
									<h4 className="font-medium">POB Details</h4>

									{(form.watch("fsl_doctor_item") ?? []).map((row, index) => (
										<div
											key={index}
											className="flex gap-3 items-end"
										>
											{/* Item */}
											<div className="flex-1 min-w-[200px]">
												<FormField
													control={form.control}
													name={`fsl_doctor_item.${index}.item__name`}
													render={({ field }) => (
														<RHFFieldWrapper label="Item">
															<RHFComboboxField
																{...field}
																multiple={false}
																tagsDisplay={false}
																options={getAvailableItems(
																	itemOptions,
																	form.watch("fsl_doctor_item"),
																	field.value // 👈 this row’s selected item
																)}
																placeholder="Select Item"
															/>

														</RHFFieldWrapper>
													)}
												/>
											</div>
											{/* Qty */}
											<FormField
												control={form.control}
												name={`fsl_doctor_item.${index}.qty`}
												render={({ field }) => (
													<RHFFieldWrapper label="Qty">
														<Input
															type="number"
															min={1}
															{...field}
															onChange={(e) => {
																const qty = Number(e.target.value);
																field.onChange(qty);
																updatePobRow(form, index, { qty });
															}}
														/>
													</RHFFieldWrapper>
												)}
											/>
											<div className="flex gap-2">
												{/* Rate (read-only) */}
												<div >
													<label className="text-sm font-medium text-muted-foreground">
														Rate
													</label>
													<Input value={row.rate} disabled />
												</div>

												{/* Amount (read-only) */}
												<div >
													<label className="text-sm font-medium text-muted-foreground">
														Amount
													</label>
													<Input value={row.amount} disabled />
												</div>
											</div>
											{/* Remove */}
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="mb-1"
												onClick={() => {
													const items = [...form.getValues("fsl_doctor_item")];
													items.splice(index, 1);
													form.setValue("fsl_doctor_item", items, {
														shouldDirty: true,
													});
												}}
											>
												✕
											</Button>
										</div>
									))}

									{/* Add Item */}
									<Button
										type="button"
										onClick={() => {
											const items = form.getValues("fsl_doctor_item") ?? [];
											form.setValue(
												"fsl_doctor_item",
												[...items, { item__name: "", qty: 1, rate: 0, amount: 0 }],
												{ shouldDirty: true }
											);
										}}
									>
										+ Add Item
									</Button>
								</div>

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
