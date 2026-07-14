const db = require('../database');

// שדות בסיס משותפים להחזרה (ללא certificate מלא)
const EQUIPMENT_SELECT = `
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
    COALESCE(in_calibration, false) as "inCalibration",
    COALESCE(calibration_not_required, false) as "calibrationNotRequired",
    display_order as "displayOrder",
    created_at as "createdAt",
    updated_at as "updatedAt"
`;

class EquipmentModel {
    // וידוא שדות חדשים קיימים במסד הנתונים
    static async ensureSchema() {
        await db.query(`
            ALTER TABLE equipment
            ADD COLUMN IF NOT EXISTS in_calibration BOOLEAN DEFAULT FALSE
        `);
        await db.query(`
            ALTER TABLE equipment
            ADD COLUMN IF NOT EXISTS calibration_not_required BOOLEAN DEFAULT FALSE
        `);
        console.log('✓ Equipment calibration status columns ready');
    }

    // קבלת כל הציוד
    // ⚡ אופטימיזציה: לא מחזיר את קובץ התעודה (certificate) כדי להאיץ טעינה
    static async getAll() {
        const result = await db.query(
            `SELECT ${EQUIPMENT_SELECT}
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
        const cert = result.rows[0].certificate;
        return cert && cert.length > 0 ? cert : null;
    }

    // קבלת ציוד לפי ID
    static async getById(id) {
        const result = await db.query(
            `SELECT ${EQUIPMENT_SELECT}
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
            inCalibration = false,
            calibrationNotRequired = false,
            displayOrder = 0
        } = equipmentData;

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
                in_calibration,
                calibration_not_required,
                display_order
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING ${EQUIPMENT_SELECT}`,
            [
                name, serialNumber, company, lastCalibrationDate, nextCalibrationDate,
                category, location, notes, certValue,
                !!inCalibration, !!calibrationNotRequired, displayOrder
            ]
        );
        return result.rows[0];
    }

    // עדכון ציוד - עדכון דינמי של שדות שנשלחו בלבד
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
            inCalibration: 'in_calibration',
            calibrationNotRequired: 'calibration_not_required',
            displayOrder: 'display_order'
        };

        const sets = [];
        const values = [];
        let idx = 1;

        for (const [key, column] of Object.entries(fieldMap)) {
            if (key in equipmentData) {
                let value = equipmentData[key];
                if (key === 'certificate' && value === '') {
                    value = null;
                }
                if (key === 'inCalibration' || key === 'calibrationNotRequired') {
                    value = !!value;
                }
                sets.push(`${column} = $${idx}`);
                values.push(value);
                idx++;
            }
        }

        if (sets.length === 0) {
            return await EquipmentModel.getById(id);
        }

        sets.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        const query = `
            UPDATE equipment SET
                ${sets.join(', ')}
            WHERE id = $${idx}
            RETURNING ${EQUIPMENT_SELECT}
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
            `SELECT ${EQUIPMENT_SELECT}
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
