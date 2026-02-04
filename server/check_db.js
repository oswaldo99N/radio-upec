const Database = require('better-sqlite3');
const db = new Database('devices.db');

const devices = db.prepare('SELECT id, name, campus, building, floor FROM devices').all();
console.log('Current Devices in DB:', JSON.stringify(devices, null, 2));

const settings = db.prepare('SELECT * FROM settings').all();
console.log('Current Settings:', JSON.stringify(settings, null, 2));
