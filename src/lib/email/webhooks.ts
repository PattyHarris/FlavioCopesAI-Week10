import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ResendWebhookPayload = {
  type: string;
  created_at?: string;
  data?: {
    email_id?: string;
    [key: string]: unknown;
  };
};

function getDeliveryPatch(eventType: string, occurredAt: string) {
  switch (eventType) {
    case "email.delivered":
      return {
        status: "delivered",
        delivered_at: occurredAt,
      };
    case "email.opened":
      return {
        status: "opened",
        opened_at: occurredAt,
      };
    case "email.clicked":
      return {
        status: "clicked",
        clicked_at: occurredAt,
      };
    case "email.bounced":
      return {
        status: "bounced",
        bounced_at: occurredAt,
      };
    case "email.failed":
      return {
        status: "failed",
      };
    case "email.complained":
      return {
        status: "complained",
      };
    default:
      return null;
  }
}

export async function processResendWebhookEvent(payload: ResendWebhookPayload) {
  const emailId = payload.data?.email_id;

  if (!emailId) {
    throw new Error("Webhook payload did not include data.email_id.");
  }

  const patch = getDeliveryPatch(payload.type, payload.created_at ?? new Date().toISOString());

  if (!patch) {
    return {
      ignored: true,
      reason: `Unhandled event type: ${payload.type}`,
    };
  }

  const supabase = createSupabaseAdminClient();

  const { data: existingDelivery, error: deliveryLookupError } = await supabase
    .from("email_deliveries")
    .select("id, metadata")
    .eq("provider_message_id", emailId)
    .maybeSingle();

  if (deliveryLookupError) {
    throw new Error(deliveryLookupError.message);
  }

  if (!existingDelivery) {
    return {
      ignored: true,
      reason: `No delivery matched provider_message_id ${emailId}.`,
    };
  }

  const nextMetadata = {
    ...(typeof existingDelivery.metadata === "object" && existingDelivery.metadata !== null
      ? existingDelivery.metadata
      : {}),
    resend_event_type: payload.type,
    resend_event_received_at: new Date().toISOString(),
    resend_last_event: payload,
  };

  const { error: updateError } = await supabase
    .from("email_deliveries")
    .update({
      ...patch,
      metadata: nextMetadata,
    })
    .eq("id", existingDelivery.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return {
    ignored: false,
    deliveryId: existingDelivery.id,
    eventType: payload.type,
  };
}
