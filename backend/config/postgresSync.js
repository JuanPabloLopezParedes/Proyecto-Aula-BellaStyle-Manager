// Sincronizador automático con PostgreSQL en Render (process.env.DATABASE_URL).
// 1. Si DATABASE_URL está configurada en Render (o en variables de entorno):
//    - Crea automáticamente las tablas relacionales en PostgreSQL (usuarios, clientas, estilistas,
//      servicios, productos, citas, compras_productos y bellastyle_estado_cloud)
//    - Carga el estado persistido en PostgreSQL al iniciar o antes de lecturas en caliente
//    - Guarda cada cambio (compras, descuento de stock, citas, calificaciones, nuevos usuarios) en PostgreSQL en tiempo real.

let PoolPg = null;
try {
    PoolPg = require('pg').Pool;
} catch (_) {
    PoolPg = null;
}

let poolPg = null;
let pgInicializado = false;
let ultimaSincronizacionLectura = 0;

function obtenerPoolPg() {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url || !PoolPg) return null;
    if (!poolPg) {
        const esLocal = url.includes('localhost') || url.includes('127.0.0.1');
        poolPg = new PoolPg({
            connectionString: url,
            ssl: esLocal ? false : { rejectUnauthorized: false },
            max: 6,
            idleTimeoutMillis: 30000,
        });
    }
    return poolPg;
}

async function asegurarEsquemaPostgres(pool, datosMemoria) {
    if (pgInicializado) return;
    await pool.query(`
        CREATE TABLE IF NOT EXISTS bellastyle_estado_cloud (
            id INT PRIMARY KEY,
            payload JSONB NOT NULL,
            actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS usuarios (
            id_usuario INT PRIMARY KEY,
            nombre VARCHAR(120) NOT NULL,
            username VARCHAR(60) UNIQUE NOT NULL,
            rol VARCHAR(40) NOT NULL,
            puede_crear_admins BOOLEAN NOT NULL DEFAULT FALSE
        );
        CREATE TABLE IF NOT EXISTS servicios (
            id_servicio INT PRIMARY KEY,
            nombre VARCHAR(120) NOT NULL,
            precio NUMERIC(12,2) NOT NULL,
            duracion_min INT NOT NULL,
            estado VARCHAR(40) NOT NULL
        );
        CREATE TABLE IF NOT EXISTS productos (
            id_producto INT PRIMARY KEY,
            nombre VARCHAR(140) NOT NULL,
            precio NUMERIC(12,2) NOT NULL,
            stock INT NOT NULL,
            estado VARCHAR(40) NOT NULL
        );
        CREATE TABLE IF NOT EXISTS citas (
            id_cita INT PRIMARY KEY,
            id_cliente INT NOT NULL,
            id_estilista INT NOT NULL,
            id_servicio INT NOT NULL,
            fecha VARCHAR(20) NOT NULL,
            hora VARCHAR(15) NOT NULL,
            precio NUMERIC(12,2) NOT NULL,
            estado VARCHAR(40) NOT NULL,
            calificacion INT DEFAULT NULL,
            comentario_calificacion TEXT DEFAULT NULL
        );
        CREATE TABLE IF NOT EXISTS compras_productos (
            id_compra INT PRIMARY KEY,
            id_usuario INT DEFAULT NULL,
            cliente_nombre VARCHAR(120) NOT NULL,
            id_producto INT NOT NULL,
            producto_nombre VARCHAR(140) NOT NULL,
            cantidad INT NOT NULL,
            total NUMERIC(12,2) NOT NULL,
            metodo_pago VARCHAR(60) NOT NULL,
            fecha VARCHAR(20) NOT NULL,
            calificacion INT DEFAULT NULL,
            comentario_calificacion TEXT DEFAULT NULL
        );
    `);

    const { rows } = await pool.query('SELECT payload FROM bellastyle_estado_cloud WHERE id = 1');
    if (rows.length > 0 && rows[0].payload) {
        aplicarPayloadEnMemoria(rows[0].payload, datosMemoria);
        console.log('✓ Conectado a PostgreSQL en Render: datos cargados desde la nube.');
    } else {
        await guardarEnPostgres(datosMemoria, true);
        console.log('✓ Conectado a PostgreSQL en Render: tablas inicializadas con el catálogo de BellaStyle.');
    }
    pgInicializado = true;
    ultimaSincronizacionLectura = Date.now();
}

function aplicarPayloadEnMemoria(guardado, datosMemoria) {
    if (!guardado || typeof guardado !== 'object') return;
    for (const clave of Object.keys(datosMemoria)) {
        if (Array.isArray(guardado[clave]) && guardado[clave].length > 0) {
            datosMemoria[clave] = guardado[clave];
        }
    }
}

async function sincronizarDesdePostgres(datosMemoria) {
    const pool = obtenerPoolPg();
    if (!pool) return false;
    try {
        if (!pgInicializado) {
            await asegurarEsquemaPostgres(pool, datosMemoria);
            return true;
        }
        // Refrescar estado desde PostgreSQL máximo cada 1.5s para mantener tiempo real entre instancias
        if (Date.now() - ultimaSincronizacionLectura < 1500) return true;
        const { rows } = await pool.query('SELECT payload FROM bellastyle_estado_cloud WHERE id = 1');
        if (rows.length > 0 && rows[0].payload) {
            aplicarPayloadEnMemoria(rows[0].payload, datosMemoria);
        }
        ultimaSincronizacionLectura = Date.now();
        return true;
    } catch (err) {
        console.warn('Aviso PostgreSQL (lectura):', err.message);
        return false;
    }
}

async function guardarEnPostgres(datosMemoria, OmitirInit = false) {
    const pool = obtenerPoolPg();
    if (!pool) return false;
    try {
        if (!pgInicializado && !OmitirInit) {
            await asegurarEsquemaPostgres(pool, datosMemoria);
        }
        await pool.query(
            `INSERT INTO bellastyle_estado_cloud (id, payload, actualizado_en)
             VALUES (1, $1::jsonb, NOW())
             ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, actualizado_en = NOW()`,
            [JSON.stringify(datosMemoria)]
        );
        ultimaSincronizacionLectura = Date.now();

        // Sincronizar también las tablas relacionales de PostgreSQL en segundo plano para consultas SQL directas en DBeaver/pgAdmin
        sincronizarTablasRelacionalesPg(pool, datosMemoria).catch(() => {});
        return true;
    } catch (err) {
        console.warn('Aviso PostgreSQL (escritura):', err.message);
        return false;
    }
}

async function sincronizarTablasRelacionalesPg(pool, datos) {
    for (const u of datos.usuarios || []) {
        await pool.query(
            `INSERT INTO usuarios (id_usuario, nombre, username, rol, puede_crear_admins)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id_usuario) DO UPDATE SET nombre = EXCLUDED.nombre, rol = EXCLUDED.rol, puede_crear_admins = EXCLUDED.puede_crear_admins`,
            [u.id_usuario, u.nombre, u.username, u.rol, Boolean(u.puede_crear_admins)]
        );
    }
    for (const p of datos.productos || []) {
        await pool.query(
            `INSERT INTO productos (id_producto, nombre, precio, stock, estado)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id_producto) DO UPDATE SET nombre = EXCLUDED.nombre, precio = EXCLUDED.precio, stock = EXCLUDED.stock, estado = EXCLUDED.estado`,
            [p.id_producto, p.nombre, Number(p.precio || 0), Number(p.stock || 0), p.estado || 'Disponible']
        );
    }
    for (const s of datos.servicios || []) {
        await pool.query(
            `INSERT INTO servicios (id_servicio, nombre, precio, duracion_min, estado)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id_servicio) DO UPDATE SET nombre = EXCLUDED.nombre, precio = EXCLUDED.precio, duracion_min = EXCLUDED.duracion_min, estado = EXCLUDED.estado`,
            [s.id_servicio, s.nombre, Number(s.precio || 0), Number(s.duracion_min || 60), s.estado || 'Disponible']
        );
    }
    for (const c of datos.citas || []) {
        await pool.query(
            `INSERT INTO citas (id_cita, id_cliente, id_estilista, id_servicio, fecha, hora, precio, estado, calificacion, comentario_calificacion)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (id_cita) DO UPDATE SET fecha = EXCLUDED.fecha, hora = EXCLUDED.hora, estado = EXCLUDED.estado, calificacion = EXCLUDED.calificacion, comentario_calificacion = EXCLUDED.comentario_calificacion`,
            [c.id_cita, c.id_cliente, c.id_estilista, c.id_servicio, String(c.fecha).slice(0, 10), String(c.hora).slice(0, 8), Number(c.precio || 0), c.estado, c.calificacion ?? null, c.comentario_calificacion ?? null]
        );
    }
    for (const cp of datos.compras_productos || []) {
        await pool.query(
            `INSERT INTO compras_productos (id_compra, id_usuario, cliente_nombre, id_producto, producto_nombre, cantidad, total, metodo_pago, fecha, calificacion, comentario_calificacion)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             ON CONFLICT (id_compra) DO UPDATE SET calificacion = EXCLUDED.calificacion, comentario_calificacion = EXCLUDED.comentario_calificacion`,
            [cp.id_compra, cp.id_usuario ?? null, cp.cliente_nombre, cp.id_producto, cp.producto_nombre, Number(cp.cantidad || 1), Number(cp.total || 0), cp.metodo_pago, cp.fecha, cp.calificacion ?? null, cp.comentario_calificacion ?? null]
        );
    }
}

module.exports = {
    tienePostgresConfigurado: () => Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL),
    sincronizarDesdePostgres,
    guardarEnPostgres,
};
