"use server";

import { findBook } from "@/lib/library";
import { signDownloadToken } from "@/lib/library-token";

/**
 * Server action — simulates a successful payment and returns a one-time
 * download token for the requested book.
 *
 * In production this would:
 *  1. Look up the authenticated user.
 *  2. Create a Payment row with status=PENDING.
 *  3. Redirect to the simulated gateway (or real Zarinpal).
 *  4. On callback, mark Payment PAID and create the token.
 *
 * For the demo, the "payment" is instant and the token is issued directly.
 */
export async function buyBook(bookId: string): Promise<
  | { ok: true; token: string }
  | { ok: false; error: string }
> {
  const book = findBook(bookId);
  if (!book) {
    return { ok: false, error: "کتاب پیدا نشد." };
  }

  const token = signDownloadToken({
    bookId: book.id,
    purchaseId: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    amount: book.price,
  });

  return { ok: true, token };
}
