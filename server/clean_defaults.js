const Database = require('better-sqlite3');

const db = new Database('devices.db');

console.log('Limpiando valores por defecto de la base de datos...');

// Limpiar los valores por defecto antiguos
const updates = [
    db.prepare("UPDATE devices SET campus = '' WHERE campus = 'Campus Principal'"),
    db.prepare("UPDATE devices SET building = '' WHERE building = 'Edificio A'"),
    db.prepare("UPDATE devices SET floor = '' WHERE floor = 'Piso 1'")
];

updates.forEach((stmt, i) => {
    const result = stmt.run();
    if (result.changes > 0) {
        console.log(`✓ Actualizado ${result.changes} dispositivos`);
    }
});

// Limpiar settings (opciones por defecto)
db.prepare("UPDATE settings SET value = '[]' WHERE key = 'campuses'").run();
db.prepare("UPDATE settings SET value = '[]' WHERE key = 'buildings'").run();
db.prepare("UPDATE settings SET value = '[]' WHERE key = 'floors'").run();

console.log('✓ Settings limpiados');
console.log('¡Listo! Base de datos limpia.');

db.close();
