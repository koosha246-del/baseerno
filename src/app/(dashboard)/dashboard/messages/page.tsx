import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { SendMessageForm } from "./SendMessageForm";
import { MessagesList } from "./MessagesList";

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const messages = await repository.listMessages(user.id);
  const allUsers = await repository.listUsers();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">پیام‌ها</h1>
          <p className="mt-1 text-sm text-slate-400">پیام‌های دریافتی و ارسالی</p>
        </div>
        <SendMessageForm
          currentUserId={user.id}
          allUsers={allUsers.map((u) => ({ id: u.id, name: u.name }))}
        />
      </div>

      <MessagesList
        messages={messages.map((m) => ({
          ...m,
          sentAt: new Date(m.sentAt),
        }))}
        currentUserId={user.id}
        allUsers={allUsers.map((u) => ({ id: u.id, name: u.name }))}
      />
    </div>
  );
}
