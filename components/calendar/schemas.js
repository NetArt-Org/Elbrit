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
	todoStatus: z.enum(["Open", "Closed", "Cancelled"]).optional(),
	priority: z.enum(["High", "Medium", "Low"]).optional(),
  }).superRefine((data, ctx) => {
    const config = TAG_FORM_CONFIG[data.tags] ?? TAG_FORM_CONFIG.DEFAULT;

    config.required?.forEach((field) => {
      const value = data[field];

      const isEmpty =
        value === undefined ||
        value === null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0);
		if (
			data.tags === "Leave" &&
			differenceInCalendarDays(data.endDate, data.startDate) + 1 > 2 &&
			!data.medicalAttachment
		  ) {
			ctx.addIssue({
			  path: ["medicalAttachment"],
			  message: "Medical certificate is required",
			  code: z.ZodIssueCode.custom,
			});
		  }
		  
      if (isEmpty) {
        ctx.addIssue({
          path: [field],
          message: "This field is required",
          code: z.ZodIssueCode.custom,
        });
      }
    });
  });

  