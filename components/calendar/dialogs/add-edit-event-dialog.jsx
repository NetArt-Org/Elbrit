import { zodResolver } from "@hookform/resolvers/zod";
import { addMinutes, differenceInCalendarDays, set } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { LOGGED_IN_USER } from "@/components/auth/calendar-users";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { TAGS } from "@/components/calendar/mocks";
import { mapFormToErpEvent } from "@/services/event-to-erp-graphql";
import { saveEvent } from "@/services/event.service";

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

export function AddEditEventDialog({
	children,
	event,
	defaultTag,
}) {
	const { isOpen, onClose, onToggle } = useDisclosure();
	const { addEvent, updateEvent } = useCalendar();
	const isEditing = !!event;
	const [hqTerritoryOptions, setHqTerritoryOptions] = useState([]);

	const [employeeOptions, setEmployeeOptions] = useState([]);
	const [salesPartnerOptions, setSalesPartnerOptions] = useState([]);

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
			salesPartner: undefined,
			// Leave
			leaveType: undefined,
			reportTo: undefined,
			medicalAttachment: undefined,
			// Todo
			hasDeadline: false,
		},
	});
	useEffect(() => {
		if (!isOpen || !event?.participants?.length) return;
	  
		const employee = event.participants.find(
		  (p) => p.type === "Employee"
		);
	  
		if (employee) {
		  form.setValue("employees", employee.id, {
			shouldDirty: false,
			shouldValidate: false,
		  });
		}
	  }, [isOpen, event?.participants]);
	  
	useEffect(() => {
		if (!isOpen) return;
		form.reset(form.getValues());
	}, [isOpen]);

	const selectedTag = form.watch("tags");
	const tagConfig = TAG_FORM_CONFIG[selectedTag] ?? TAG_FORM_CONFIG.DEFAULT;


	/* --------------------------------------------------
	   AUTO TITLE (SAFE)
	-------------------------------------------------- */
	useEffect(() => {
		if (isEditing) return;
		if (!tagConfig.autoTitle) return;

		const values = form.getValues();
		const title = tagConfig.autoTitle(values);

		if (title && values.title !== title) {
			form.setValue("title", title, {
				shouldDirty: false,
				shouldValidate: false,
			});
		}
	}, [
		form.watch("startDate"),
		form.watch("salesPartner"),
		form.watch("leaveType"),
		form.watch("employees"),
		selectedTag,
	]);

	/* --------------------------------------------------
	   AUTO SELECT LOGGED IN USER
	-------------------------------------------------- */
	useEffect(() => {
		if (!selectedTag) return;
	  
		// 1️⃣ Load required options for the selected tag
		loadParticipantOptionsByTag({
		  tag: selectedTag,
		  employeeOptions,
		  hqTerritoryOptions,
		  salesPartnerOptions,
		  setEmployeeOptions,
		  setSalesPartnerOptions,
		  setHqTerritoryOptions,
		});
	  
		// 2️⃣ Auto-select logged-in employee (only when enabled)
		if (!tagConfig.employee?.autoSelectLoggedIn) return;
	  
		// 3️⃣ Do NOT override employee in edit mode
		if (event?.participants?.length) return;
	  
		const value = tagConfig.employee.multiselect
		  ? [LOGGED_IN_USER.id]
		  : LOGGED_IN_USER.id;
	  
		form.setValue("employees", value, { shouldDirty: false });
	  }, [
		selectedTag,
		tagConfig.employee,
		event?.participants?.length,
	  ]);
	  
	/* --------------------------------------------------
	   SUBMIT
	-------------------------------------------------- */
	const onSubmit = async (values) => {
		if (selectedTag === "Leave") {
			const days =
				differenceInCalendarDays(values.endDate, values.startDate) + 1;

			if (days > 2 && !values.medicalAttachment) {
				toast.error("Medical certificate required");
				return;
			}
		}

		const erpDoc = mapFormToErpEvent(values, {
			erpName: event?.erpName,
		});
		console.log("ERP DOC",erpDoc)

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
			participants: isEditing
  ? event.participants
  : buildCalendarParticipants(
      values,
      employeeOptions,
      salesPartnerOptions
    ),
		};

		event ? updateEvent(calendarEvent) : addEvent(calendarEvent);

		toast.success("Event saved");
		onClose();
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

						{/* DOCTOR FIRST */}
						{!tagConfig.hide?.includes("salesPartner") && (
							<FormField
								control={form.control}
								name="salesPartner"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Doctor / Institute</FormLabel>
										<FormControl>
											<RHFCombobox
												options={salesPartnerOptions}
												value={field.value}
												onChange={field.onChange}
												placeholder="Select doctor"
											/>
										</FormControl>
									</FormItem>
								)}
							/>
						)}
						<div className="grid grid-cols-2 gap-3">
							{/* DATE */}
							<FormField
								control={form.control}
								name="startDate"
								render={({ field }) => (
									<DateTimePicker
										form={form}
										field={field}
										hideTime={tagConfig.dateOnly}
									/>
								)}
							/>
							{!tagConfig.hide?.includes("endDate") && (
								<FormField
									control={form.control}
									name="endDate"
									render={({ field }) => (
										<DateTimePicker
											form={form}
											field={field}
											hideTime={tagConfig.dateOnly}
										/>
									)}
								/>
							)}
						</div>
						{/* EMPLOYEES */}
						{!tagConfig.hide?.includes("employees") &&
 !tagConfig.employee?.autoSelectLoggedIn && (
  <FormField
    control={form.control}
    name="employees"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Employees</FormLabel>
        <FormControl>
          <RHFCombobox
            multiple={tagConfig.employee?.multiselect}
            options={employeeOptions}
            value={field.value}
            onChange={field.onChange}
            placeholder="Select employees"
          />
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

						{/* TODO DEADLINE */}
						{selectedTag === "Todo List" && (
							<FormField
								control={form.control}
								name="hasDeadline"
								render={({ field }) => (
									<FormItem className="flex gap-2 items-center">
										<Checkbox
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
										<FormLabel>Has Deadline</FormLabel>
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
						Create Event
					</Button>
				</ModalFooter>
				</div>
			</ModalContent>
		</Modal>
	);
}
