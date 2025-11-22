
-- Drop indexes
DROP INDEX idx_call_logs_user_id;
DROP INDEX idx_call_logs_alert_id;
DROP INDEX idx_alerts_user_id;
DROP INDEX idx_alerts_status;
DROP INDEX idx_alerts_student_id;
DROP INDEX idx_parents_user_id;
DROP INDEX idx_parents_student_id;
DROP INDEX idx_students_user_id;
DROP INDEX idx_students_roll_number;

-- Drop tables
DROP TABLE call_logs;
DROP TABLE alerts;
DROP TABLE parents;
DROP TABLE students;
