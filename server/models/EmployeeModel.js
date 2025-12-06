const db = require('../database');

class EmployeeModel {
    /**
     * קבלת כל העובדים עם ההסמכות שלהם
     */
    static async findAll() {
        const query = `
            SELECT 
                e.id,
                e.employee_number,
                e.first_name,
                e.last_name,
                e.phone_number,
                e.email,
                e.role,
                e.department,
                e.start_date,
                e.profile_image,
                e.created_at,
                e.updated_at,
                COALESCE(
                    json_agg(
                        CASE WHEN c.id IS NOT NULL THEN
                            json_build_object(
                                '_id', c.id,
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
                            )
                        END ORDER BY c.created_at
                    ) FILTER (WHERE c.id IS NOT NULL),
                    '[]'
                ) as certifications
            FROM employees e
            LEFT JOIN certifications c ON e.id = c.employee_id
            GROUP BY e.id
            ORDER BY e.created_at DESC
        `;
        
        const result = await db.query(query);
        return result.rows.map(row => this.formatEmployee(row));
    }

    /**
     * קבלת עובד בודד לפי ID
     */
    static async findById(id) {
        const query = `
            SELECT 
                e.id,
                e.employee_number,
                e.first_name,
                e.last_name,
                e.phone_number,
                e.email,
                e.role,
                e.department,
                e.start_date,
                e.profile_image,
                e.created_at,
                e.updated_at,
                COALESCE(
                    json_agg(
                        CASE WHEN c.id IS NOT NULL THEN
                            json_build_object(
                                '_id', c.id,
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
                            )
                        END ORDER BY c.created_at
                    ) FILTER (WHERE c.id IS NOT NULL),
                    '[]'
                ) as certifications
            FROM employees e
            LEFT JOIN certifications c ON e.id = c.employee_id
            WHERE e.id = $1
            GROUP BY e.id
        `;
        
        const result = await db.query(query, [id]);
        if (result.rows.length === 0) {
            return null;
        }
        return this.formatEmployee(result.rows[0]);
    }

    /**
     * יצירת עובד חדש
     */
    static async create(employeeData) {
        const client = await db.getClient();
        
        try {
            await client.query('BEGIN');
            
            // הכנסת העובד
            const employeeQuery = `
                INSERT INTO employees (
                    employee_number, first_name, last_name, phone_number,
                    email, role, department, start_date, profile_image
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING id
            `;
            
            const employeeValues = [
                employeeData.employeeNumber,
                employeeData.firstName,
                employeeData.lastName,
                employeeData.phoneNumber,
                employeeData.email,
                employeeData.role,
                employeeData.department,
                employeeData.startDate || new Date(),
                employeeData.profileImage || null
            ];
            
            const employeeResult = await client.query(employeeQuery, employeeValues);
            const employeeId = employeeResult.rows[0].id;
            
            // הכנסת הסמכות
            if (employeeData.certifications && employeeData.certifications.length > 0) {
                for (const cert of employeeData.certifications) {
                    await this.addCertification(client, employeeId, cert);
                }
            }
            
            await client.query('COMMIT');
            
            // החזרת העובד המלא
            return await this.findById(employeeId);
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * עדכון עובד קיים
     */
    static async update(id, employeeData) {
        const client = await db.getClient();
        
        try {
            await client.query('BEGIN');
            
            // עדכון פרטי העובד
            const employeeQuery = `
                UPDATE employees
                SET employee_number = $1, first_name = $2, last_name = $3,
                    phone_number = $4, email = $5, role = $6, department = $7,
                    start_date = $8, profile_image = $9
                WHERE id = $10
                RETURNING id
            `;
            
            const employeeValues = [
                employeeData.employeeNumber,
                employeeData.firstName,
                employeeData.lastName,
                employeeData.phoneNumber,
                employeeData.email,
                employeeData.role,
                employeeData.department,
                employeeData.startDate,
                employeeData.profileImage || null,
                id
            ];
            
            const result = await client.query(employeeQuery, employeeValues);
            
            if (result.rows.length === 0) {
                throw new Error('Employee not found');
            }
            
            // מחיקת כל ההסמכות הקיימות
            await client.query('DELETE FROM certifications WHERE employee_id = $1', [id]);
            
            // הוספת ההסמכות המעודכנות
            if (employeeData.certifications && employeeData.certifications.length > 0) {
                for (const cert of employeeData.certifications) {
                    await this.addCertification(client, id, cert);
                }
            }
            
            await client.query('COMMIT');
            
            // החזרת העובד המעודכן
            return await this.findById(id);
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * מחיקת עובד
     */
    static async delete(id) {
        const query = 'DELETE FROM employees WHERE id = $1 RETURNING id';
        const result = await db.query(query, [id]);
        return result.rows.length > 0;
    }

    /**
     * פונקציית עזר להוספת הסמכה
     */
    static async addCertification(client, employeeId, cert) {
        const certQuery = `
            INSERT INTO certifications (
                employee_id, name, issue_date, expiry_date, start_date,
                end_date, status, is_required, certificate, certificate_file_name
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id
        `;
        
        const certValues = [
            employeeId,
            cert.name,
            cert.issueDate,
            cert.expiryDate,
            cert.startDate || null,
            cert.endDate || null,
            cert.status,
            cert.isRequired || false,
            cert.certificate || null,
            cert.certificateFileName || null
        ];
        
        const certResult = await client.query(certQuery, certValues);
        const certId = certResult.rows[0].id;
        
        // הוספת OJT1 אם קיים
        if (cert.ojt1 && cert.ojt1.mentor && cert.ojt1.date) {
            await client.query(
                'INSERT INTO ojt_records (certification_id, ojt_number, mentor, date) VALUES ($1, $2, $3, $4)',
                [certId, 1, cert.ojt1.mentor, cert.ojt1.date]
            );
        }
        
        // הוספת OJT2 אם קיים
        if (cert.ojt2 && cert.ojt2.mentor && cert.ojt2.date) {
            await client.query(
                'INSERT INTO ojt_records (certification_id, ojt_number, mentor, date) VALUES ($1, $2, $3, $4)',
                [certId, 2, cert.ojt2.mentor, cert.ojt2.date]
            );
        }
        
        return certId;
    }

    /**
     * פורמט עובד לפורמט הצפוי בפרונטאנד
     */
    static formatEmployee(row) {
        return {
            _id: row.id,
            employeeNumber: row.employee_number,
            firstName: row.first_name,
            lastName: row.last_name,
            phoneNumber: row.phone_number,
            email: row.email,
            role: row.role,
            department: row.department,
            startDate: row.start_date,
            profileImage: row.profile_image,
            certifications: row.certifications || [],
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}

module.exports = EmployeeModel;

