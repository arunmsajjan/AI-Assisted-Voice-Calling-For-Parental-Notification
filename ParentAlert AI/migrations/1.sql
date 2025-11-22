
-- Students table
CREATE TABLE students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  roll_number TEXT NOT NULL UNIQUE,
  major TEXT NOT NULL,
  year_of_study INTEGER NOT NULL,
  gpa REAL,
  contact_number TEXT,
  email TEXT,
  attendance_percentage REAL DEFAULT 0,
  disciplinary_notes TEXT,
  medical_alerts TEXT,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Parents table
CREATE TABLE parents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  email TEXT,
  is_primary_contact BOOLEAN DEFAULT 0,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alerts table
CREATE TABLE alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  alert_type TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Call logs table
CREATE TABLE call_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alert_id INTEGER NOT NULL,
  parent_id INTEGER NOT NULL,
  phone_number TEXT NOT NULL,
  call_status TEXT NOT NULL DEFAULT 'initiated' CHECK (call_status IN ('initiated', 'completed', 'failed', 'no_answer')),
  call_duration INTEGER DEFAULT 0,
  external_call_id TEXT,
  message_template TEXT,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_students_roll_number ON students(roll_number);
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_parents_student_id ON parents(student_id);
CREATE INDEX idx_parents_user_id ON parents(user_id);
CREATE INDEX idx_alerts_student_id ON alerts(student_id);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_call_logs_alert_id ON call_logs(alert_id);
CREATE INDEX idx_call_logs_user_id ON call_logs(user_id);
