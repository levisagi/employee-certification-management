-- ניקוי ערכי תעודה ריקים (מחרוזת '') והחלפתם ב-NULL
-- זה תיקון חד-פעמי לרשומות שנפגעו מהבאג ב-lazy loading

UPDATE equipment 
SET certificate = NULL 
WHERE certificate = '';

-- וידוא
SELECT 
    id, 
    name, 
    CASE 
        WHEN certificate IS NULL THEN 'NULL'
        WHEN certificate = '' THEN 'EMPTY STRING'
        ELSE 'HAS DATA'
    END as certificate_status
FROM equipment
ORDER BY id;
