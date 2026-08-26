import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { SendMessageForm } from "./SendMessageForm";
import { env } from "@/lib/env";
import { DemoUnavailableCard } from "@/components/shared/DemoUnavailableCard";
import { MessagesList } from "./MessagesList";

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  // Demo mode (no DB): show a friendly card instead of a hanging skeleton.
  if (env.demoMode) {
    return <DemoUnavailableCard />;
  }

  const messages = await repository.listMessages(user.id);

  // ── Recipient pool ────────────────────────────────────────────
  // 1. Existing conversation partners (always).
  const partnerIds = Array.from(
    new Set(messages.flatMap((m) => [m.senderId, m.receiverId])),
  ).filter((id) => id !== user.id);

  // 2. Staff (teachers + admins) — anyone may open a first contact with
  //    staff; without this a fresh account's compose dropdown is empty
  //    and messaging is permanently unusable.
  const [admins, teachers] = await Promise.all([
    repository.listUsers({ role: "ADMIN", take: 50 }),
    repository.listUsers({ role: "TEACHER", take: 50 }),
  ]);
  const staffIds = [...admins, ...teachers].map((u) => u.id);

  // 3. Teachers/admins can also reach the students in THEIR courses.
  let extraIds: string[] = [];
  if (user.role === "TEACHER") {
    const myCourses = await repository.listCourses({ mentorId: user.id });
    const roster = (
      await Promise.all(myCourses.map((c) => repository.listEnrollmentsForCourse(c.id)))
    ).flat();
    extraIds = roster.map((e) => e.userId);
  }

  const recipientIds = Array.from(
    new Set([...partnerIds, ...staffIds, ...extraIds]),
  ).filter((id) => id !== user.id);

  const relevantUsers = recipientIds.length > 0
    ? await repository.listUsers({ ids: recipientIds })
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">پیام‌ها</h1>
          <p className="mt-1 text-sm text-slate-400">پیام‌های دریافتی و ارسالی</p>
        </div>
        <SendMessageForm
          currentUserId={user.id}
          allUsers={relevantUsers.map((u) => ({ id: u.id, name: u.name }))}
        />
      </div>

      <MessagesList
        messages={messages.map((m) => ({
          ...m,
          sentAt: new Date(m.sentAt),
        }))}
        currentUserId={user.id}
        allUsers={relevantUsers.map((u) => ({ id: u.id, name: u.name }))}
      />
    </div>
  );
}
