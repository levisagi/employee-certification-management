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
                (certificate IS NOT NULL) as "hasCertificate",
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
        return result.rows[0].certificate;
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
                image,
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
                certificate,
                display_order as "displayOrder"`,
            [name, serialNumber, company, lastCalibrationDate, nextCalibrationDate, 
             category, location, notes, certificate, displayOrder]
        );
        return result.rows[0];
    }

    // עדכון ציוד
    // ⚡ שימוש ב-COALESCE כבר מגן מפני איבוד התעודה כשלא נשלחת
    static async update(id, equipmentData) {
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
            displayOrder
        } = equipmentData;

        const result = await db.query(
            `UPDATE equipment SET
                name = COALESCE($1, name),
                serial_number = COALESCE($2, serial_number),
                company = COALESCE($3, company),
                last_calibration_date = COALESCE($4, last_calibration_date),
                next_calibration_date = COALESCE($5, next_calibration_date),
                category = COALESCE($6, category),
                location = COALESCE($7, location),
                notes = COALESCE($8, notes),
                certificate = COALESCE($9, certificate),
                display_order = COALESCE($10, display_order),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $11
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
                (certificate IS NOT NULL) as "hasCertificate",
                display_order as "displayOrder"`,
            [name, serialNumber, company, lastCalibrationDate, nextCalibrationDate,
             category, location, notes, certificate, displayOrder, id]
        );
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
                image,
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

