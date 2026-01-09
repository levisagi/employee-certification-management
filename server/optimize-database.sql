-- אופטימיזציה של מסד הנתונים להאצת שאילתות
-- הרץ את הקובץ הזה ב-Supabase SQL Editor

-- Index על employee_id בטבלת certifications (מאיץ את ה-JOIN)
CREATE INDEX IF NOT EXISTS idx_certifications_employee_id ON certifications(employee_id);

-- Index על certification_id בטבלת ojt_records (מאיץ את תת-השאילתות)
CREATE INDEX IF NOT EXISTS idx_ojt_records_certification_id ON ojt_records(certification_id);

-- Index על display_order ו-created_at בטבלת employees (מאיץ את המיון)
CREATE INDEX IF NOT EXISTS idx_employees_display_order ON employees(display_order ASC, created_at DESC);

-- Index על employee_id בטבלת equipment (אם יש קשר עתידי)
CREATE INDEX IF NOT EXISTS idx_equipment_display_order ON equipment(display_order ASC, name ASC);

-- Analyze tables לעדכון סטטיסטיקות
ANALYZE employees;
ANALYZE certifications;
ANALYZE ojt_records;
ANALYZE equipment;

