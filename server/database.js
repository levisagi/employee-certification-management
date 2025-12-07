const { Pool } = require('pg');
require('dotenv').config();

// יצירת connection pool ל-PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    max: 20, // מקסימום חיבורים
    idleTimeoutMillis: 30000, // 30 שניות
    connectionTimeoutMillis: 10000, // 10 שניות timeout לחיבור
});

// בדיקת חיבור
pool.on('connect', () => {
    console.log('✓ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    // לא לצאת מהתהליך - רק לרשום את השגיאה
});

// פונקציה לביצוע שאילתות
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text, duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
};

// פונקציה לקבלת client מה-pool (לטרנזקציות)
const getClient = async () => {
    const client = await pool.connect();
    const query = client.query.bind(client);
    const release = client.release.bind(client);
    
    // הוספת timeout
    const timeout = setTimeout(() => {
        console.error('A client has been checked out for more than 5 seconds!');
    }, 5000);
    
    client.release = () => {
        clearTimeout(timeout);
        client.release();
    };
    
    return { query, release };
};

module.exports = {
    query,
    getClient,
    pool
};

