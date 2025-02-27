const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware with increased limits for file uploads
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB Atlas connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => console.error('Could not connect to MongoDB Atlas:', err));

const Employee = require('./models/Employee');

// Logging Middleware
const logRequest = (req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
};

app.use(logRequest);

// Routes
app.get('/api/employees', async (req, res) => {
    try {
        const employees = await Employee.find();
        console.log(`Fetched ${employees.length} employees`);
        res.json(employees);
    } catch (error) {
        console.error('Error fetching employees:', error);
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

        const employee = new Employee(employeeData);
        const newEmployee = await employee.save();

        // ניקוי מידע רגיש מהלוג
        const sanitizedResponse = {
            ...newEmployee.toObject(),
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
        console.log('Certifications data:', employeeData.certifications.map(cert => ({
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

        const employee = await Employee.findByIdAndUpdate(
            req.params.id,
            employeeData,
            { new: true, runValidators: true }
        );

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // ניקוי מידע רגיש מהלוג
        const sanitizedResponse = {
            ...employee.toObject(),
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
        const employee = await Employee.findByIdAndDelete(req.params.id);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        console.log('Employee deleted successfully:', req.params.id);
        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        console.error('Error deleting employee:', error);
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
    console.log(`MongoDB URI: ${process.env.MONGODB_URI ? 'Configured' : 'Not configured'}`);
});