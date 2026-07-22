import { z } from "zod";

/**
 * Zod schema for the corporate consultation request form.
 * All validation messages are in Persian for accessibility.
 */
export const corporateFormSchema = z.object({
  name: z
    .string()
    .min(3, "نام و نام‌خانوادگی باید حداقل ۳ حرف باشد.")
    .max(80, "نام نباید بیشتر از ۸۰ حرف باشد."),
  organization: z
    .string()
    .min(2, "نام مدرسه باید حداقل ۲ حرف باشد.")
    .max(120, "نام نباید بیشتر از ۱۲۰ حرف باشد."),
  role: z.string().optional().default(""),
  phone: z
    .string()
    .min(8, "شماره تماس باید حداقل ۸ رقم باشد.")
    .regex(/^[0-9۰-۹+]+$/, "فقط عدد و + مجاز است."),
  employeesCount: z.enum(["1-50", "51-200", "201-500", "500+"], {
    required_error: "تعداد دانش‌آموزان را انتخاب کنید.",
  }),
  message: z
    .string()
    .max(500, "پیام خیلی بلند است.")
    .optional()
    .default(""),
});

export type CorporateFormData = z.infer<typeof corporateFormSchema>;
