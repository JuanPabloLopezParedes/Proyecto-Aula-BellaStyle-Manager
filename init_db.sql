-- =====================================================================
-- BellaStyle Manager - Creación de la base de datos
-- Ejecutar en MySQL Workbench (rayo amarillo) o con:
--   mysql -u root -p < init_db.sql
-- OJO: borra las tablas si ya existen y vuelve a cargar los datos de prueba.
-- =====================================================================

SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS bellastylemanager
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE bellastylemanager;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS agenda;
DROP TABLE IF EXISTS mensajes;
DROP TABLE IF EXISTS conversaciones;
DROP TABLE IF EXISTS citas;
DROP TABLE IF EXISTS estilista_servicios;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS servicios;
DROP TABLE IF EXISTS estilistas;
DROP TABLE IF EXISTS clientas;
DROP TABLE IF EXISTS usuarios;
SET FOREIGN_KEY_CHECKS = 1;

-- Cuentas para iniciar sesión. La contraseña se guarda cifrada con bcrypt.
CREATE TABLE usuarios (
    id_usuario  INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    rol         ENUM('Administradora','Estilista','Clienta') NOT NULL DEFAULT 'Clienta',
    foto        VARCHAR(255),
    creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Datos de las clientas. id_usuario la une con su cuenta (puede ser NULL
-- si la clienta fue registrada en el salón y no tiene cuenta).
CREATE TABLE clientas (
    id_clienta  INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario  INT UNIQUE,
    nombres     VARCHAR(80) NOT NULL,
    apellidos   VARCHAR(80) NOT NULL,
    telefono    VARCHAR(30),
    email       VARCHAR(120),
    creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_clientas_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);

-- Datos de las estilistas, unidas a su cuenta por id_usuario
CREATE TABLE estilistas (
    id_estilista INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario   INT UNIQUE,
    nombres      VARCHAR(80) NOT NULL,
    apellidos    VARCHAR(80) NOT NULL,
    especialidad VARCHAR(80) DEFAULT 'General',
    estado       ENUM('Activo','Inactivo') NOT NULL DEFAULT 'Activo',
    creado_en    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_estilistas_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);

-- Catálogo de servicios del salón
CREATE TABLE servicios (
    id_servicio  INT AUTO_INCREMENT PRIMARY KEY,
    nombre       VARCHAR(100) NOT NULL,
    precio       DECIMAL(10,2) NOT NULL DEFAULT 0,
    duracion_min INT NOT NULL DEFAULT 60,
    estado       ENUM('Disponible','No disponible') NOT NULL DEFAULT 'Disponible'
);

-- Productos que vende o usa el salón
CREATE TABLE productos (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    precio      DECIMAL(10,2) NOT NULL DEFAULT 0,
    stock       INT NOT NULL DEFAULT 0,
    estado      ENUM('Activo','Inactivo') NOT NULL DEFAULT 'Activo'
);

-- Qué servicios sabe hacer cada estilista (relación muchos a muchos).
-- Es la base de la asignación automática de citas.
CREATE TABLE estilista_servicios (
    id_estilista INT NOT NULL,
    id_servicio  INT NOT NULL,
    PRIMARY KEY (id_estilista, id_servicio),
    CONSTRAINT fk_es_estilista FOREIGN KEY (id_estilista) REFERENCES estilistas(id_estilista) ON DELETE CASCADE,
    CONSTRAINT fk_es_servicio  FOREIGN KEY (id_servicio)  REFERENCES servicios(id_servicio)   ON DELETE CASCADE
);

-- Citas agendadas
CREATE TABLE citas (
    id_cita       INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente    INT NOT NULL,
    id_estilista  INT NOT NULL,
    id_servicio   INT NOT NULL,
    fecha         DATE NOT NULL,
    hora          TIME NOT NULL,
    precio        DECIMAL(10,2) NOT NULL DEFAULT 0,   -- precio del servicio el día que se agendó
    estado        ENUM('Pendiente','Confirmada','Finalizada','Cancelada') NOT NULL DEFAULT 'Pendiente',
    observaciones TEXT,
    creado_en     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_citas_cliente   FOREIGN KEY (id_cliente)   REFERENCES clientas(id_clienta),
    CONSTRAINT fk_citas_estilista FOREIGN KEY (id_estilista) REFERENCES estilistas(id_estilista),
    CONSTRAINT fk_citas_servicio  FOREIGN KEY (id_servicio)  REFERENCES servicios(id_servicio)
);

-- Chat de la página de inicio. Un visitante escribe sin tener cuenta.
-- El "codigo" es un texto aleatorio que se guarda en su navegador y sirve
-- para reconocer su conversación cuando vuelve a la página.
CREATE TABLE conversaciones (
    id_conversacion INT AUTO_INCREMENT PRIMARY KEY,
    codigo          CHAR(32)     NOT NULL UNIQUE,
    nombre          VARCHAR(60)  NOT NULL,
    contacto        VARCHAR(120),               -- teléfono o correo (opcional)
    estado          ENUM('Abierta','Cerrada') NOT NULL DEFAULT 'Abierta',
    creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP   -- hora del último mensaje
);

-- Mensajes de cada conversación.
-- autor: Visitante (quien escribe en la página), Salon (la administradora)
-- o Asistente (respuestas automáticas del sistema).
CREATE TABLE mensajes (
    id_mensaje      INT AUTO_INCREMENT PRIMARY KEY,
    id_conversacion INT NOT NULL,
    autor           ENUM('Visitante','Salon','Asistente') NOT NULL,
    texto           VARCHAR(500) NOT NULL,
    leido           BOOLEAN NOT NULL DEFAULT FALSE,   -- la administradora ya lo vio
    creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mensajes_conversacion FOREIGN KEY (id_conversacion)
        REFERENCES conversaciones(id_conversacion) ON DELETE CASCADE
);

-- =====================================================================
-- DATOS DE PRUEBA
-- Contraseñas: admin123, est123, diana123, paula123, cli123
-- =====================================================================

INSERT INTO usuarios (id_usuario, nombre, username, password, rol, foto) VALUES
(1, 'Marta Gómez',     'admin',     '$2a$10$7O3CX9v7kC.M0uWTje439.EQoFP/nNOfSQRGVmwIkL4e6WS.cDqSu', 'Administradora', 'img/login_admin.jpg'),
(2, 'Laura Estilista', 'estilista', '$2a$10$WmrWwFDrn6YvFrl0GkMTluTXGFTi7Mo1NTy1QuhTjDKtIptxfSeo2', 'Estilista',      'img/login_estilicista.webp'),
(3, 'Diana Martínez',  'diana',     '$2a$10$keW7X2fdPNp3lekvelDIJeqnaEtWHFNH3AsRn41qr1RlNMndqXtsO', 'Estilista',      'img/login_estilicista.webp'),
(4, 'Paula Ríos',      'paula',     '$2a$10$8QYcfgNx/jt2VrF1ECRwie2X6OfGjQHXLppFYJ3Pe9MkEG6UcPPQa', 'Estilista',      'img/login_estilicista.webp'),
(5, 'César Pestana',   'cliente',   '$2a$10$wPH.tKFjr54oM.IzJVbSHOUYpEJjgJ43.CAekjbRWF3IpVt3P6csa', 'Clienta',        'img/login_cliente.webp');

INSERT INTO clientas (id_clienta, id_usuario, nombres, apellidos, telefono, email) VALUES
(1, 5,    'César', 'Pestana',  '3001112233', 'cesar@correo.com'),
(2, NULL, 'María', 'García',   '3014445566', 'maria@correo.com'),
(3, NULL, 'Sofía', 'Restrepo', '3027778899', 'sofia@correo.com');

INSERT INTO estilistas (id_estilista, id_usuario, nombres, apellidos, especialidad) VALUES
(1, 2, 'Laura', 'Estilista', 'Color y mechas'),
(2, 3, 'Diana', 'Martínez',  'Corte y peinado'),
(3, 4, 'Paula', 'Ríos',      'Manicure y spa');

INSERT INTO servicios (id_servicio, nombre, precio, duracion_min) VALUES
(1, 'Corte de Cabello',     35000,  45),
(2, 'Tinte / Coloración',  120000, 120),
(3, 'Mechas / Balayage',   180000, 150),
(4, 'Peinado para Evento',  60000,  60),
(5, 'Manicure',             25000,  45),
(6, 'Pedicure',             30000,  60),
(7, 'Tratamiento Capilar',  55000,  60);

INSERT INTO productos (nombre, precio, stock) VALUES
('Shampoo Hidratante', 28000, 20),
('Mascarilla Capilar', 35000, 15),
('Esmalte Premium',    12000, 40),
('Spray Fijador',      22000, 18);

INSERT INTO estilista_servicios (id_estilista, id_servicio) VALUES
(1, 2), (1, 3),          -- Laura: tinte y mechas
(2, 1), (2, 4), (2, 7),  -- Diana: corte, peinado y tratamiento
(3, 5), (3, 6);          -- Paula: manicure y pedicure

INSERT INTO citas (id_cliente, id_estilista, id_servicio, fecha, hora, precio, estado, observaciones) VALUES
(1, 2, 1, '2026-05-25', '10:00:00',  35000, 'Finalizada', 'Cita de ejemplo'),
(2, 1, 2, '2026-05-26', '14:00:00', 120000, 'Finalizada', NULL),
(3, 3, 5, '2026-05-27', '09:00:00',  25000, 'Cancelada',  NULL);

-- Conversación de ejemplo para ver la pestaña Mensajes del panel
INSERT INTO conversaciones (id_conversacion, codigo, nombre, contacto) VALUES
(1, '0123456789abcdef0123456789abcdef', 'Valentina Ruiz', '3105556677');

INSERT INTO mensajes (id_conversacion, autor, texto, leido) VALUES
(1, 'Asistente', '¡Hola, Valentina! Soy el asistente de BellaStyle. Puedo darte precios, horarios y explicarte cómo agendar. Si necesitas algo más, una asesora te responde por aquí.', TRUE),
(1, 'Visitante', 'Hola, ¿hacen peinados para quinceañera a domicilio?', FALSE),
(1, 'Asistente', 'Gracias por escribirnos. Una asesora del salón te responderá por aquí en breve.', TRUE);
