const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware with increased limits for file uploads
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// PostgreSQL connection
const db = require('./database');
const EmployeeModel = require('./models/EmployeeModel');

// בדיקת חיבור למסד הנתונים
db.query('SELECT NOW()')
    .then(() => console.log('✓ Database connection successful'))
    .catch(err => console.error('✗ Database connection failed:', err));

// Logging Middleware
const logRequest = (req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
};

app.use(logRequest);

// Routes
app.get('/api/employees', async (req, res) => {
    try {
        const employees = await EmployeeModel.findAll();
        console.log(`Fetched ${employees.length} employees`);
        res.json(employees);
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ message: error.message });
    }
});

// קבלת עובד בודד לפי מזהה
app.get('/api/employees/:id', async (req, res) => {
    try {
        const employee = await EmployeeModel.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.json(employee);
    } catch (error) {
        console.error('Error fetching employee:', error);
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/employees', async (req, res) => {
    try {
        const employeeData = req.body;
        
        // בדיקת גודל הקבצים
        if (employeeData.profileImage && employeeData.profileImage.length > 5000000) {
            throw new Error('Profile image size exceeds 5MB limit');
        }

        // בדיקת קבצי תעודות
        if (employeeData.certifications) {
            employeeData.certifications.forEach(cert => {
                if (cert.certificate && cert.certificate.length > 5000000) {
                    throw new Error(`Certificate file for ${cert.name} exceeds 5MB limit`);
                }
            });
        }

        console.log('Creating employee:', {
            ...employeeData,
            profileImage: employeeData.profileImage ? 'Image data present' : 'No image',
            certifications: employeeData.certifications?.map(cert => ({
                ...cert,
                isRequired: cert.isRequired || false,
                certificate: cert.certificate ? 'Certificate data present' : 'No certificate'
            }))
        });

        const newEmployee = await EmployeeModel.create(employeeData);

        // ניקוי מידע רגיש מהלוג
        const sanitizedResponse = {
            ...newEmployee,
            profileImage: newEmployee.profileImage ? 'Image data present' : 'No image',
            certifications: newEmployee.certifications?.map(cert => ({
                ...cert,
                certificate: cert.certificate ? 'Certificate data present' : 'No certificate'
            }))
        };
        console.log('Employee created successfully:', sanitizedResponse);

        res.status(201).json(newEmployee);
    } catch (error) {
        console.error('Error creating employee:', error);
        res.status(400).json({ message: error.message });
    }
});

app.put('/api/employees/:id', async (req, res) => {
    try {
        const employeeData = req.body;
        
        // בדיקת גודל הקבצים
        if (employeeData.profileImage && employeeData.profileImage.length > 5000000) {
            throw new Error('Profile image size exceeds 5MB limit');
        }

        // בדיקת קבצי תעודות
        if (employeeData.certifications) {
            employeeData.certifications.forEach(cert => {
                if (cert.certificate && cert.certificate.length > 5000000) {
                    throw new Error(`Certificate file for ${cert.name} exceeds 5MB limit`);
                }
            });
        }

        // לוג לבדיקת ההסמכות
        console.log('Certifications data:', employeeData.certifications?.map(cert => ({
            name: cert.name,
            isRequired: cert.isRequired
        })));

        console.log('Updating employee:', {
            id: req.params.id,
            ...employeeData,
            profileImage: employeeData.profileImage ? 'Image data present' : 'No image',
            certifications: employeeData.certifications?.map(cert => ({
                ...cert,
                isRequired: cert.isRequired || false,
                certificate: cert.certificate ? 'Certificate data present' : 'No certificate'
            }))
        });

        const employee = await EmployeeModel.update(req.params.id, employeeData);

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // ניקוי מידע רגיש מהלוג
        const sanitizedResponse = {
            ...employee,
            profileImage: employee.profileImage ? 'Image data present' : 'No image',
            certifications: employee.certifications?.map(cert => ({
                ...cert,
                certificate: cert.certificate ? 'Certificate data present' : 'No certificate'
            }))
        };
        console.log('Employee updated successfully:', sanitizedResponse);

        res.json(employee);
    } catch (error) {
        console.error('Error updating employee:', error);
        res.status(400).json({ message: error.message });
    }
});

app.delete('/api/employees/:id', async (req, res) => {
    try {
        console.log('Deleting employee:', req.params.id);
        const deleted = await EmployeeModel.delete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        console.log('Employee deleted successfully:', req.params.id);
        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({ message: error.message });
    }
});

// API להעתקת הסמכות בין עובדים
app.post('/api/employees/copy-certifications', async (req, res) => {
    try {
        const { sourceEmployeeId, targetEmployeeIds, certificationIds } = req.body;
        
        // בדיקת הפרמטרים
        if (!Array.isArray(targetEmployeeIds)) {
            return res.status(400).json({ message: 'targetEmployeeIds must be an array' });
        }
        
        // מציאת העובד המקור אם הועבר מזהה מקור
        let sourceEmployee = null;
        let certificationsToClone = [];
        
        if (sourceEmployeeId) {
            sourceEmployee = await EmployeeModel.findById(sourceEmployeeId);
            if (!sourceEmployee) {
                return res.status(404).json({ message: 'Source employee not found' });
            }
            
            // סינון ההסמכות שנבחרו או כל ההסמכות אם לא הועברה רשימה ספציפית
            if (Array.isArray(certificationIds) && certificationIds.length > 0) {
                certificationsToClone = sourceEmployee.certifications.filter(cert => 
                    certificationIds.includes(cert._id.toString())
                );
            } else {
                certificationsToClone = sourceEmployee.certifications;
            }
        } else if (req.body.certifications) {
            // אם לא הועבר מזהה מקור אבל הועברו הסמכות ישירות
            certificationsToClone = req.body.certifications;
        } else {
            return res.status(400).json({ message: 'Either sourceEmployeeId or certifications must be provided' });
        }
        
        if (certificationsToClone.length === 0) {
            return res.status(404).json({ message: 'No certifications found to copy' });
        }
        
        // העתקת ההסמכות לכל עובד מטרה
        let updateCount = 0;
        const client = await db.getClient();
        
        try {
            await client.query('BEGIN');
            
            for (const targetId of targetEmployeeIds) {
                // דילוג אם העובד המטרה הוא גם המקור
                if (sourceEmployeeId && targetId === sourceEmployeeId) continue;
                
                // מצא את העובד המטרה
                const targetEmployee = await EmployeeModel.findById(targetId);
                if (!targetEmployee) continue;
                
                // הכנת ההסמכות להעתקה
                const certsToAdd = certificationsToClone.map(cert => {
                    const { _id, ...certData } = cert;
                    return certData;
                });
                
                // עדכון העובד המטרה:
                // 1. מיזוג ההסמכות - החלפת הסמכות בעלות שמות זהים
                const updatedCerts = [...targetEmployee.certifications];
                
                for (const newCert of certsToAdd) {
                    const existingIndex = updatedCerts.findIndex(c => c.name === newCert.name);
                    if (existingIndex >= 0) {
                        // החלפת הסמכה קיימת
                        updatedCerts[existingIndex] = newCert;
                    } else {
                        // הוספת הסמכה חדשה
                        updatedCerts.push(newCert);
                    }
                }
                
                // עדכון העובד המטרה
                targetEmployee.certifications = updatedCerts;
                await EmployeeModel.update(targetId, targetEmployee);
                updateCount++;
            }
            
            await client.query('COMMIT');
            
            res.json({
                success: true,
                message: `Certifications copied successfully to ${updateCount} employees`,
                copiedCertificationsCount: certificationsToClone.length,
                updatedEmployeesCount: updateCount
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error copying certifications:', error);
        res.status(500).json({ message: error.message });
    }
});

// API Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running', timestamp: new Date() });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Database: PostgreSQL (Supabase)`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
