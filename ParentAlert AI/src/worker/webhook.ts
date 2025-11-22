// ClickSend webhook handler for voice call status updates
import { Hono } from "hono";

interface Env {
  DB: D1Database;
  MOCHA_USERS_SERVICE_API_URL: string;
  MOCHA_USERS_SERVICE_API_KEY: string;
  CLICKSEND_USERNAME: string;
  CLICKSEND_API_KEY: string;
}

const webhook = new Hono<{ Bindings: Env }>();

// ClickSend voice webhook endpoint
webhook.post("/api/webhooks/clicksend/voice", async (c) => {
  try {
    const body = await c.req.json();
    console.log('ClickSend voice webhook received:', body);

    // ClickSend sends webhook data in this format:
    const { message_id, status } = body;
    
    if (!message_id || !status) {
      console.error('Invalid webhook data:', body);
      return c.json({ error: "Invalid webhook data" }, 400);
    }

    // Map ClickSend status to our status
    let callStatus = "initiated";
    let callDuration: number | null = null;

    switch (status) {
      case "Delivered":
      case "Answered":
        callStatus = "completed";
        // Duration might be provided in the webhook data
        callDuration = body.duration || 60; // Default to 60 seconds if not provided
        break;
      case "No Answer":
      case "Unanswered":
        callStatus = "no_answer";
        break;
      case "Failed":
      case "Error":
        callStatus = "failed";
        break;
      default:
        callStatus = "initiated";
    }

    // Update the call log with the new status
    const updateResult = await c.env.DB.prepare(`
      UPDATE call_logs 
      SET call_status = ?, call_duration = ?, updated_at = CURRENT_TIMESTAMP
      WHERE external_call_id = ?
    `).bind(callStatus, callDuration, message_id).run();

    if (updateResult.meta?.changes === 0) {
      console.error('No call log found for message_id:', message_id);
      return c.json({ error: "Call log not found" }, 404);
    }

    // If call was completed, update the associated alert
    if (callStatus === "completed") {
      // Get the alert_id from the call log
      const callLog = await c.env.DB.prepare(`
        SELECT alert_id FROM call_logs WHERE external_call_id = ?
      `).bind(message_id).first();

      if (callLog) {
        await c.env.DB.prepare(`
          UPDATE alerts SET status = 'completed', updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).bind((callLog as any).alert_id).run();
      }
    }

    console.log(`Updated call log for message_id ${message_id} to status ${callStatus}`);
    return c.json({ success: true, status: callStatus });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return c.json({ error: "Webhook processing failed" }, 500);
  }
});

export { webhook };
