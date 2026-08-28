"use server";

import { findBook } from "@/lib/library";
import { signDownloadToken } from "@/lib/library-token";
import { getCurrentUser } from "@/lib/auth/session";

/**
 * Server action — simulates a successful payment and returns a one-time
 * download token for the requested book.
 *
 * In production this would:
 *  1. Create a Payment row with status=PENDING.
 *  2. Redirect to the simulated gateway (or real Zarinpal).
 *  3. On callback, mark Payment PAID and create the token.
 *
 * For the demo, the "payment" is instant — but the buyer must still be an
 * authenticated user, and the token is BOUND to their account
 * (`userId` claim). The download route refuses to serve a bound token to
 * anyone except that user's session, so neither anonymous minting nor
 * leaked/shareable download URLs grant free access any more.
 */
export async function buyBook(bookId: string): Promise<
  | { ok: true; token: string }
  | { ok: false; error: string }
> {
  let user;
  try {
    user = await getCurrentUser();
  } catch {
    // DB unreachable mid-session (real token): fail gracefully instead of
    // throwing out of the server action.
    return { ok: false, error: "خطای سرویس. لطفاً دوباره تلاش کنید." };
  }
  if (!user) {
    return {
      ok: false,
      error: "برای خرید و دانلود کتاب ابتدا وارد حساب خود شوید.",
    };
  }

  const book = findBook(bookId);
  if (!book) {
    return { ok: false, error: "کتاب پیدا نشد." };
  }

  const token = signDownloadToken({
    bookId: book.id,
    purchaseId: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    amount: book.price,
    userId: user.id,
  });

  return { ok: true, token };
}
