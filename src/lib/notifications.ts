import { supabase } from "@/integrations/supabase/client";

export type NotificationType =
  | "welcome"
  | "account_approved"
  | "account_rejected"
  | "task_approved"
  | "task_rejected"
  | "task_retry_allowed"
  | "task_closed"
  | "withdrawal_approved"
  | "withdrawal_rejected"
  | "new_task"
  | "broadcast";

interface SendNotificationArgs {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}

/**
 * Creates an in-app notification record AND attempts to send an email.
 * Email sending happens via the `send-notification` edge function which
 * gracefully no-ops if no sender domain is configured yet.
 */
export async function sendNotification(args: SendNotificationArgs) {
  try {
    const { data, error } = await supabase.functions.invoke("send-notification", {
      body: args,
    });
    if (error) {
      console.error("send-notification error:", error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error("send-notification exception:", err);
    return { success: false, error: err };
  }
}

/** Bulk send to all active users (admin broadcast). */
export async function broadcastNotification(args: {
  title: string;
  message: string;
  link?: string;
}) {
  const { data, error } = await supabase.functions.invoke("send-notification", {
    body: { broadcast: true, ...args, type: "broadcast" },
  });
  if (error) return { success: false, error };
  return { success: true, data };
}
