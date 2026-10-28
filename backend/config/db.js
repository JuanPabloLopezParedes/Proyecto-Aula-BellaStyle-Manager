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

// .promise() permite usar async/await en los modelos
module.exports = pool.promise();
