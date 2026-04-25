const db = require('../database');

class EquipmentModel {
    // קבלת כל הציוד
    // ⚡ אופטימיזציה: לא מחזיר את קובץ התעודה (certificate) כדי להאיץ טעינה
    // קובץ התעודה נטען בנפרד רק כשנדרש דרך /api/equipment/:id/certificate
    static async getAll() {
        const result = await db.query(
            `SELECT 
                id as _id,
                name,
                serial_number as "serialNumber",
                company,
                last_calibration_date as "lastCalibrationDate",
                next_calibration_date as "nextCalibrationDate",
                category,
                location,
                notes,
                (certificate IS NOT NULL AND certificate != '') as "hasCertificate",
                display_order as "displayOrder",
                created_at as "createdAt",
                updated_at as "updatedAt"
            FROM equipment 
            ORDER BY display_order, name`
        );
        return result.rows;
    }

    // קבלת קובץ תעודה בודד של ציוד ספציפי
    static async getCertificate(id) {
        const result = await db.query(
            'SELECT certificate FROM equipment WHERE id = $1',
            [id]
        );
        if (result.rows.length === 0) {
            return null;
        }
        // מחרוזת ריקה נחשבת כאין תעודה
        const cert = result.rows[0].certificate;
        return cert && cert.length > 0 ? cert : null;
    }

    // קבלת ציוד לפי ID
    static async getById(id) {
        const result = await db.query(
            `SELECT 
                id as _id,
                name,
                serial_number as "serialNumber",
                company,
                last_calibration_date as "lastCalibrationDate",
                next_calibration_date as "nextCalibrationDate",
                category,
                location,
                notes,
                (certificate IS NOT NULL AND certificate != '') as "hasCertificate",
                display_order as "displayOrder",
                created_at as "createdAt",
                updated_at as "updatedAt"
            FROM equipment 
            WHERE id = $1`,
            [id]
        );
        return result.rows[0];
    }

    // יצירת ציוד חדש
    static async create(equipmentData) {
        const {
            name,
            serialNumber,
            company,
            lastCalibrationDate,
            nextCalibrationDate,
            category,
            location,
            notes,
            certificate,
            displayOrder = 0
        } = equipmentData;

        // מחרוזת ריקה נשמרת כ-NULL (אין תעודה)
        const certValue = certificate && certificate.length > 0 ? certificate : null;

        const result = await db.query(
            `INSERT INTO equipment (
                name, 
                serial_number, 
                company, 
                last_calibration_date, 
                next_calibration_date, 
                category, 
                location, 
                notes, 
                certificate, 
                display_order
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING 
                id as _id,
                name,
                serial_number as "serialNumber",
                company,
                last_calibration_date as "lastCalibrationDate",
                next_calibration_date as "nextCalibrationDate",
                category,
                location,
                notes,
                (certificate IS NOT NULL AND certificate != '') as "hasCertificate",
                display_order as "displayOrder"`,
            [name, serialNumber, company, lastCalibrationDate, nextCalibrationDate, 
             category, location, notes, certValue, displayOrder]
        );
        return result.rows[0];
    }

    // עדכון ציוד
    // ⚡ עדכון דינמי: מעדכן רק שדות שנשלחים בבקשה. שדה certificate מעודכן רק אם נשלח במפורש.
    // זה מגן מפני דריסת התעודה כשהקליינט משתמש ב-lazy loading ולא שולח את הקובץ המלא.
    static async update(id, equipmentData) {
        const fieldMap = {
            name: 'name',
            serialNumber: 'serial_number',
            company: 'company',
            lastCalibrationDate: 'last_calibration_date',
            nextCalibrationDate: 'next_calibration_date',
            category: 'category',
            location: 'location',
            notes: 'notes',
            certificate: 'certificate',
            displayOrder: 'display_order'
        };

        const sets = [];
        const values = [];
        let idx = 1;

        for (const [key, column] of Object.entries(fieldMap)) {
            if (key in equipmentData) {
                let value = equipmentData[key];
                // מחרוזת ריקה בתעודה נחשבת כהסרת התעודה (NULL)
                if (key === 'certificate' && value === '') {
                    value = null;
                }
                sets.push(`${column} = $${idx}`);
                values.push(value);
                idx++;
            }
        }

        // אם אין שדות לעדכן, החזר את הנתונים הקיימים
        if (sets.length === 0) {
            return await EquipmentModel.getById(id);
        }

        sets.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        const query = `
            UPDATE equipment SET
                ${sets.join(', ')}
            WHERE id = $${idx}
            RETURNING 
                id as _id,
                name,
                serial_number as "serialNumber",
                company,
                last_calibration_date as "lastCalibrationDate",
                next_calibration_date as "nextCalibrationDate",
                category,
                location,
                notes,
                (certificate IS NOT NULL AND certificate != '') as "hasCertificate",
                display_order as "displayOrder"
        `;

        const result = await db.query(query, values);
        return result.rows[0];
    }

    // מחיקת ציוד
    static async delete(id) {
        await db.query('DELETE FROM equipment WHERE id = $1', [id]);
        return { success: true };
    }

    // עדכון סדר תצוגה
    static async updateDisplayOrder(equipmentIds) {
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');
            
            for (let i = 0; i < equipmentIds.length; i++) {
                await client.query(
                    'UPDATE equipment SET display_order = $1 WHERE id = $2',
                    [i, equipmentIds[i]]
                );
            }
            
            await client.query('COMMIT');
            return { success: true };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // חיפוש ציוד
    static async search(query) {
        const searchPattern = `%${query}%`;
        const result = await db.query(
            `SELECT 
                id as _id,
                name,
                serial_number as "serialNumber",
                company,
                last_calibration_date as "lastCalibrationDate",
                next_calibration_date as "nextCalibrationDate",
                category,
                location,
                notes,
                (certificate IS NOT NULL AND certificate != '') as "hasCertificate",
                display_order as "displayOrder"
            FROM equipment 
            WHERE 
                name ILIKE $1 OR 
                serial_number ILIKE $1 OR 
                company ILIKE $1 OR 
                location ILIKE $1 OR
                category ILIKE $1
            ORDER BY display_order, name`,
            [searchPattern]
        );
        return result.rows;
    }
}

module.exports = EquipmentModel;

