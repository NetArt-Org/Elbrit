import { TAG_FORM_CONFIG } from "@/lib/calendar/form-config";
import { z } from "zod";
import {differenceInCalendarDays} from "date-fns"


export const eventSchema = z.object({
	title: z.string().min(1),
	tags: z.string(),
	startDate: z.date(),
	endDate: z.date().optional(),
	description: z.string().optional(),
	color: z.string().optional(),
	employees: z.any().optional(),
	doctor: z.any().optional(),
	hqTerritory: z.string().optional(),
	allDay: z.boolean().optional(),
	leaveType: z.string().optional(),
	leavePeriod: z.enum(["Full", "Half"]).optional(),
	medicalAttachment: z.any().optional(),
	halfDayDate:  z.date().optional(),
	todoStatus: z.enum(["Open", "Closed", "Cancelled"]).optional(),
	priority: z.enum(["High", "Medium", "Low"]).optional(),
  }).superRefine((data, ctx) => {
	const config = TAG_FORM_CONFIG[data.tags] ?? TAG_FORM_CONFIG.DEFAULT;
  
	/* ---------------------------------------------
	   REQUIRED FIELDS (GENERIC)
	--------------------------------------------- */
	config.required?.forEach((field) => {
	  const value = data[field];
  
	  const isEmpty =
		value === undefined ||
		value === null ||
		value === "" ||
		(Array.isArray(value) && value.length === 0);
  
	  if (isEmpty) {
		ctx.addIssue({
		  path: [field],
		  message: "This field is required",
		  code: z.ZodIssueCode.custom,
		});
	  }
	});
  
	/* ---------------------------------------------
   LEAVE: MEDICAL CERTIFICATE RULE (ALIGNED)
--------------------------------------------- */
if (
	data.tags === "Leave" &&
	data.leaveType === "Sick Leave" &&
	data.startDate &&
	data.endDate
  ) {
	const config = TAG_FORM_CONFIG.Leave;
	const threshold =
	  config.leave?.medicalCertificateAfterDays ?? 2;
  
	const days =
	  differenceInCalendarDays(data.endDate, data.startDate) + 1;
  
	if (days > threshold && !data.medicalAttachment) {
	  ctx.addIssue({
		path: ["medicalAttachment"],
		message: "Medical certificate is required",
		code: z.ZodIssueCode.custom,
	  });
	}
  }
  
  
	/* ---------------------------------------------
	   LEAVE: HALF DAY DATE REQUIRED
	--------------------------------------------- */
	if (
	  data.tags === "Leave" &&
	  data.leavePeriod === "Half" &&
	  !data.halfDayDate
	) {
	  ctx.addIssue({
		path: ["halfDayDate"],
		message: "Half Day Date is required",
		code: z.ZodIssueCode.custom,
	  });
	}
  });
  

  