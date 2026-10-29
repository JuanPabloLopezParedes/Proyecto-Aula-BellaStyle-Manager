// Conexión a MySQL.
// Se usa un "pool": un grupo de conexiones que se reutilizan,
// así varias peticiones pueden consultar la base al mismo tiempo.
const mysql = require('mysql2');
const config = require('./config');

const pool = mysql.createPool({
    ...config.db,
    waitForConnections: true,
    connectionLimit: 10
});

// Cada conexión usa la hora de Colombia (UTC-5).
// Así las horas del chat salen bien aunque el servidor de la base
// esté en otra zona horaria (por ejemplo Aiven, que usa UTC).
pool.on('connection', (conexion) => {
    conexion.query("SET time_zone = '-05:00'");
});

// .promise() permite usar async/await en los modelos
module.exports = pool.promise();
