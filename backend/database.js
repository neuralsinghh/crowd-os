const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../crowdos.db');
const db = new Database(dbPath);

console.info('[Database] 🔗 Connected to SQLite database.');

// Ensure table exists (synchronous execute)
db.exec(`
    CREATE TABLE IF NOT EXISTS crowd_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        gate_a_people INTEGER,
        gate_b_people INTEGER,
        gate_c_people INTEGER,
        gate_d_people INTEGER
    )
`);

module.exports = db;
