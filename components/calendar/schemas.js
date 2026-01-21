import { TAG_FORM_CONFIG } from "@/lib/calendar/form-config";
import { z } from "zod";


export const eventSchema = z.object({
	title: z.string().min(1),
	tags: z.string(),
	startDate: z.date(),
	endDate: z.date().optional(),
	description: z.string().optional(),
	color: z.string().optional(),
	employees: z.any().optional(),
	hqTerritory: z.string().optional(),
	allDay: z.boolean().optional(),
	doctor: z.any().optional(),
  }).superRefine((data, ctx) => {
	const config = TAG_FORM_CONFIG[data.tags] ?? TAG_FORM_CONFIG.DEFAULT;
  
	config.required.forEach((field) => {
	  if (!data[field]) {
		ctx.addIssue({
		  path: [field],
		  message: "This field is required",
		  code: z.ZodIssueCode.custom,
		});
	  }
	});
  });
  