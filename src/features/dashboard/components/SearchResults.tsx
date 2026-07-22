"use client";

import Link from "next/link";
import { BookOpen, MessageSquare, User } from "lucide-react";

interface SearchResult {
  type: "course" | "message" | "user";
  id: string;
  title: string;
  subtitle: string;
  link: string;
}

interface Props {
  results: SearchResult[];
  onSelect?: () => void;
}

const typeIcons = {
  course: BookOpen,
  message: MessageSquare,
  user: User,
};

const typeLabels = {
  course: "دوره",
  message: "پیام",
  user: "کاربر",
};

export function SearchResults({ results, onSelect }: Props) {
  if (results.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-sm text-slate-400">
        نتیجه‌ای یافت نشد
      </div>
    );
  }

  const grouped: Partial<Record<"course" | "message" | "user", SearchResult[]>> = {};
  for (const r of results) {
    if (!grouped[r.type]) grouped[r.type] = [];
    grouped[r.type]!.push(r);
  }

  return (
    <div className="max-h-80 overflow-y-auto py-2">
      {(Object.keys(grouped) as Array<"course" | "message" | "user">).map((type) => (
        <div key={type}>
          <div className="px-4 py-1.5 text-[0.65rem] font-bold uppercase text-slate-500">
            {typeLabels[type]}
          </div>
          {grouped[type]?.map((item) => {
            const Icon = typeIcons[item.type];
            return (
              <Link
                key={item.id}
                href={item.link}
                onClick={onSelect}
                className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
              >
                <Icon className="size-4 shrink-0 text-slate-400" />
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate font-medium text-white">{item.title}</span>
                  <span className="truncate text-xs text-slate-400">{item.subtitle}</span>
                </div>
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}
