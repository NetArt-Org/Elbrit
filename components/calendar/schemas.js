import { TAG_FORM_CONFIG } from "@/lib/calendar/form-config";
import { z } from "zod";

// export const eventSchema = z.object({
// 	title: z.string().min(1, "Title is required"),
// 	description: z.string().min(1, "Description is required"),
// 	startDate: z.date({
// 		required_error: "Start date is required",
// 	}),
// 	endDate: z.date({
// 		required_error: "End date is required",
// 	}),
// 	color: z.enum(["blue", "green", "red", "yellow", "purple", "orange"], {
// 		required_error: "Variant is required",
// 	}),
// 	tags: z.string(),
// 	employees: z.string().optional(),
// 	salesPartner: z.string().optional(),
// });

export const eventSchema = z.object({
	title: z.string().min(1),
	tags: z.string(),
	startDate: z.date(),
	endDate: z.date().optional(),
	description: z.string().optional(),
	color: z.string().optional(),
	employees: z.any().optional(),
	salesPartner: z.any().optional(),
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
  