/**
 * UseCase: Register a new user.
 *
 * Orchestrates the full registration flow: validate → check existing →
 * hash → create → set session → publish event → return response.
 *
 * Route handlers become thin: they parse the request, call the use case,
 * and return the result.  Business logic lives here.
 */

import { z } from "zod";
import { NextResponse } from "next/server";
import { repository } from "@/lib/db/repository";
import { hashPassword } from "@/lib/auth/password";
import { setSession } from "@/lib/auth/session";
import { publish } from "@/lib/events";

export const registerSchema = z.object({
  name: z.string().min(3, "نام باید حداقل ۳ حرف باشد."),
  email: z.string().email("ایمیل معتبر نیست."),
  password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد."),
  role: z.literal("STUDENT").default("STUDENT"),
});

export type RegisterInput = z.input<typeof registerSchema>;

export interface RegisterResult {
  ok: true;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface RegisterError {
  ok: false;
  error: string;
  status: number;
}

export type RegisterResponse = RegisterResult | RegisterError;

export async function registerUser(input: RegisterInput): Promise<RegisterResponse> {
  // Check for existing user
  const existing = await repository.findUserByEmail(input.email);
  if (existing) {
    return { ok: false, error: "این ایمیل قبلاً ثبت شده است.", status: 409 };
  }

  // Hash password
  const passwordHash = await hashPassword(input.password);

  // Create user in database (role is defaulted by the schema when omitted)
  const user = await repository.createUser({
    name: input.name,
    email: input.email,
    passwordHash,
    role: input.role ?? "STUDENT",
  });

  // Set session cookie
  await setSession(user);

  // Publish event — triggers email, cache invalidation, etc.
  await publish({
    type: "user:registered",
    userId: user.id,
    email: user.email,
    name: user.name,
  });

  return {
    ok: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

/**
 * Convert a UseCase response to a NextResponse.
 * Shared helper so every route handler doesn't duplicate this logic.
 */
export function buildUseCaseResponse(result: RegisterResponse): NextResponse {
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ user: result.user });
}