-- יצירת טבלת עובדים
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    employee_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    profile_image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- יצירת טבלת הסמכות
CREATE TABLE IF NOT EXISTS certifications (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    issue_date TIMESTAMP NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    status VARCHAR(20) NOT NULL CHECK (status IN ('valid', 'expired', 'expiring-soon')),
    is_required BOOLEAN DEFAULT FALSE,
    certificate TEXT,
    certificate_file_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- יצירת טבלת OJT (On-the-Job Training)
CREATE TABLE IF NOT EXISTS ojt_records (
    id SERIAL PRIMARY KEY,
    certification_id INTEGER NOT NULL REFERENCES certifications(id) ON DELETE CASCADE,
    ojt_number INTEGER NOT NULL CHECK (ojt_number IN (1, 2)),
    mentor VARCHAR(255) NOT NULL,
    date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(certification_id, ojt_number)
);

-- אינדקסים לשיפור ביצועים
CREATE INDEX IF NOT EXISTS idx_employees_employee_number ON employees(employee_number);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_name ON employees(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_certifications_employee_id ON certifications(employee_id);
CREATE INDEX IF NOT EXISTS idx_certifications_status ON certifications(status);
CREATE INDEX IF NOT EXISTS idx_certifications_expiry_date ON certifications(expiry_date);
CREATE INDEX IF NOT EXISTS idx_ojt_certification_id ON ojt_records(certification_id);

-- פונקציה לעדכון אוטומטי של updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- טריגרים לעדכון אוטומטי של updated_at
DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_certifications_updated_at ON certifications;
CREATE TRIGGER update_certifications_updated_at
    BEFORE UPDATE ON certifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- View לקבלת עובדים עם כל ההסמכות שלהם (אופציונלי, לשאילתות מהירות)
CREATE OR REPLACE VIEW employees_with_certifications AS
SELECT 
    e.*,
    json_agg(
        json_build_object(
            'id', c.id,
            'name', c.name,
            'issueDate', c.issue_date,
            'expiryDate', c.expiry_date,
            'startDate', c.start_date,
            'endDate', c.end_date,
            'status', c.status,
            'isRequired', c.is_required,
            'certificate', c.certificate,
            'certificateFileName', c.certificate_file_name,
            'ojt1', (
                SELECT json_build_object('mentor', mentor, 'date', date)
                FROM ojt_records
                WHERE certification_id = c.id AND ojt_number = 1
            ),
            'ojt2', (
                SELECT json_build_object('mentor', mentor, 'date', date)
                FROM ojt_records
                WHERE certification_id = c.id AND ojt_number = 2
            )
        ) ORDER BY c.created_at
    ) FILTER (WHERE c.id IS NOT NULL) AS certifications
FROM employees e
LEFT JOIN certifications c ON e.id = c.employee_id
GROUP BY e.id;

-- הערות לשימוש:
-- 1. הרץ את הקובץ הזה ב-Supabase SQL Editor כדי ליצור את הטבלאות
-- 2. אפשר גם להריץ אותו מהקוד באמצעות migration script
-- 3. ה-View employees_with_certifications מאפשר לקבל עובדים עם כל ההסמכות בשאילתה אחת

