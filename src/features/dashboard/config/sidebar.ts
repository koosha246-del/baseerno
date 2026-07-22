import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Award,
  CreditCard,
  Users,
  FileText,
  Settings,
  MessageSquare,
  DollarSign,
  GraduationCap,
  ClipboardList,
  Bell,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/db/types";

export interface SidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  /** Which roles can see this item. Omitted = visible to all roles. */
  roles?: Role[];
}

/**
 * Navigation map per role.
 *
 * Student:  داشبورد، دوره‌های من، نمرات، گواهی‌نامه‌ها، پرداخت‌ها، پیام‌ها، تنظیمات
 * Teacher:  داشبورد، کلاس‌های من، مدیریت نمرات، محتوا/درس‌ها، درآمد، پیام‌ها، تنظیمات
 * Admin:    داشبورد، مدیریت کاربران، مدیریت دوره‌ها، مالی/درآمد کل، گزارش‌ها، تنظیمات
 */
export const sidebarItems: SidebarItem[] = [
  {
    id: "dashboard",
    label: "داشبورد",
    icon: LayoutDashboard,
    href: "/dashboard",
    roles: ["STUDENT", "TEACHER", "ADMIN"],
  },
  {
    id: "courses",
    label: "دوره‌های من",
    icon: BookOpen,
    href: "/dashboard/courses",
    roles: ["STUDENT"],
  },
  {
    id: "classes",
    label: "کلاس‌های من",
    icon: GraduationCap,
    href: "/dashboard/courses",
    roles: ["TEACHER"],
  },
  {
    id: "grades",
    label: "نمرات",
    icon: BarChart3,
    href: "/dashboard/grades",
    roles: ["STUDENT"],
  },
  {
    id: "grade-management",
    label: "مدیریت نمرات",
    icon: ClipboardList,
    href: "/dashboard/grades",
    roles: ["TEACHER"],
  },
  {
    id: "certificates",
    label: "گواهی‌نامه‌ها",
    icon: Award,
    href: "/dashboard/certificates",
    roles: ["STUDENT"],
  },
  {
    id: "content",
    label: "محتوا و درس‌ها",
    icon: FileText,
    href: "/dashboard/content",
    roles: ["TEACHER"],
  },
  {
    id: "payments",
    label: "پرداخت‌ها",
    icon: CreditCard,
    href: "/dashboard/finance",
    roles: ["STUDENT"],
  },
  {
    id: "income",
    label: "درآمد",
    icon: DollarSign,
    href: "/dashboard/finance",
    roles: ["TEACHER"],
  },
  {
    id: "users",
    label: "مدیریت کاربران",
    icon: Users,
    href: "/dashboard/users",
    roles: ["ADMIN"],
  },
  {
    id: "course-management",
    label: "مدیریت دوره‌ها",
    icon: BookOpen,
    href: "/dashboard/courses",
    roles: ["ADMIN"],
  },
  {
    id: "finance",
    label: "مالی و درآمد",
    icon: DollarSign,
    href: "/dashboard/finance",
    roles: ["ADMIN"],
  },
  {
    id: "reports",
    label: "گزارش‌ها",
    icon: FileText,
    href: "/dashboard/reports",
    roles: ["ADMIN"],
  },
  {
    id: "messages",
    label: "پیام‌ها",
    icon: MessageSquare,
    href: "/dashboard/messages",
    roles: ["STUDENT", "TEACHER"],
  },
  {
    id: "notifications",
    label: "اعلامیه‌ها",
    icon: Bell,
    href: "/dashboard/notifications",
  },
  {
    id: "settings",
    label: "تنظیمات",
    icon: Settings,
    href: "/dashboard/settings",
    roles: ["STUDENT", "TEACHER", "ADMIN"],
  },
];

/** Get visible items for a given role. */
export function getSidebarForRole(role: Role): SidebarItem[] {
  return sidebarItems.filter((item) => !item.roles || item.roles.includes(role));
}
