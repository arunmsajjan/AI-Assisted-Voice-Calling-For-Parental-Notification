import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { getCookie, setCookie } from "hono/cookie";
import {
  authMiddleware,
  exchangeCodeForSessionToken,
  getOAuthRedirectUrl,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";
import {
  CreateStudentSchema,
  UpdateStudentSchema,
  CreateParentSchema,
  CreateAlertSchema,
} from "@/shared/types";
import { webhook } from "./webhook";

interface Env {
  DB: D1Database;
  MOCHA_USERS_SERVICE_API_URL: string;
  MOCHA_USERS_SERVICE_API_KEY: string;
  CLICKSEND_USERNAME: string;
  CLICKSEND_API_KEY: string;
}

const app = new Hono<{ Bindings: Env }>();

// Mount webhook routes
app.route("/", webhook);

// Auth routes
app.get('/api/oauth/google/redirect_url', async (c) => {
  const redirectUrl = await getOAuthRedirectUrl('google', {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json({ redirectUrl }, 200);
});

app.post("/api/sessions", async (c) => {
  const body = await c.req.json();

  if (!body.code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  const sessionToken = await exchangeCodeForSessionToken(body.code, {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 60 * 24 * 60 * 60, // 60 days
  });

  return c.json({ success: true }, 200);
});

app.get("/api/users/me", authMiddleware, async (c) => {
  return c.json(c.get("user"));
});

app.get('/api/logout', async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === 'string') {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// Analytics data for analysis page
app.get("/api/analytics/overview", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    // Get alerts by severity and status
    const alertsBySeverity = await c.env.DB.prepare(`
      SELECT severity, COUNT(*) as count 
      FROM alerts 
      WHERE user_id = ? 
      GROUP BY severity
    `).bind(user.id).all();

    const alertsByStatus = await c.env.DB.prepare(`
      SELECT status, COUNT(*) as count 
      FROM alerts 
      WHERE user_id = ? 
      GROUP BY status
    `).bind(user.id).all();

    const alertsByType = await c.env.DB.prepare(`
      SELECT alert_type, COUNT(*) as count 
      FROM alerts 
      WHERE user_id = ? 
      GROUP BY alert_type 
      ORDER BY count DESC 
      LIMIT 10
    `).bind(user.id).all();

    // Call success rates by parent relationship
    const callsByRelationship = await c.env.DB.prepare(`
      SELECT p.relationship, 
             COUNT(*) as total_calls,
             COUNT(CASE WHEN cl.call_status = 'completed' THEN 1 END) as successful_calls
      FROM call_logs cl
      JOIN parents p ON cl.parent_id = p.id
      WHERE cl.user_id = ?
      GROUP BY p.relationship
    `).bind(user.id).all();

    // Monthly trends (last 6 months)
    const monthlyTrends = await c.env.DB.prepare(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(CASE WHEN EXISTS(SELECT 1 FROM students WHERE user_id = ? AND id = alerts.student_id) THEN 1 END) as alerts_created,
        COUNT(CASE WHEN EXISTS(SELECT 1 FROM call_logs WHERE alert_id = alerts.id AND call_status = 'completed') THEN 1 END) as calls_completed
      FROM alerts
      WHERE created_at >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month DESC
    `).bind(user.id).all();

    // Student performance metrics
    const studentPerformance = await c.env.DB.prepare(`
      SELECT 
        CASE 
          WHEN gpa >= 8.0 THEN 'Excellent (8.0+)'
          WHEN gpa >= 7.0 THEN 'Good (7.0-7.9)'
          WHEN gpa >= 6.0 THEN 'Average (6.0-6.9)'
          WHEN gpa < 6.0 THEN 'Below Average (<6.0)'
          ELSE 'Not Available'
        END as performance_category,
        COUNT(*) as student_count,
        COUNT(CASE WHEN EXISTS(SELECT 1 FROM alerts WHERE student_id = students.id) THEN 1 END) as students_with_alerts
      FROM students
      WHERE user_id = ?
      GROUP BY performance_category
    `).bind(user.id).all();

    // Response time analysis
    const responseTimeAnalysis = await c.env.DB.prepare(`
      SELECT 
        CASE 
          WHEN julianday(cl.created_at) - julianday(a.created_at) <= 1 THEN 'Within 24 hours'
          WHEN julianday(cl.created_at) - julianday(a.created_at) <= 3 THEN 'Within 3 days'
          WHEN julianday(cl.created_at) - julianday(a.created_at) <= 7 THEN 'Within 1 week'
          ELSE 'More than 1 week'
        END as response_category,
        COUNT(*) as count
      FROM alerts a
      JOIN call_logs cl ON a.id = cl.alert_id
      WHERE a.user_id = ?
      GROUP BY response_category
    `).bind(user.id).all();

    return c.json({
      alerts_by_severity: alertsBySeverity.results,
      alerts_by_status: alertsByStatus.results,
      alerts_by_type: alertsByType.results,
      calls_by_relationship: callsByRelationship.results,
      monthly_trends: monthlyTrends.results,
      student_performance: studentPerformance.results,
      response_time_analysis: responseTimeAnalysis.results,
    });

  } catch (error) {
    console.error("Analytics query error:", error);
    return c.json({ error: "Failed to fetch analytics data" }, 500);
  }
});

// Dashboard stats
app.get("/api/dashboard/stats", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const [studentsResult, parentsResult, alertsResult, callsResult] = await Promise.all([
    c.env.DB.prepare("SELECT COUNT(*) as count FROM students WHERE user_id = ?").bind(user.id).first(),
    c.env.DB.prepare("SELECT COUNT(*) as count FROM parents WHERE user_id = ?").bind(user.id).first(),
    c.env.DB.prepare("SELECT COUNT(*) as active, COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending FROM alerts WHERE user_id = ?").bind(user.id).first(),
    c.env.DB.prepare("SELECT COUNT(CASE WHEN call_status = 'completed' THEN 1 END) as completed, COUNT(*) as total FROM call_logs WHERE user_id = ?").bind(user.id).first()
  ]);

  const callsTotal = (callsResult as any)?.total || 0;
  const callsCompleted = (callsResult as any)?.completed || 0;

  const stats = {
    total_students: (studentsResult as any)?.count || 0,
    total_parents: (parentsResult as any)?.count || 0,
    active_alerts: (alertsResult as any)?.active || 0,
    completed_calls: callsCompleted,
    success_rate: callsTotal > 0 ? (callsCompleted / callsTotal) * 100 : 0,
    pending_alerts: (alertsResult as any)?.pending || 0,
    average_response_time: 0, // TODO: Calculate based on call logs
  };

  return c.json(stats);
});

// Student routes
app.get("/api/students", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM students WHERE user_id = ? ORDER BY created_at DESC"
  ).bind(user.id).all();

  return c.json(results);
});

app.post("/api/students", authMiddleware, zValidator("json", CreateStudentSchema), async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const studentData = c.req.valid("json");

  try {
    const result = await c.env.DB.prepare(`
      INSERT INTO students (name, roll_number, major, year_of_study, gpa, contact_number, email, 
                           attendance_percentage, disciplinary_notes, medical_alerts, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      studentData.name,
      studentData.roll_number,
      studentData.major,
      studentData.year_of_study,
      studentData.gpa || null,
      studentData.contact_number || null,
      studentData.email || null,
      studentData.attendance_percentage || null,
      studentData.disciplinary_notes || null,
      studentData.medical_alerts || null,
      user.id
    ).run();

    const newStudent = await c.env.DB.prepare(
      "SELECT * FROM students WHERE id = ?"
    ).bind(result.meta.last_row_id).first();

    return c.json(newStudent, 201);
  } catch (error: any) {
    if (error.message.includes("UNIQUE constraint failed")) {
      return c.json({ error: "Roll number already exists" }, 400);
    }
    return c.json({ error: "Failed to create student" }, 500);
  }
});

app.put("/api/students/:id", authMiddleware, zValidator("json", UpdateStudentSchema), async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const studentId = parseInt(c.req.param("id"));
  const updateData = c.req.valid("json");

  const existing = await c.env.DB.prepare(
    "SELECT * FROM students WHERE id = ? AND user_id = ?"
  ).bind(studentId, user.id).first();

  if (!existing) {
    return c.json({ error: "Student not found" }, 404);
  }

  const updateFields = [];
  const updateValues = [];
  
  for (const [key, value] of Object.entries(updateData)) {
    if (value !== undefined) {
      updateFields.push(`${key} = ?`);
      updateValues.push(value);
    }
  }

  if (updateFields.length === 0) {
    return c.json(existing);
  }

  updateFields.push("updated_at = CURRENT_TIMESTAMP");
  updateValues.push(studentId, user.id);

  await c.env.DB.prepare(`
    UPDATE students SET ${updateFields.join(", ")} 
    WHERE id = ? AND user_id = ?
  `).bind(...updateValues).run();

  const updatedStudent = await c.env.DB.prepare(
    "SELECT * FROM students WHERE id = ?"
  ).bind(studentId).first();

  return c.json(updatedStudent);
});

app.delete("/api/students/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const studentId = parseInt(c.req.param("id"));

  const result = await c.env.DB.prepare(
    "DELETE FROM students WHERE id = ? AND user_id = ?"
  ).bind(studentId, user.id).run();

  if (result.meta?.changes === 0) {
    return c.json({ error: "Student not found" }, 404);
  }

  return c.json({ success: true });
});

// Parent routes
app.get("/api/students/:studentId/parents", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const studentId = parseInt(c.req.param("studentId"));

  const { results } = await c.env.DB.prepare(`
    SELECT p.* FROM parents p 
    JOIN students s ON p.student_id = s.id 
    WHERE s.id = ? AND s.user_id = ?
  `).bind(studentId, user.id).all();

  return c.json(results);
});

app.post("/api/parents", authMiddleware, zValidator("json", CreateParentSchema), async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const parentData = c.req.valid("json");

  // Verify student belongs to user
  const student = await c.env.DB.prepare(
    "SELECT id FROM students WHERE id = ? AND user_id = ?"
  ).bind(parentData.student_id, user.id).first();

  if (!student) {
    return c.json({ error: "Student not found" }, 404);
  }

  const result = await c.env.DB.prepare(`
    INSERT INTO parents (student_id, name, relationship, contact_number, email, is_primary_contact, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    parentData.student_id,
    parentData.name,
    parentData.relationship,
    parentData.contact_number,
    parentData.email || null,
    parentData.is_primary_contact ? 1 : 0,
    user.id
  ).run();

  const newParent = await c.env.DB.prepare(
    "SELECT * FROM parents WHERE id = ?"
  ).bind(result.meta.last_row_id).first();

  return c.json(newParent, 201);
});

// Alert routes
app.get("/api/alerts", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const { results } = await c.env.DB.prepare(`
    SELECT a.*, s.name as student_name, s.roll_number 
    FROM alerts a 
    JOIN students s ON a.student_id = s.id 
    WHERE a.user_id = ? 
    ORDER BY a.created_at DESC
  `).bind(user.id).all();

  return c.json(results);
});

app.post("/api/alerts", authMiddleware, zValidator("json", CreateAlertSchema), async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const alertData = c.req.valid("json");

  // Verify student belongs to user
  const student = await c.env.DB.prepare(
    "SELECT id FROM students WHERE id = ? AND user_id = ?"
  ).bind(alertData.student_id, user.id).first();

  if (!student) {
    return c.json({ error: "Student not found" }, 404);
  }

  const result = await c.env.DB.prepare(`
    INSERT INTO alerts (student_id, title, description, severity, alert_type, user_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    alertData.student_id,
    alertData.title,
    alertData.description,
    alertData.severity,
    alertData.alert_type,
    user.id
  ).run();

  const newAlert = await c.env.DB.prepare(`
    SELECT a.*, s.name as student_name, s.roll_number 
    FROM alerts a 
    JOIN students s ON a.student_id = s.id 
    WHERE a.id = ?
  `).bind(result.meta.last_row_id).first();

  return c.json(newAlert, 201);
});

// Call logs
app.get("/api/call-logs", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const { results } = await c.env.DB.prepare(`
    SELECT cl.*, s.name as student_name, p.name as parent_name, a.title as alert_title
    FROM call_logs cl
    JOIN alerts a ON cl.alert_id = a.id
    JOIN students s ON a.student_id = s.id
    JOIN parents p ON cl.parent_id = p.id
    WHERE cl.user_id = ?
    ORDER BY cl.created_at DESC
  `).bind(user.id).all();

  return c.json(results);
});

// Test ClickSend credentials endpoint
app.get("/api/test-clicksend", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    if (!c.env.CLICKSEND_USERNAME || !c.env.CLICKSEND_API_KEY) {
      return c.json({ 
        error: "ClickSend credentials not configured",
        username_available: !!c.env.CLICKSEND_USERNAME,
        api_key_available: !!c.env.CLICKSEND_API_KEY
      }, 400);
    }

    const credentials = `${c.env.CLICKSEND_USERNAME}:${c.env.CLICKSEND_API_KEY}`;
    const authString = btoa(credentials);
    
    console.log('Testing ClickSend credentials...');
    console.log('Username:', c.env.CLICKSEND_USERNAME);
    console.log('API Key length:', c.env.CLICKSEND_API_KEY.length);
    
    // Test with account endpoint
    const response = await fetch('https://rest.clicksend.com/v3/account', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
      },
    });

    const responseData = await response.json();
    console.log('ClickSend test response:', responseData);

    return c.json({
      success: response.ok,
      status: response.status,
      response: responseData,
      credentials_format: credentials.replace(c.env.CLICKSEND_API_KEY, '***'),
      auth_string_preview: authString.substring(0, 20) + '...'
    });

  } catch (error) {
    console.error('ClickSend test error:', error);
    return c.json({ error: "Test failed", details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// Call parent endpoint
app.post("/api/call-parent", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const { alert_id, parent_id, phone_number } = await c.req.json();

  if (!alert_id || !parent_id || !phone_number) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  try {
    // Get alert and student details for voice message
    const alertDetails = await c.env.DB.prepare(`
      SELECT a.*, s.name as student_name, s.roll_number, s.major, s.year_of_study, s.gpa
      FROM alerts a
      JOIN students s ON a.student_id = s.id
      WHERE a.id = ? AND a.user_id = ?
    `).bind(alert_id, user.id).first();

    if (!alertDetails) {
      return c.json({ error: "Alert not found" }, 404);
    }

    // Create voice message template
    const gpaText = alertDetails.gpa ? `Current GPA is ${(alertDetails.gpa as number).toFixed(2)}. ` : '';
    const voiceMessage = `Hello, this is an automated message from C M R Institute of Technology regarding your ward ${alertDetails.student_name}, Roll Number ${alertDetails.roll_number}, studying ${alertDetails.major} in year ${alertDetails.year_of_study}. ${gpaText}Alert: ${alertDetails.title}. ${alertDetails.description} Please contact the college administration for more details. Thank you.`;

    // Integrate with ClickSend Voice API
    let callStatus = "failed";
    let callDuration: number | null = null;
    let externalCallId: string | null = null;

    try {
      // Debug: Check if credentials are available
      if (!c.env.CLICKSEND_USERNAME || !c.env.CLICKSEND_API_KEY) {
        console.error('ClickSend credentials not found');
        throw new Error('ClickSend credentials not configured');
      }

      console.log('ClickSend Username:', c.env.CLICKSEND_USERNAME);
      console.log('ClickSend API Key available:', !!c.env.CLICKSEND_API_KEY);
      
      // Prepare authentication header using btoa (compatible with Worker environment)
      const credentials = `${c.env.CLICKSEND_USERNAME}:${c.env.CLICKSEND_API_KEY}`;
      const authString = btoa(credentials);
      
      console.log('Auth credentials format:', credentials.replace(c.env.CLICKSEND_API_KEY, '***'));
      console.log('Auth string (base64):', authString);
      
      // Format phone number (remove any non-digits and ensure it starts with country code)
      let formattedPhone = phone_number.replace(/\D/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '91' + formattedPhone.substring(1); // Assuming India (+91)
      } else if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) {
        formattedPhone = '91' + formattedPhone;
      }

      console.log('Making ClickSend API call to:', formattedPhone);
      
      const clicksendResponse = await fetch('https://rest.clicksend.com/v3/voice/send', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{
            to: formattedPhone,
            body: voiceMessage,
            voice: 'female',
            custom_string: alert_id.toString(),
            require_input: 0,
            machine_detection: 0
          }]
        }),
      });

      const responseData: any = await clicksendResponse.json();
      console.log('ClickSend response:', responseData);

      if (clicksendResponse.ok && responseData.http_code === 200) {
        const messageData = responseData.data.messages[0];
        callStatus = "initiated";
        externalCallId = messageData.message_id;
        
        // ClickSend voice calls typically don't provide immediate duration
        // The status will be updated via webhooks or polling
        console.log('Voice call initiated successfully with message ID:', externalCallId);
      } else {
        console.error('ClickSend API error:', responseData);
        callStatus = "failed";
      }
    } catch (error) {
      console.error('ClickSend API request failed:', error);
      callStatus = "failed";
    }

    // Log the call attempt
    const result = await c.env.DB.prepare(`
      INSERT INTO call_logs (alert_id, parent_id, phone_number, call_status, call_duration, external_call_id, message_template, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(alert_id, parent_id, phone_number, callStatus, callDuration, externalCallId, voiceMessage, user.id).run();

    // Update alert status based on call result
    const alertStatus = callStatus === "initiated" ? "in_progress" : "pending";
    await c.env.DB.prepare(`
      UPDATE alerts SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(alertStatus, alert_id).run();

    return c.json({ 
      success: callStatus !== "failed", 
      call_status: callStatus,
      call_log_id: result.meta.last_row_id,
      external_call_id: externalCallId 
    });

  } catch (error) {
    console.error("Call parent error:", error);
    return c.json({ error: "Failed to initiate call" }, 500);
  }
});

export default app;
