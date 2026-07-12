import { z } from "zod";

/**
 * Checkout form schema — payment + student contact details.
 * Persian validation messages for accessibility.
 */
export const checkoutSchema = z.object({
  fullName: z
    .string()
    .min(3, "نام و نام‌خانوادگی باید حداقل ۳ حرف باشد.")
    .max(80, "نام نباید بیشتر از ۸۰ حرف باشد."),
  email: z
    .string()
    .min(1, "ایمیل الزامی است.")
    .email("لطفاً یک ایمیل معتبر وارد کنید."),
  phone: z
    .string()
    .min(8, "شماره تماس باید حداقل ۸ رقم باشد.")
    .regex(/^[0-9۰-۹+]+$/, "فقط اعداد و علامت + مجاز است."),
  paymentMethod: z.enum(["zarinpal", "saman", "wallet"], {
    required_error: "روش پرداخت را انتخاب کنید.",
  }),
  agreeTerms: z.literal(true, {
    errorMap: () => ({ message: "برای ادامه باید قوانین را بپذیرید." }),
  }),
});

export type CheckoutData = z.infer<typeof checkoutSchema>;
