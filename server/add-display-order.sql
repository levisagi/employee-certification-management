-- הוספת עמודה display_order לטבלת employees
ALTER TABLE employees ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- עדכון display_order לעובדים קיימים (לפי id)
UPDATE employees SET display_order = id WHERE display_order = 0;

-- יצירת אינדקס לשיפור ביצועים
CREATE INDEX IF NOT EXISTS idx_employees_display_order ON employees(display_order);





