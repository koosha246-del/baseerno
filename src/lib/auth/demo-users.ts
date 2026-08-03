/**
 * Demo accounts — used ONLY when `DEMO_MODE=true` and PostgreSQL is
 * unreachable, so the app can be explored without a database.
 *
 * The credentials mirror the seeded dev users (password `123456`) so the
 * same accounts work whether the DB is up or down. Never enabled in
 * production (env.ts rejects it at startup).
 */
import type { SafeUser } from "@/lib/db/types";

export interface DemoAccount {
  id: string;
  name: string;
  email: string;
  role: SafeUser["role"];
  password: string;
  avatar: string | null;
  phone: string | null;
  bio: string | null;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: "demo_student",
    name: "دانشجوی آزمایشی",
    email: "student@baseerno.ir",
    role: "STUDENT",
    password: "123456",
    avatar: null,
    phone: "09120000001",
    bio: "حساب آزمایشی (حالت دمو — بدون دیتابیس).",
  },
  {
    id: "demo_teacher",
    name: "مدرس آزمایشی",
    email: "teacher@baseerno.ir",
    role: "TEACHER",
    password: "123456",
    avatar: null,
    phone: "09120000002",
    bio: "حساب آزمایشی (حالت دمو — بدون دیتابیس).",
  },
  {
    id: "demo_admin",
    name: "مدیر آزمایشی",
    email: "admin@baseerno.ir",
    role: "ADMIN",
    password: "123456",
    avatar: null,
    phone: "09120000003",
    bio: "حساب آزمایشی (حالت دمو — بدون دیتابیس).",
  },
];

/** Find a demo account by email (case-insensitive). */
export function findDemoAccount(email: string): DemoAccount | undefined {
  const normalized = email.trim().toLowerCase();
  return DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === normalized);
}

/** Find a demo account by id (used when resolving a session token). */
export function findDemoAccountById(id: string): DemoAccount | undefined {
  return DEMO_ACCOUNTS.find((a) => a.id === id);
}

/** Convert a demo account to the public SafeUser shape. */
export function demoAccountToSafeUser(account: DemoAccount): SafeUser {
  const now = new Date().toISOString();
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    role: account.role,
    avatar: account.avatar,
    phone: account.phone,
    bio: account.bio,
    createdAt: now,
    updatedAt: now,
  };
}
