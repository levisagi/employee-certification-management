// Production server that runs both backend and frontend in the same process
const express = require('express');
const path = require('path');
const cors = require('cors');

const PORT = process.env.PORT || 8080;

console.log('🚀 Starting production server...');
console.log(`📍 Port: ${PORT}`);
console.log(`🗄️ Environment: ${process.env.NODE_ENV || 'production'}`);

// Create main Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Import and setup backend routes
console.log('Loading backend API routes...');
const db = require('./server/database');
const EmployeeModel = require('./server/models/EmployeeModel');
const EquipmentModel = require('./server/models/EquipmentModel');

// Test database connection
db.query('SELECT NOW()')
    .then(() => console.log('✓ Database connection successful'))
    .catch(err => console.error('✗ Database connection failed:', err));

// Logging Middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// ============ API ROUTES (Backend) ============

// Employee routes
app.get('/api/employees', async (req, res) => {
    try {
        const employees = await EmployeeModel.findAll();
        res.json(employees);
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ message: 'Error fetching employees', error: error.message });
    }
});

app.post('/api/employees', async (req, res) => {
    try {
        const newEmployee = await EmployeeModel.create(req.body);
        res.status(201).json(newEmployee);
    } catch (error) {
        console.error('Error creating employee:', error);
        res.status(500).json({ message: 'Error creating employee', error: error.message });
    }
});

app.put('/api/employees/:id', async (req, res) => {
    try {
        const updatedEmployee = await EmployeeModel.update(req.params.id, req.body);
        if (!updatedEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.json(updatedEmployee);
    } catch (error) {
        console.error('Error updating employee:', error);
        res.status(500).json({ message: 'Error updating employee', error: error.message });
    }
});

app.delete('/api/employees/:id', async (req, res) => {
    try {
        await EmployeeModel.delete(req.params.id);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({ message: 'Error deleting employee', error: error.message });
    }
});

app.post('/api/employees/search', async (req, res) => {
    try {
        const { query } = req.body;
        const employees = await EmployeeModel.search(query);
        res.json(employees);
    } catch (error) {
        console.error('Error searching employees:', error);
        res.status(500).json({ message: 'Error searching employees', error: error.message });
    }
});

app.put('/api/employees/display-order', async (req, res) => {
    try {
        const { updates } = req.body;
        await EmployeeModel.updateDisplayOrder(updates);
        res.json({ message: 'Display order updated successfully' });
    } catch (error) {
        console.error('Error updating display order:', error);
        res.status(500).json({ message: 'Error updating display order', error: error.message });
    }
});

// Equipment routes
app.get('/api/equipment', async (req, res) => {
    try {
        const equipment = await EquipmentModel.getAll();
        res.json(equipment);
    } catch (error) {
        console.error('Error fetching equipment:', error);
        res.status(500).json({ message: 'Error fetching equipment', error: error.message });
    }
});

app.post('/api/equipment', async (req, res) => {
    try {
        const newEquipment = await EquipmentModel.create(req.body);
        res.status(201).json(newEquipment);
    } catch (error) {
        console.error('Error creating equipment:', error);
        res.status(500).json({ message: 'Error creating equipment', error: error.message });
    }
});

app.put('/api/equipment/:id', async (req, res) => {
    try {
        const updatedEquipment = await EquipmentModel.update(req.params.id, req.body);
        if (!updatedEquipment) {
            return res.status(404).json({ message: 'Equipment not found' });
        }
        res.json(updatedEquipment);
    } catch (error) {
        console.error('Error updating equipment:', error);
        res.status(500).json({ message: 'Error updating equipment', error: error.message });
    }
});

app.delete('/api/equipment/:id', async (req, res) => {
    try {
        await EquipmentModel.delete(req.params.id);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting equipment:', error);
        res.status(500).json({ message: 'Error deleting equipment', error: error.message });
    }
});

app.post('/api/equipment/search', async (req, res) => {
    try {
        const { query } = req.body;
        const equipment = await EquipmentModel.search(query);
        res.json(equipment);
    } catch (error) {
        console.error('Error searching equipment:', error);
        res.status(500).json({ message: 'Error searching equipment', error: error.message });
    }
});

// ============ FRONTEND (Static Files) ============

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'build')));

// All other routes serve React app (must be last)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌐 Frontend: http://localhost:${PORT}`);
    console.log(`🔌 API: http://localhost:${PORT}/api`);
    console.log(`📦 Database: PostgreSQL (Supabase)`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    process.exit(0);
});

