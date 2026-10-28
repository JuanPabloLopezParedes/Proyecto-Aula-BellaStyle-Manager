// Configuración general del sistema.
// Cada valor se lee primero de una VARIABLE DE ENTORNO (process.env).
// Así, en la nube (Render) o en Docker se configuran sin tocar el código.
// Si la variable no existe, se usa el valor por defecto (el de tu PC).

module.exports = {
    // Render y Docker indican el puerto en la variable PORT
    puerto: Number(process.env.PORT) || 3000,

    db: {
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '1234',
        database: process.env.DB_NAME || 'bellastylemanager',
        // Las bases de datos en la nube exigen conexión cifrada (SSL).
        // En tu PC no se usa: DB_SSL no existe.
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
    },

    // Código que se pide para registrar una cuenta de administradora.
    // Solo lo conoce la dueña del salón.
    codigoAdmin: process.env.CODIGO_ADMIN || 'BELLA2026'
};
