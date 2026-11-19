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
DROP TABLE IF EXISTS horarios_estilista;
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
    puede_crear_admins BOOLEAN NOT NULL DEFAULT FALSE,
    creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Datos de las clientas. id_usuario la une con su cuenta
CREATE TABLE clientas (
    id_clienta    INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario    INT UNIQUE,
    nombres       VARCHAR(80) NOT NULL,
    apellidos     VARCHAR(80) NOT NULL,
    telefono      VARCHAR(30),
    email         VARCHAR(120),
    ficha_tecnica TEXT,
    creado_en     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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

-- Horarios semanales y días de descanso de cada estilista
-- dia_semana: 1 = Lunes, 2 = Martes, 3 = Miércoles, 4 = Jueves, 5 = Viernes, 6 = Sábado
CREATE TABLE horarios_estilista (
    id_estilista INT NOT NULL,
    dia_semana   TINYINT NOT NULL,
    trabaja      BOOLEAN NOT NULL DEFAULT TRUE,
    hora_inicio  TIME NOT NULL DEFAULT '08:00:00',
    hora_fin     TIME NOT NULL DEFAULT '19:00:00',
    PRIMARY KEY (id_estilista, dia_semana),
    CONSTRAINT fk_he_estilista FOREIGN KEY (id_estilista) REFERENCES estilistas(id_estilista) ON DELETE CASCADE
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
CREATE TABLE estilista_servicios (
    id_estilista INT NOT NULL,
    id_servicio  INT NOT NULL,
    PRIMARY KEY (id_estilista, id_servicio),
    CONSTRAINT fk_es_estilista FOREIGN KEY (id_estilista) REFERENCES estilistas(id_estilista) ON DELETE CASCADE,
    CONSTRAINT fk_es_servicio  FOREIGN KEY (id_servicio)  REFERENCES servicios(id_servicio)   ON DELETE CASCADE
);

-- Citas agendadas
CREATE TABLE citas (
    id_cita                 INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente              INT NOT NULL,
    id_estilista            INT NOT NULL,
    id_servicio             INT NOT NULL,
    fecha                   DATE NOT NULL,
    hora                    TIME NOT NULL,
    duracion_min            INT NOT NULL DEFAULT 60,
    precio                  DECIMAL(10,2) NOT NULL DEFAULT 0,
    producto_adicional      VARCHAR(120) DEFAULT NULL,
    precio_producto         DECIMAL(10,2) NOT NULL DEFAULT 0,
    estado                  ENUM('Pendiente','Confirmada','Finalizada','Cancelada') NOT NULL DEFAULT 'Pendiente',
    observaciones           TEXT,
    calificacion            TINYINT DEFAULT NULL,
    comentario_calificacion VARCHAR(300) DEFAULT NULL,
    creado_en               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_citas_cliente   FOREIGN KEY (id_cliente)   REFERENCES clientas(id_clienta),
    CONSTRAINT fk_citas_estilista FOREIGN KEY (id_estilista) REFERENCES estilistas(id_estilista),
    CONSTRAINT fk_citas_servicio  FOREIGN KEY (id_servicio)  REFERENCES servicios(id_servicio)
);

-- Chat de la página de inicio
CREATE TABLE conversaciones (
    id_conversacion INT AUTO_INCREMENT PRIMARY KEY,
    codigo          CHAR(32)     NOT NULL UNIQUE,
    nombre          VARCHAR(60)  NOT NULL,
    contacto        VARCHAR(120),
    estado          ENUM('Abierta','Cerrada') NOT NULL DEFAULT 'Abierta',
    creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mensajes de cada conversación
CREATE TABLE mensajes (
    id_mensaje      INT AUTO_INCREMENT PRIMARY KEY,
    id_conversacion INT NOT NULL,
    autor           ENUM('Visitante','Salon','Asistente') NOT NULL,
    texto           VARCHAR(500) NOT NULL,
    leido           BOOLEAN NOT NULL DEFAULT FALSE,
    creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mensajes_conversacion FOREIGN KEY (id_conversacion)
        REFERENCES conversaciones(id_conversacion) ON DELETE CASCADE
);

-- =====================================================================
-- DATOS DE PRUEBA (ENRIQUECIDOS)
-- =====================================================================

INSERT INTO usuarios (id_usuario, nombre, username, password, rol, foto) VALUES
(1,  'Marta Gómez',       'admin',     '$2a$10$7O3CX9v7kC.M0uWTje439.EQoFP/nNOfSQRGVmwIkL4e6WS.cDqSu', 'Administradora', 'img/login_admin.jpg'),
(2,  'Laura Estilista',   'estilista', '$2a$10$WmrWwFDrn6YvFrl0GkMTluTXGFTi7Mo1NTy1QuhTjDKtIptxfSeo2', 'Estilista',      'img/login_estilicista.webp'),
(3,  'Diana Martínez',    'diana',     '$2a$10$keW7X2fdPNp3lekvelDIJeqnaEtWHFNH3AsRn41qr1RlNMndqXtsO', 'Estilista',      'img/login_estilicista.webp'),
(4,  'Paula Ríos',        'paula',     '$2a$10$8QYcfgNx/jt2VrF1ECRwie2X6OfGjQHXLppFYJ3Pe9MkEG6UcPPQa', 'Estilista',      'img/login_estilicista.webp'),
(5,  'César Pestana',     'cliente',   '$2a$10$wPH.tKFjr54oM.IzJVbSHOUYpEJjgJ43.CAekjbRWF3IpVt3P6csa', 'Clienta',        'img/login_cliente.webp'),
(6,  'Camila Torres',     'camila',    '$2a$10$WmrWwFDrn6YvFrl0GkMTluTXGFTi7Mo1NTy1QuhTjDKtIptxfSeo2', 'Estilista',      'img/login_estilicista.webp'),
(7,  'Valeria Mendoza',   'valeria',   '$2a$10$WmrWwFDrn6YvFrl0GkMTluTXGFTi7Mo1NTy1QuhTjDKtIptxfSeo2', 'Estilista',      'img/login_estilicista.webp'),
(8,  'Andrés Morales',    'andres',    '$2a$10$WmrWwFDrn6YvFrl0GkMTluTXGFTi7Mo1NTy1QuhTjDKtIptxfSeo2', 'Estilista',      'img/login_estilicista.webp'),
(9,  'Carolina Herrera',  'carolina',  '$2a$10$wPH.tKFjr54oM.IzJVbSHOUYpEJjgJ43.CAekjbRWF3IpVt3P6csa', 'Clienta',        'img/login_cliente.webp'),
(10, 'Natalia Vega',      'natalia',   '$2a$10$wPH.tKFjr54oM.IzJVbSHOUYpEJjgJ43.CAekjbRWF3IpVt3P6csa', 'Clienta',        'img/login_cliente.webp'),
(11, 'Gabriela Castillo', 'gabriela',  '$2a$10$wPH.tKFjr54oM.IzJVbSHOUYpEJjgJ43.CAekjbRWF3IpVt3P6csa', 'Clienta',        'img/login_cliente.webp'),
(12, 'Sebastián Rojas',   'sebastian', '$2a$10$wPH.tKFjr54oM.IzJVbSHOUYpEJjgJ43.CAekjbRWF3IpVt3P6csa', 'Clienta',        'img/login_cliente.webp');

-- La administradora principal (superior) puede crear otras administradoras
UPDATE usuarios SET puede_crear_admins = TRUE WHERE username = 'admin';

INSERT INTO clientas (id_clienta, id_usuario, nombres, apellidos, telefono, email, ficha_tecnica) VALUES
(1, 5,    'César',     'Pestana',   '3001112233', 'cesar@correo.com',     'Cuero cabelludo normal. Prefiere degradado medio con tijera en la parte superior y loción refrescante sin alcohol.'),
(2, NULL, 'María',     'García',    '3014445566', 'maria@correo.com',     'Base natural castaño 5.0, fórmula habitual tinte 7.1 rubio cenizo con peróxido de 20 vol. Sensible al amoniaco.'),
(3, NULL, 'Sofía',     'Restrepo',  '3027778899', 'sofia@correo.com',     'Uñas naturales delgadas; se recomienda nivelación con Base Rubber antes de semipermanente.'),
(4, 9,    'Carolina',  'Herrera',   '3152223344', 'carolina@correo.com',  'Cabello largo ondulado con mechas Balayage tono miel. Usa tratamiento hidratante de argán cada mes.'),
(5, 10,   'Natalia',   'Vega',      '3168889900', 'natalia@correo.com',   'Hebras finas con tendencia al frizz; excelente resultado con Bótox Capilar orgánico sin formol.'),
(6, 11,   'Gabriela',  'Castillo',  '3185554433', 'gabriela@correo.com',  'Prefiere uñas acrílicas almendradas largo #2 y tonos pastel o francés clásico.'),
(7, 12,   'Sebastián', 'Rojas',     '3046667788', 'sebastian@correo.com', 'Corte ejecutivo y perfilado de barba con toalla caliente y aceite de almendras.'),
(8, NULL, 'Isabella',  'Navarro',   '3123339988', 'isabella@correo.com',  'Cabello rizado tipo 3B, requiere hidratación profunda antes de estilizado para eventos.'),
(9, NULL, 'Mariana',   'Ospina',    '3109991122', 'mariana@correo.com',   'Piel sensible en pies; usar exfoliación suave de menta en PediSpa.');

INSERT INTO estilistas (id_estilista, id_usuario, nombres, apellidos, especialidad) VALUES
(1, 2, 'Laura',   'Estilista', 'Colorimetría y Balayage'),
(2, 3, 'Diana',   'Martínez',  'Corte Visagista y Peinados'),
(3, 4, 'Paula',   'Ríos',      'Sistemas de Uñas y PediSpa'),
(4, 6, 'Camila',  'Torres',    'Recuperación Capilar y Alisados'),
(5, 7, 'Valeria', 'Mendoza',   'Maquillaje Social y Peinados de Gala'),
(6, 8, 'Andrés',  'Morales',   'Corte Masculino, Fade y Dama');

-- Horarios semanales por estilista (con días de descanso variados)
-- 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado
INSERT INTO horarios_estilista (id_estilista, dia_semana, trabaja, hora_inicio, hora_fin) VALUES
-- Laura Estilista: descansa los Miércoles
(1, 1, TRUE,  '08:00:00', '18:00:00'),
(1, 2, TRUE,  '08:00:00', '18:00:00'),
(1, 3, FALSE, '08:00:00', '18:00:00'),
(1, 4, TRUE,  '08:00:00', '19:00:00'),
(1, 5, TRUE,  '08:00:00', '19:00:00'),
(1, 6, TRUE,  '09:00:00', '19:00:00'),
-- Diana Martínez: descansa los Lunes
(2, 1, FALSE, '08:00:00', '18:00:00'),
(2, 2, TRUE,  '08:00:00', '18:00:00'),
(2, 3, TRUE,  '08:00:00', '18:00:00'),
(2, 4, TRUE,  '08:00:00', '18:00:00'),
(2, 5, TRUE,  '08:00:00', '19:00:00'),
(2, 6, TRUE,  '08:00:00', '19:00:00'),
-- Paula Ríos: descansa los Martes
(3, 1, TRUE,  '09:00:00', '19:00:00'),
(3, 2, FALSE, '09:00:00', '19:00:00'),
(3, 3, TRUE,  '09:00:00', '19:00:00'),
(3, 4, TRUE,  '09:00:00', '19:00:00'),
(3, 5, TRUE,  '08:00:00', '19:00:00'),
(3, 6, TRUE,  '08:00:00', '19:00:00'),
-- Camila Torres: descansa los Jueves
(4, 1, TRUE,  '08:00:00', '17:00:00'),
(4, 2, TRUE,  '08:00:00', '17:00:00'),
(4, 3, TRUE,  '08:00:00', '17:00:00'),
(4, 4, FALSE, '08:00:00', '17:00:00'),
(4, 5, TRUE,  '08:00:00', '19:00:00'),
(4, 6, TRUE,  '08:00:00', '19:00:00'),
-- Valeria Mendoza: trabaja Lunes a Sábado turno tarde-noche
(5, 1, FALSE, '10:00:00', '19:00:00'),
(5, 2, TRUE,  '10:00:00', '19:00:00'),
(5, 3, TRUE,  '10:00:00', '19:00:00'),
(5, 4, TRUE,  '10:00:00', '19:00:00'),
(5, 5, TRUE,  '09:00:00', '19:00:00'),
(5, 6, TRUE,  '08:00:00', '19:00:00'),
-- Andrés Morales: trabaja todos los días de Lunes a Sábado
(6, 1, TRUE,  '08:00:00', '18:00:00'),
(6, 2, TRUE,  '08:00:00', '18:00:00'),
(6, 3, TRUE,  '08:00:00', '18:00:00'),
(6, 4, TRUE,  '08:00:00', '19:00:00'),
(6, 5, TRUE,  '08:00:00', '19:00:00'),
(6, 6, TRUE,  '08:00:00', '19:00:00');

INSERT INTO servicios (id_servicio, nombre, precio, duracion_min) VALUES
(1, 'Corte de Cabello',     35000,  45),
(2, 'Tinte / Coloración',  120000, 120),
(3, 'Mechas / Balayage',   180000, 150),
(4, 'Peinado para Evento',  60000,  60),
(5, 'Manicure',             25000,  45),
(6, 'Pedicure',             30000,  60),
(7, 'Tratamiento Capilar',  55000,  60);

INSERT INTO productos (nombre, precio, stock) VALUES
('Shampoo Hidratante Argan',      28000, 20),
('Mascarilla Capilar Reparadora', 35000, 15),
('Esmalte Gel Premium',           12000, 40),
('Spray Fijador Extra Fuerte',    22000, 18),
('Óleo de Argán & Macadamia',     42000, 12),
('Protector Térmico Capilar',     31000, 8),
('Tonificante Matizador Violeta', 36000, 14),
('Crema Exfoliante PediSpa',      26000, 9),
('Kit Cuidado Post-Queratina',    75000, 6);

INSERT INTO estilista_servicios (id_estilista, id_servicio) VALUES
(1, 2), (1, 3), (1, 7),         -- Laura: tinte, mechas y tratamientos
(2, 1), (2, 4), (2, 7),         -- Diana: corte, peinado y tratamiento
(3, 5), (3, 6),                 -- Paula: manicure y pedicure
(4, 2), (4, 3), (4, 7),         -- Camila: tinte, mechas y tratamientos
(5, 1), (5, 4), (5, 5),         -- Valeria: corte, peinado y manicure
(6, 1), (6, 7);                 -- Andrés: corte (hombre/mujer) y tratamiento

INSERT INTO citas (id_cliente, id_estilista, id_servicio, fecha, hora, duracion_min, precio, producto_adicional, precio_producto, estado, observaciones, calificacion, comentario_calificacion) VALUES
(1, 2, 1, '2026-10-28', '10:00:00',  50,  40000, NULL,                         0,     'Finalizada', 'Especialidad elegida: Corte Bob / Long Bob (Lob) (Corte para Mujer)', 5, 'Excelente atención de Diana, el corte quedó perfecto.'),
(2, 1, 2, '2026-10-28', '14:00:00', 120, 148000, 'Shampoo Hidratante Argan',  28000, 'Finalizada', 'Especialidad elegida: Tinte Global (Tono Entero)', 5, 'El color quedó súper brillante y sin maltratar el cabello.'),
(4, 3, 5, '2026-10-29', '09:30:00', 120,  85000, NULL,                         0,     'Finalizada', 'Especialidad elegida: Uñas Acrílicas Esculpidas (Tipos de Uñas y Sistemas)', 5, 'Paula es muy detallista, me encantaron las uñas.'),
(5, 4, 7, '2026-10-29', '11:00:00', 105, 120000, NULL,                         0,     'Finalizada', 'Especialidad elegida: Bótox Capilar Antifrizz (Terapias Capilares)', 4, 'Muy buen resultado, me quitó todo el frizz.'),
(7, 6, 1, '2026-10-30', '16:00:00',  45,  32000, NULL,                         0,     'Finalizada', 'Especialidad elegida: Degradado / Fade (Corte para Hombre)', 5, 'Degradado impecable y muy puntual.'),
(6, 1, 3, '2026-10-30', '09:00:00', 150, 215000, 'Mascarilla Capilar Reparadora', 35000, 'Finalizada', 'Especialidad elegida: Balayage Hand-Painted (Técnicas de Diseño de Color)', 5, 'El mejor balayage que me han hecho en Cartagena.'),
(3, 3, 5, '2026-10-30', '15:00:00',  45,  25000, NULL,                         0,     'Cancelada',  'Cancelada por viaje de la clienta', NULL, NULL),
(1, 2, 4, '2026-11-03', '10:30:00',  60,  60000, NULL,                         0,     'Confirmada', 'Especialidad elegida: Ondas Glamour / Ondas al Agua (Estilos de Peinado)', NULL, NULL),
(4, 3, 6, '2026-11-03', '14:00:00',  80,  60000, NULL,                         0,     'Confirmada', 'Especialidad elegida: PediSpa Detox & Hidratación Profunda', NULL, NULL),
(5, 1, 3, '2026-11-04', '09:00:00', 135, 165000, NULL,                         0,     'Pendiente',  'Especialidad elegida: Morena Iluminada (Caramelo / Avellana)', NULL, NULL),
(6, 2, 1, '2026-11-04', '11:30:00',  45,  38000, NULL,                         0,     'Pendiente',  'Especialidad elegida: Corte en Capas Largas o Mariposa (Corte para Mujer)', NULL, NULL),
(7, 6, 1, '2026-11-05', '15:30:00',  55,  42000, NULL,                         0,     'Confirmada', 'Especialidad elegida: Corte + Perfilado y Arreglo de Barba (Corte para Hombre)', NULL, NULL),
(8, 5, 4, '2026-11-06', '16:00:00',  75,  85000, NULL,                         0,     'Pendiente',  'Especialidad elegida: Recogido Elegante (Novias, Grados y Gala)', NULL, NULL);

-- Conversaciones de ejemplo para la pestaña Mensajes del panel
INSERT INTO conversaciones (id_conversacion, codigo, nombre, contacto, estado) VALUES
(1, '0123456789abcdef0123456789abcdef', 'Valentina Ruiz',   '3105556677', 'Abierta'),
(2, 'fedcba9876543210fedcba9876543210', 'Daniela Pineda',   'daniela@correo.com', 'Abierta'),
(3, 'aabbccddeeff00112233445566778899', 'Jorge Castellanos','3004448899', 'Cerrada');

INSERT INTO mensajes (id_conversacion, autor, texto, leido) VALUES
(1, 'Asistente', '¡Hola, Valentina! Soy el asistente de BellaStyle. Puedo darte precios, horarios y explicarte cómo agendar.', TRUE),
(1, 'Visitante', 'Hola, ¿hacen peinados para quinceañera y maquillaje?', FALSE),
(1, 'Asistente', 'Gracias por escribirnos. Una asesora del salón te responderá por aquí en breve.', TRUE),
(2, 'Asistente', '¡Hola, Daniela! Soy el asistente de BellaStyle. ¿En qué podemos asesorarte hoy?', TRUE),
(2, 'Visitante', 'Buenas tardes, ¿qué valor tienen las uñas en Polygel y cuánto tardan?', FALSE),
(3, 'Asistente', '¡Hola, Jorge! Bienvenido a BellaStyle.', TRUE),
(3, 'Visitante', 'Hola, ¿realizan corte degradado y arreglo de barba para caballero?', TRUE),
(3, 'Salon',     '¡Hola Jorge! Sí claro, nuestro especialista Andrés realiza corte degradado + perfilado de barba con toalla tibia. Puedes agendar desde la página.', TRUE);
