import z from "zod";

// Student schemas
export const CreateStudentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  roll_number: z.string().min(1, "Roll number is required"),
  major: z.string().min(1, "Major/Department is required"),
  year_of_study: z.number().int().min(1).max(5),
  gpa: z.number().min(0).max(10).optional(),
  contact_number: z.string().optional(),
  email: z.string().email().optional(),
  attendance_percentage: z.number().min(0).max(100).optional(),
  disciplinary_notes: z.string().optional(),
  medical_alerts: z.string().optional(),
});

export const UpdateStudentSchema = CreateStudentSchema.partial();

export const StudentSchema = z.object({
  id: z.number(),
  name: z.string(),
  roll_number: z.string(),
  major: z.string(),
  year_of_study: z.number(),
  gpa: z.number().nullable(),
  contact_number: z.string().nullable(),
  email: z.string().nullable(),
  attendance_percentage: z.number().nullable(),
  disciplinary_notes: z.string().nullable(),
  medical_alerts: z.string().nullable(),
  user_id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Parent schemas
export const CreateParentSchema = z.object({
  student_id: z.number(),
  name: z.string().min(1, "Parent name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  contact_number: z.string().min(1, "Contact number is required"),
  email: z.string().email().optional(),
  is_primary_contact: z.boolean().default(false),
});

export const ParentSchema = z.object({
  id: z.number(),
  student_id: z.number(),
  name: z.string(),
  relationship: z.string(),
  contact_number: z.string(),
  email: z.string().nullable(),
  is_primary_contact: z.number(),
  user_id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Alert schemas
export const CreateAlertSchema = z.object({
  student_id: z.number(),
  title: z.string().min(1, "Alert title is required"),
  description: z.string().min(1, "Alert description is required"),
  severity: z.enum(['medium', 'high', 'critical']),
  alert_type: z.string().min(1, "Alert type is required"),
});

export const AlertSchema = z.object({
  id: z.number(),
  student_id: z.number(),
  title: z.string(),
  description: z.string(),
  severity: z.string(),
  status: z.string(),
  alert_type: z.string(),
  user_id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Call log schemas
export const CallLogSchema = z.object({
  id: z.number(),
  alert_id: z.number(),
  parent_id: z.number(),
  phone_number: z.string(),
  call_status: z.string(),
  call_duration: z.number().nullable(),
  external_call_id: z.string().nullable(),
  message_template: z.string().nullable(),
  user_id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Dashboard stats schema
export const DashboardStatsSchema = z.object({
  total_students: z.number(),
  total_parents: z.number(),
  active_alerts: z.number(),
  completed_calls: z.number(),
  success_rate: z.number(),
  pending_alerts: z.number(),
  average_response_time: z.number(),
});

// Type exports
export type CreateStudentType = z.infer<typeof CreateStudentSchema>;
export type UpdateStudentType = z.infer<typeof UpdateStudentSchema>;
export type StudentType = z.infer<typeof StudentSchema>;
export type CreateParentType = z.infer<typeof CreateParentSchema>;
export type ParentType = z.infer<typeof ParentSchema>;
export type CreateAlertType = z.infer<typeof CreateAlertSchema>;
export type AlertType = z.infer<typeof AlertSchema>;
export type CallLogType = z.infer<typeof CallLogSchema>;
export type DashboardStatsType = z.infer<typeof DashboardStatsSchema>;
