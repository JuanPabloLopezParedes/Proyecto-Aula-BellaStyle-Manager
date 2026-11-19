// Conexión a MySQL con respaldo automático en memoria.
// Si MySQL está activo y las credenciales coinciden, usa MySQL real;
// si no, activa automáticamente la base de datos en memoria precargada con init_db.sql.
const mysql = require('mysql2');
const config = require('./config');
const memoria = require('./memoriaDb');

const pool = mysql.createPool({
    ...config.db,
    waitForConnections: true,
    connectionLimit: 10
}).promise();

let usarMemoria = false;

async function verificarModo() {
    if (usarMemoria) return true;
    try {
        await pool.query('SELECT 1');
        return false;
    } catch (_) {
        usarMemoria = true;
        console.log('Aviso: usando base de datos local en memoria precargada con los datos de BellaStyle.');
        return true;
    }
}

module.exports = {
    async query(sql, params) {
        if (await verificarModo()) {
            return memoria.query(sql, params);
        }
        return pool.query(sql, params);
    },
    async getConnection() {
        if (await verificarModo()) {
            return memoria.getConnection();
        }
        return pool.getConnection();
    }
};
