import { Employee, Certification } from '../models/employee';

const API_URL = 'http://localhost:5001/api';

export const fetchEmployees = async (): Promise<Employee[]> => {
    const response = await fetch(`${API_URL}/employees`);
    if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        throw new Error(errorData.message || 'Failed to fetch employees');
    }
    return response.json();
};

export const createEmployee = async (employee: Employee): Promise<Employee> => {
    const response = await fetch(`${API_URL}/employees`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...employee,
            certifications: employee.certifications.map(cert => ({
                ...cert,
                isRequired: cert.isRequired || false,
                startDate: cert.startDate ? new Date(cert.startDate) : undefined,
                endDate: cert.endDate ? new Date(cert.endDate) : undefined,
                ojt1: cert.ojt1 ? {
                    ...cert.ojt1,
                    date: new Date(cert.ojt1.date)
                } : undefined,
                ojt2: cert.ojt2 ? {
                    ...cert.ojt2,
                    date: new Date(cert.ojt2.date)
                } : undefined
            }))
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        throw new Error(errorData.message || 'Failed to create employee');
    }

    return response.json();
};

export const updateEmployee = async (id: string, employee: Employee): Promise<Employee> => {
    console.log('Sending update request:', employee);
    console.log('Certifications being sent:', employee.certifications.map(cert => ({
        name: cert.name,
        isRequired: cert.isRequired,
        startDate: cert.startDate,
        endDate: cert.endDate
    })));

    const response = await fetch(`${API_URL}/employees/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...employee,
            certifications: employee.certifications.map(cert => ({
                ...cert,
                isRequired: cert.isRequired || false,
                startDate: cert.startDate ? new Date(cert.startDate) : undefined,
                endDate: cert.endDate ? new Date(cert.endDate) : undefined,
                ojt1: cert.ojt1 ? {
                    ...cert.ojt1,
                    date: new Date(cert.ojt1.date)
                } : undefined,
                ojt2: cert.ojt2 ? {
                    ...cert.ojt2,
                    date: new Date(cert.ojt2.date)
                } : undefined
            }))
        }),
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        throw new Error(errorData.message || 'Failed to update employee');
    }
    
    const updatedEmployee = await response.json();
    console.log('Updated employee response:', updatedEmployee);
    return updatedEmployee;
};

export const deleteEmployee = async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/employees/${id}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        throw new Error(errorData.message || 'Failed to delete employee');
    }
};

/**
 * העתקת הסמכות ממקור לעובדים אחרים
 * @param certifications - רשימת ההסמכות להעתקה
 * @param targetEmployeeIds - מזהי העובדים שיקבלו את ההסמכות
 */
export const copyCertifications = async (
    certifications: Certification[],
    targetEmployeeIds: string[]
): Promise<void> => {
    try {
        // שליפת כל העובדים שנבחרו
        const targetEmployees: Employee[] = [];
        
        for (const empId of targetEmployeeIds) {
            const response = await fetch(`${API_URL}/employees/${empId}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch employee with ID ${empId}`);
            }
            const employee = await response.json();
            targetEmployees.push(employee);
        }
        
        // הכנת ההסמכות להעתקה (הסרת ID כדי ליצור רשומות חדשות)
        const certsToClone = certifications.map(cert => {
            // שכפול עמוק של ההסמכה
            const certCopy = JSON.parse(JSON.stringify(cert));
            
            // הסרת המזהה המקורי כדי שיווצר מזהה חדש בשרת
            delete certCopy._id;
            
            // עיבוד תאריכים לפורמט נכון
            if (certCopy.startDate) {
                certCopy.startDate = new Date(certCopy.startDate);
            }
            if (certCopy.endDate) {
                certCopy.endDate = new Date(certCopy.endDate);
            }
            if (certCopy.issueDate) {
                certCopy.issueDate = new Date(certCopy.issueDate);
            }
            if (certCopy.expiryDate) {
                certCopy.expiryDate = new Date(certCopy.expiryDate);
            }
            if (certCopy.ojt1 && certCopy.ojt1.date) {
                certCopy.ojt1.date = new Date(certCopy.ojt1.date);
            }
            if (certCopy.ojt2 && certCopy.ojt2.date) {
                certCopy.ojt2.date = new Date(certCopy.ojt2.date);
            }
            
            // החזרת ההסמכה המשוכפלת
            return certCopy;
        });
        
        // עדכון כל אחד מהעובדים בנפרד
        for (const employee of targetEmployees) {
            // מיזוג ההסמכות הקיימות עם ההסמכות החדשות
            const employeeCerts = employee.certifications || [];
            
            // איחוד - מחליף הסמכות קיימות עם שמות זהים
            const updatedCerts = [...employeeCerts];
            
            for (const newCert of certsToClone) {
                // בדיקה אם כבר קיימת הסמכה עם אותו שם
                const existingIndex = updatedCerts.findIndex(cert => cert.name === newCert.name);
                
                if (existingIndex >= 0) {
                    // החלפת ההסמכה הקיימת בחדשה
                    updatedCerts[existingIndex] = newCert;
                } else {
                    // הוספת הסמכה חדשה
                    updatedCerts.push(newCert);
                }
            }
            
            // עדכון העובד עם ההסמכות החדשות
            const updatedEmployee = {
                ...employee,
                certifications: updatedCerts
            };
            
            // שמירת השינויים
            await updateEmployee(employee._id!, updatedEmployee);
        }
    } catch (error) {
        console.error('Error copying certifications:', error);
        throw error;
    }
};