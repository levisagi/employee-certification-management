-- הוספת שדות סטטוס כיול לטבלת equipment
-- בכיול כרגע + לא נדרש כיול (מעקב בלבד)

ALTER TABLE equipment
ADD COLUMN IF NOT EXISTS in_calibration BOOLEAN DEFAULT FALSE;

ALTER TABLE equipment
ADD COLUMN IF NOT EXISTS calibration_not_required BOOLEAN DEFAULT FALSE;
