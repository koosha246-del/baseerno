/**
 * UseCase: Send a direct message to another user.
 *
 * Verifies the receiver exists, creates the message, and publishes the
 * `message:sent` event — the event bus invalidates message/notification/user
 * cache tags and notifies the receiver.
 */

import { z } from "zod";
import { NextResponse } from "next/server";
import { repository } from "@/lib/db/repository";
import { publish } from "@/lib/events";

export const sendMessageSchema = z.object({
  receiverId: z.string().min(1, "گیرنده را مشخص کنید."),
  body: z.string().min(1, "متن پیام را وارد کنید.").max(2000, "پیام حداکثر ۲۰۰۰ کاراکتر."),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export interface SendMessageContext {
  senderId: string;
  senderName: string;
}

export interface SendMessageError {
  ok: false;
  error: string;
  status: number;
}

export interface SendMessageResult {
  ok: true;
  message: {
    id: string;
    senderId: string;
    receiverId: string;
    body: string;
  };
}

export type SendMessageResponse = SendMessageResult | SendMessageError;

export async function sendMessage(
  input: SendMessageInput & SendMessageContext,
): Promise<SendMessageResponse> {
  const receiver = await repository.findSafeUserById(input.receiverId);
  if (!receiver) {
    return { ok: false, error: "گیرنده یافت نشد.", status: 404 };
  }

  const message = await repository.createMessage({
    senderId: input.senderId,
    receiverId: input.receiverId,
    body: input.body,
  });

  // Event bus: revalidates messages/notifications/user tags and notifies
  // the receiver.
  await publish({
    type: "message:sent",
    senderId: input.senderId,
    receiverId: input.receiverId,
    senderName: input.senderName,
  });

  return {
    ok: true,
    message: {
      id: message.id,
      senderId: message.senderId,
      receiverId: message.receiverId,
      body: message.body,
    },
  };
}

/** Convert a UseCase response to a NextResponse. */
export function buildUseCaseResponse(result: SendMessageResponse): NextResponse {
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ message: result.message }, { status: 201 });
}
