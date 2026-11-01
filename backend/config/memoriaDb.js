// Motor de base de datos en memoria (con los mismos datos de init_db.sql)
// Se activa automáticamente si MySQL no está conectado o tiene otra clave en el equipo,
// para que el servidor y todas las funciones del proyecto funcionen de inmediato sin bloqueos.

const datos = {
    usuarios: [
        { id_usuario: 1,  nombre: 'Marta Gómez',      username: 'admin',     password: '$2a$10$7O3CX9v7kC.M0uWTje439.EQoFP/nNOfSQRGVmwIkL4e6WS.cDqSu', rol: 'Administradora', foto: 'img/login_admin.jpg' },
        { id_usuario: 2,  nombre: 'Laura Estilista',  username: 'estilista', password: '$2a$10$WmrWwFDrn6YvFrl0GkMTluTXGFTi7Mo1NTy1QuhTjDKtIptxfSeo2', rol: 'Estilista',      foto: 'img/login_estilicista.webp' },
        { id_usuario: 3,  nombre: 'Diana Martínez',   username: 'diana',     password: '$2a$10$keW7X2fdPNp3lekvelDIJeqnaEtWHFNH3AsRn41qr1RlNMndqXtsO', rol: 'Estilista',      foto: 'img/login_estilicista.webp' },
        { id_usuario: 4,  nombre: 'Paula Ríos',       username: 'paula',     password: '$2a$10$8QYcfgNx/jt2VrF1ECRwie2X6OfGjQHXLppFYJ3Pe9MkEG6UcPPQa', rol: 'Estilista',      foto: 'img/login_estilicista.webp' },
        { id_usuario: 5,  nombre: 'César Pestana',    username: 'cliente',   password: '$2a$10$wPH.tKFjr54oM.IzJVbSHOUYpEJjgJ43.CAekjbRWF3IpVt3P6csa', rol: 'Clienta',        foto: 'img/login_cliente.webp' },
        { id_usuario: 6,  nombre: 'Camila Torres',    username: 'camila',    password: '$2a$10$WmrWwFDrn6YvFrl0GkMTluTXGFTi7Mo1NTy1QuhTjDKtIptxfSeo2', rol: 'Estilista',      foto: 'img/login_estilicista.webp' },
        { id_usuario: 7,  nombre: 'Valentina Herrera',username: 'valentina', password: '$2a$10$WmrWwFDrn6YvFrl0GkMTluTXGFTi7Mo1NTy1QuhTjDKtIptxfSeo2', rol: 'Estilista',      foto: 'img/login_estilicista.webp' },
        { id_usuario: 8,  nombre: 'Natalia Mendoza',  username: 'natalia',   password: '$2a$10$WmrWwFDrn6YvFrl0GkMTluTXGFTi7Mo1NTy1QuhTjDKtIptxfSeo2', rol: 'Estilista',      foto: 'img/login_estilicista.webp' },
        { id_usuario: 9,  nombre: 'Mariana López',    username: 'mariana',   password: '$2a$10$wPH.tKFjr54oM.IzJVbSHOUYpEJjgJ43.CAekjbRWF3IpVt3P6csa', rol: 'Clienta',        foto: 'img/login_cliente.webp' },
        { id_usuario: 10, nombre: 'Andrés Morales',   username: 'andres',    password: '$2a$10$wPH.tKFjr54oM.IzJVbSHOUYpEJjgJ43.CAekjbRWF3IpVt3P6csa', rol: 'Clienta',        foto: 'img/login_cliente.webp' },
        { id_usuario: 11, nombre: 'Isabela Vergara',  username: 'isabela',   password: '$2a$10$wPH.tKFjr54oM.IzJVbSHOUYpEJjgJ43.CAekjbRWF3IpVt3P6csa', rol: 'Clienta',        foto: 'img/login_cliente.webp' },
        { id_usuario: 12, nombre: 'Gabriela Pineda',  username: 'gabriela',  password: '$2a$10$wPH.tKFjr54oM.IzJVbSHOUYpEJjgJ43.CAekjbRWF3IpVt3P6csa', rol: 'Clienta',        foto: 'img/login_cliente.webp' }
    ],
    clientas: [
        { id_clienta: 1, id_usuario: 5,    nombres: 'César',     apellidos: 'Pestana',   telefono: '3001112233', email: 'cesar@correo.com' },
        { id_clienta: 2, id_usuario: null, nombres: 'María',     apellidos: 'García',    telefono: '3014445566', email: 'maria@correo.com' },
        { id_clienta: 3, id_usuario: null, nombres: 'Sofía',     apellidos: 'Restrepo',  telefono: '3027778899', email: 'sofia@correo.com' },
        { id_clienta: 4, id_usuario: 9,    nombres: 'Mariana',   apellidos: 'López',     telefono: '3102345678', email: 'mariana.lopez@correo.com' },
        { id_clienta: 5, id_usuario: 10,   nombres: 'Andrés',    apellidos: 'Morales',   telefono: '3158765432', email: 'andres.morales@correo.com' },
        { id_clienta: 6, id_usuario: 11,   nombres: 'Isabela',   apellidos: 'Vergara',   telefono: '3209988776', email: 'isabela.vergara@correo.com' },
        { id_clienta: 7, id_usuario: 12,   nombres: 'Gabriela',  apellidos: 'Pineda',    telefono: '3045566778', email: 'gabriela.pineda@correo.com' },
        { id_clienta: 8, id_usuario: null, nombres: 'Daniela',   apellidos: 'Castillo',  telefono: '3183344556', email: 'daniela.castillo@correo.com' },
        { id_clienta: 9, id_usuario: null, nombres: 'Sebastián', apellidos: 'Barrios',   telefono: '3126655443', email: 'sebastian.barrios@correo.com' }
    ],
    estilistas: [
        { id_estilista: 1, id_usuario: 2, nombres: 'Laura',     apellidos: 'Estilista', especialidad: 'Colorimetría, Balayage y Rubios',     estado: 'Activo' },
        { id_estilista: 2, id_usuario: 3, nombres: 'Diana',     apellidos: 'Martínez',  especialidad: 'Corte Dama/Caballero y Peinados',    estado: 'Activo' },
        { id_estilista: 3, id_usuario: 4, nombres: 'Paula',     apellidos: 'Ríos',      especialidad: 'Manicure Acrílico, Gel y Spa',        estado: 'Activo' },
        { id_estilista: 4, id_usuario: 6, nombres: 'Camila',    apellidos: 'Torres',    especialidad: 'Terapia Capilar, Keratina y Botox',   estado: 'Activo' },
        { id_estilista: 5, id_usuario: 7, nombres: 'Valentina', apellidos: 'Herrera',   especialidad: 'Novias, Quinceañeras y Maquillaje',   estado: 'Activo' },
        { id_estilista: 6, id_usuario: 8, nombres: 'Natalia',   apellidos: 'Mendoza',   especialidad: 'Nail Art, Pedicure Detox y Gel',      estado: 'Inactivo' }
    ],
    horarios_estilista: [
        // Laura Estilista (id 1): descansa los Miércoles (3)
        { id_estilista: 1, dia_semana: 1, trabaja: true,  hora_inicio: '08:00:00', hora_fin: '18:00:00' },
        { id_estilista: 1, dia_semana: 2, trabaja: true,  hora_inicio: '08:00:00', hora_fin: '18:00:00' },
        { id_estilista: 1, dia_semana: 3, trabaja: false, hora_inicio: '08:00:00', hora_fin: '18:00:00' },
        { id_estilista: 1, dia_semana: 4, trabaja: true,  hora_inicio: '09:00:00', hora_fin: '19:00:00' },
        { id_estilista: 1, dia_semana: 5, trabaja: true,  hora_inicio: '09:00:00', hora_fin: '19:00:00' },
        { id_estilista: 1, dia_semana: 6, trabaja: true,  hora_inicio: '08:00:00', hora_fin: '19:00:00' },

        // Diana Martínez (id 2): descansa los Lunes (1)
        { id_estilista: 2, dia_semana: 1, trabaja: false, hora_inicio: '08:00:00', hora_fin: '18:00:00' },
        { id_estilista: 2, dia_semana: 2, trabaja: true,  hora_inicio: '08:00:00', hora_fin: '18:00:00' },
        { id_estilista: 2, dia_semana: 3, trabaja: true,  hora_inicio: '08:00:00', hora_fin: '18:00:00' },
        { id_estilista: 2, dia_semana: 4, trabaja: true,  hora_inicio: '08:00:00', hora_fin: '18:00:00' },
        { id_estilista: 2, dia_semana: 5, trabaja: true,  hora_inicio: '08:00:00', hora_fin: '19:00:00' },
        { id_estilista: 2, dia_semana: 6, trabaja: true,  hora_inicio: '08:00:00', hora_fin: '19:00:00' },

        // Paula Ríos (id 3): descansa los Martes (2)
        { id_estilista: 3, dia_semana: 1, trabaja: true,  hora_inicio: '09:00:00', hora_fin: '19:00:00' },
        { id_estilista: 3, dia_semana: 2, trabaja: false, hora_inicio: '09:00:00', hora_fin: '19:00:00' },
        { id_estilista: 3, dia_semana: 3, trabaja: true,  hora_inicio: '09:00:00', hora_fin: '19:00:00' },
        { id_estilista: 3, dia_semana: 4, trabaja: true,  hora_inicio: '09:00:00', hora_fin: '19:00:00' },
        { id_estilista: 3, dia_semana: 5, trabaja: true,  hora_inicio: '08:00:00', hora_fin: '19:00:00' },
        { id_estilista: 3, dia_semana: 6, trabaja: true,  hora_inicio: '08:00:00', hora_fin: '19:00:00' },

        // Camila Torres (id 4): descansa los Jueves (4)
        { id_estilista: 4, dia_semana: 1, trabaja: true,  hora_inicio: '08:00:00', hora_fin: '17:00:00' },
        { id_estilista: 4, dia_semana: 2, trabaja: true,  hora_inicio: '08:00:00', hora_fin: '17:00:00' },
        { id_estilista: 4, dia_semana: 3, trabaja: true,  hora_inicio: '08:00:00', hora_fin: '17:00:00' },
        { id_estilista: 4, dia_semana: 4, trabaja: false, hora_inicio: '08:00:00', hora_fin: '17:00:00' },
        { id_estilista: 4, dia_semana: 5, trabaja: true,  hora_inicio: '08:00:00', hora_fin: '19:00:00' },
        { id_estilista: 4, dia_semana: 6, trabaja: true,  hora_inicio: '08:00:00', hora_fin: '19:00:00' },

        // Valentina Herrera (id 5): descansa Lunes (1) y Miércoles (3)
        { id_estilista: 5, dia_semana: 1, trabaja: false, hora_inicio: '09:00:00', hora_fin: '18:00:00' },
        { id_estilista: 5, dia_semana: 2, trabaja: true,  hora_inicio: '09:00:00', hora_fin: '18:00:00' },
        { id_estilista: 5, dia_semana: 3, trabaja: false, hora_inicio: '09:00:00', hora_fin: '18:00:00' },
        { id_estilista: 5, dia_semana: 4, trabaja: true,  hora_inicio: '09:00:00', hora_fin: '19:00:00' },
        { id_estilista: 5, dia_semana: 5, trabaja: true,  hora_inicio: '08:00:00', hora_fin: '19:00:00' },
        { id_estilista: 5, dia_semana: 6, trabaja: true,  hora_inicio: '08:00:00', hora_fin: '19:00:00' },

        // Natalia Mendoza (id 6): descansa Viernes (5)
        { id_estilista: 6, dia_semana: 1, trabaja: true,  hora_inicio: '08:00:00', hora_fin: '16:00:00' },
        { id_estilista: 6, dia_semana: 2, trabaja: true,  hora_inicio: '08:00:00', hora_fin: '16:00:00' },
        { id_estilista: 6, dia_semana: 3, trabaja: true,  hora_inicio: '08:00:00', hora_fin: '16:00:00' },
        { id_estilista: 6, dia_semana: 4, trabaja: true,  hora_inicio: '08:00:00', hora_fin: '16:00:00' },
        { id_estilista: 6, dia_semana: 5, trabaja: false, hora_inicio: '08:00:00', hora_fin: '16:00:00' },
        { id_estilista: 6, dia_semana: 6, trabaja: true,  hora_inicio: '09:00:00', hora_fin: '18:00:00' }
    ],
    servicios: [
        { id_servicio: 1, nombre: 'Corte de Cabello',    precio: 35000,  duracion_min: 45,  estado: 'Disponible' },
        { id_servicio: 2, nombre: 'Tinte / Coloración',  precio: 120000, duracion_min: 120, estado: 'Disponible' },
        { id_servicio: 3, nombre: 'Mechas / Balayage',   precio: 180000, duracion_min: 150, estado: 'Disponible' },
        { id_servicio: 4, nombre: 'Peinado para Evento', precio: 60000,  duracion_min: 60,  estado: 'Disponible' },
        { id_servicio: 5, nombre: 'Manicure',            precio: 25000,  duracion_min: 45,  estado: 'Disponible' },
        { id_servicio: 6, nombre: 'Pedicure',            precio: 30000,  duracion_min: 60,  estado: 'Disponible' },
        { id_servicio: 7, nombre: 'Tratamiento Capilar', precio: 55000,  duracion_min: 60,  estado: 'Disponible' }
    ],
    productos: [
        { id_producto: 1, nombre: 'Shampoo Hidratante Argán',     precio: 28000, stock: 20, estado: 'Activo' },
        { id_producto: 2, nombre: 'Mascarilla Capilar Nutritiva', precio: 35000, stock: 15, estado: 'Activo' },
        { id_producto: 3, nombre: 'Esmalte Gel Premium',          precio: 12000, stock: 40, estado: 'Activo' },
        { id_producto: 4, nombre: 'Spray Fijador Extra Fuerte',   precio: 22000, stock: 18, estado: 'Activo' },
        { id_producto: 5, nombre: 'Sérum Termoprotector Brillo',  precio: 42000, stock: 12, estado: 'Activo' },
        { id_producto: 6, nombre: 'Ampolla Reparadora Keratina',  precio: 18000, stock: 8,  estado: 'Activo' },
        { id_producto: 7, nombre: 'Aceite de Cutícula Almendras', precio: 15000, stock: 25, estado: 'Activo' },
        { id_producto: 8, nombre: 'Matizador Violeta Silver',     precio: 38000, stock: 6,  estado: 'Activo' },
        { id_producto: 9, nombre: 'Crema Exfoliante Podal Menta', precio: 29000, stock: 14, estado: 'Activo' }
    ],
    estilista_servicios: [
        { id_estilista: 1, id_servicio: 2 },
        { id_estilista: 1, id_servicio: 3 },
        { id_estilista: 1, id_servicio: 7 },
        { id_estilista: 2, id_servicio: 1 },
        { id_estilista: 2, id_servicio: 4 },
        { id_estilista: 2, id_servicio: 7 },
        { id_estilista: 3, id_servicio: 5 },
        { id_estilista: 3, id_servicio: 6 },
        { id_estilista: 4, id_servicio: 1 },
        { id_estilista: 4, id_servicio: 2 },
        { id_estilista: 4, id_servicio: 7 },
        { id_estilista: 5, id_servicio: 4 },
        { id_estilista: 5, id_servicio: 1 },
        { id_estilista: 5, id_servicio: 3 },
        { id_estilista: 6, id_servicio: 5 },
        { id_estilista: 6, id_servicio: 6 }
    ],
    citas: [
        { id_cita: 1,  id_cliente: 1, id_estilista: 2, id_servicio: 1, fecha: '2026-05-25', hora: '10:00:00', precio: 35000,  estado: 'Finalizada', observaciones: 'Especialidad elegida: Fade Clásico / Degradado (Corte para Hombre)' },
        { id_cita: 2,  id_cliente: 2, id_estilista: 1, id_servicio: 2, fecha: '2026-05-26', hora: '14:00:00', precio: 120000, estado: 'Finalizada', observaciones: 'Especialidad elegida: Tinte Completo Global (Coloración Tradicional)' },
        { id_cita: 3,  id_cliente: 3, id_estilista: 3, id_servicio: 5, fecha: '2026-05-27', hora: '09:00:00', precio: 25000,  estado: 'Cancelada',  observaciones: 'Canceló por viaje laboral' },
        { id_cita: 4,  id_cliente: 4, id_estilista: 1, id_servicio: 3, fecha: '2026-06-02', hora: '09:30:00', precio: 180000, estado: 'Finalizada', observaciones: 'Especialidad elegida: Balayage Francés (Técnicas de Iluminación)' },
        { id_cita: 5,  id_cliente: 5, id_estilista: 2, id_servicio: 1, fecha: '2026-06-03', hora: '11:00:00', precio: 35000,  estado: 'Finalizada', observaciones: 'Especialidad elegida: Corte Ejecutivo a Tijera (Corte para Hombre)' },
        { id_cita: 6,  id_cliente: 6, id_estilista: 4, id_servicio: 7, fecha: '2026-06-05', hora: '15:00:00', precio: 55000,  estado: 'Finalizada', observaciones: 'Especialidad elegida: Botox Capilar Rejuvenecedor (Alisado y Restauración)' },
        { id_cita: 7,  id_cliente: 7, id_estilista: 3, id_servicio: 6, fecha: '2026-06-06', hora: '10:30:00', precio: 30000,  estado: 'Finalizada', observaciones: 'Especialidad elegida: Pedicure Spa Detox (Cuidado y Bienestar de Pies)' },
        { id_cita: 8,  id_cliente: 1, id_estilista: 2, id_servicio: 1, fecha: '2026-11-04', hora: '10:00:00', precio: 35000,  estado: 'Confirmada', observaciones: 'Especialidad elegida: Corte + Perfilado de Barba (Corte para Hombre)' },
        { id_cita: 9,  id_cliente: 4, id_estilista: 5, id_servicio: 4, fecha: '2026-11-05', hora: '16:00:00', precio: 60000,  estado: 'Confirmada', observaciones: 'Especialidad elegida: Recogido de Gala / Novia (Eventos y Celebraciones)' },
        { id_cita: 10, id_cliente: 6, id_estilista: 3, id_servicio: 5, fecha: '2026-11-06', hora: '11:30:00', precio: 25000,  estado: 'Pendiente',  observaciones: 'Especialidad elegida: Uñas Acrílicas Esculpidas (Sistemas y Diseños de Uñas)' },
        { id_cita: 11, id_cliente: 7, id_estilista: 1, id_servicio: 3, fecha: '2026-11-07', hora: '09:00:00', precio: 180000, estado: 'Confirmada', observaciones: 'Especialidad elegida: Babylights Sutiles (Técnicas de Iluminación)' },
        { id_cita: 12, id_cliente: 8, id_estilista: 4, id_servicio: 7, fecha: '2026-11-07', hora: '14:30:00', precio: 55000,  estado: 'Pendiente',  observaciones: 'Especialidad elegida: Hidratación Profunda con Argán (Terapias Capilares)' },
        { id_cita: 13, id_cliente: 5, id_estilista: 2, id_servicio: 1, fecha: '2026-11-10', hora: '15:30:00', precio: 35000,  estado: 'Pendiente',  observaciones: 'Especialidad elegida: Pompadour / Texturizado Moderno (Corte para Hombre)' }
    ],
    conversaciones: [
        { id_conversacion: 1, codigo: '0123456789abcdef0123456789abcdef', nombre: 'Valentina Ruiz',   contacto: '3105556677',               estado: 'Abierta', actualizado_en: new Date() },
        { id_conversacion: 2, codigo: 'abcdef0123456789abcdef0123456789', nombre: 'Carolina Méndez',  contacto: 'carolina.m@correo.com',    estado: 'Abierta', actualizado_en: new Date() },
        { id_conversacion: 3, codigo: '99887766554433221100ffeeddccbbaa', nombre: 'Lucía Fernández',  contacto: '3019998877',               estado: 'Cerrada', actualizado_en: new Date() }
    ],
    mensajes: [
        { id_mensaje: 1, id_conversacion: 1, autor: 'Asistente', texto: '¡Hola, Valentina! Soy el asistente de BellaStyle. Puedo darte precios, horarios y explicarte cómo agendar. Si necesitas algo más, una asesora te responde por aquí.', leido: true,  hora: '09:10' },
        { id_mensaje: 2, id_conversacion: 1, autor: 'Visitante', texto: 'Hola, ¿hacen peinados para quinceañera y maquillaje el sábado temprano?', leido: false, hora: '09:12' },
        { id_mensaje: 3, id_conversacion: 1, autor: 'Asistente', texto: 'Gracias por escribirnos. Una asesora del salón te responderá por aquí en breve.', leido: true,  hora: '09:12' },
        { id_mensaje: 4, id_conversacion: 2, autor: 'Asistente', texto: '¡Hola, Carolina! Soy el asistente de BellaStyle.', leido: true, hora: '11:20' },
        { id_mensaje: 5, id_conversacion: 2, autor: 'Visitante', texto: 'Buenas tardes, ¿Diana Martínez atiende los martes para corte Bob y cepillado?', leido: false, hora: '11:22' },
        { id_mensaje: 6, id_conversacion: 3, autor: 'Asistente', texto: '¡Hola, Lucía! Soy el asistente de BellaStyle.', leido: true, hora: '16:00' },
        { id_mensaje: 7, id_conversacion: 3, autor: 'Visitante', texto: 'Hola, quería confirmar si tienen parqueadero cerca del salón.', leido: true, hora: '16:02' },
        { id_mensaje: 8, id_conversacion: 3, autor: 'Salon',     texto: '¡Hola Lucía! Sí, contamos con bahía de parqueo gratuita justo frente al salón para nuestras clientas.', leido: true, hora: '16:05' }
    ]
};

function horaActual() {
    const d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

function armarEstilistas(soloActivas = false, idUsuario = null) {
    let lista = datos.estilistas.slice();
    if (soloActivas) lista = lista.filter((e) => e.estado === 'Activo');
    if (idUsuario !== null) lista = lista.filter((e) => String(e.id_usuario) === String(idUsuario));
    return lista.map((e) => {
        const rel = datos.estilista_servicios.filter((es) => es.id_estilista === e.id_estilista);
        const srvs = rel.map((es) => datos.servicios.find((s) => s.id_servicio === es.id_servicio)).filter(Boolean);
        srvs.sort((a, b) => a.nombre.localeCompare(b.nombre));
        return {
            ...e,
            servicios: srvs.map((s) => s.nombre).join(', ') || null,
            ids_servicios: srvs.map((s) => s.id_servicio).join(',') || null
        };
    }).sort((a, b) => a.nombres.localeCompare(b.nombres));
}

function armarCitas(filtroFn = () => true) {
    return datos.citas
        .filter(filtroFn)
        .map((c) => {
            const cl = datos.clientas.find((x) => x.id_clienta === Number(c.id_cliente)) || { nombres: '', apellidos: '' };
            const es = datos.estilistas.find((x) => x.id_estilista === Number(c.id_estilista)) || { nombres: '', apellidos: '' };
            const sr = datos.servicios.find((x) => x.id_servicio === Number(c.id_servicio)) || { nombre: '' };
            return {
                id: c.id_cita,
                cliente: `${cl.nombres} ${cl.apellidos}`.trim(),
                estilista: `${es.nombres} ${es.apellidos}`.trim(),
                servicio: sr.nombre,
                precio: c.precio,
                fecha: String(c.fecha).slice(0, 10),
                hora: String(c.hora).slice(0, 5),
                estado: c.estado,
                observaciones: c.observaciones
            };
        })
        .sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));
}

async function query(sql, params = []) {
    const s = sql.replace(/\s+/g, ' ').trim();

    // Comprobaciones iniciales de app.js
    if (s === 'SELECT 1') return [[{ 1: 1 }]];
    if (s.startsWith('SHOW COLUMNS FROM citas')) return [[{ Field: 'precio' }]];
    if (s.startsWith('SHOW TABLES LIKE')) return [[{ Tables_in_db: 'mensajes' }]];
    if (s === 'SELECT password FROM usuarios LIMIT 1') return [[{ password: datos.usuarios[0].password }]];

    // USUARIOS
    if (s.startsWith('SELECT * FROM usuarios WHERE username = ?')) {
        return [datos.usuarios.filter((u) => u.username === params[0])];
    }
    if (s.startsWith('INSERT INTO usuarios')) {
        const id_usuario = datos.usuarios.length + 1;
        const [nombre, username, password, rol, foto] = params;
        datos.usuarios.push({ id_usuario, nombre, username, password, rol, foto });
        return [{ insertId: id_usuario, affectedRows: 1 }];
    }
    if (s.startsWith('UPDATE usuarios SET password = ? WHERE username = ?')) {
        const u = datos.usuarios.find((x) => x.username === params[1]);
        if (u) u.password = params[0];
        return [{ affectedRows: u ? 1 : 0 }];
    }

    // SERVICIOS
    if (s.startsWith("SELECT * FROM servicios WHERE estado = 'Disponible'")) {
        return [datos.servicios.filter((x) => x.estado === 'Disponible').slice().sort((a, b) => a.nombre.localeCompare(b.nombre))];
    }
    if (s.startsWith('SELECT * FROM servicios ORDER BY nombre')) {
        return [datos.servicios.slice().sort((a, b) => a.nombre.localeCompare(b.nombre))];
    }
    if (s.startsWith('SELECT * FROM servicios WHERE id_servicio = ?')) {
        return [datos.servicios.filter((x) => String(x.id_servicio) === String(params[0]))];
    }
    if (s.startsWith('INSERT INTO servicios')) {
        const id_servicio = datos.servicios.length + 1;
        datos.servicios.push({ id_servicio, nombre: params[0], precio: Number(params[1]), duracion_min: Number(params[2]), estado: 'Disponible' });
        return [{ insertId: id_servicio, affectedRows: 1 }];
    }
    if (s.startsWith('UPDATE servicios SET nombre = ?')) {
        const srv = datos.servicios.find((x) => String(x.id_servicio) === String(params[3]));
        if (srv) { srv.nombre = params[0]; srv.precio = Number(params[1]); srv.duracion_min = Number(params[2]); }
        return [{ affectedRows: srv ? 1 : 0 }];
    }
    if (s.startsWith('UPDATE servicios SET estado = ?')) {
        const srv = datos.servicios.find((x) => String(x.id_servicio) === String(params[1]));
        if (srv) srv.estado = params[0];
        return [{ affectedRows: srv ? 1 : 0 }];
    }

    // PRODUCTOS
    if (s.startsWith("SELECT * FROM productos WHERE estado = 'Activo'")) {
        return [datos.productos.filter((x) => x.estado === 'Activo').slice().sort((a, b) => a.nombre.localeCompare(b.nombre))];
    }
    if (s.startsWith('SELECT * FROM productos ORDER BY nombre')) {
        return [datos.productos.slice().sort((a, b) => a.nombre.localeCompare(b.nombre))];
    }
    if (s.startsWith('INSERT INTO productos')) {
        const id_producto = datos.productos.length + 1;
        datos.productos.push({ id_producto, nombre: params[0], precio: Number(params[1]), stock: Number(params[2]), estado: 'Activo' });
        return [{ insertId: id_producto, affectedRows: 1 }];
    }
    if (s.startsWith('UPDATE productos SET nombre = ?')) {
        const pr = datos.productos.find((x) => String(x.id_producto) === String(params[3]));
        if (pr) { pr.nombre = params[0]; pr.precio = Number(params[1]); pr.stock = Number(params[2]); }
        return [{ affectedRows: pr ? 1 : 0 }];
    }
    if (s.startsWith('UPDATE productos SET estado = ?')) {
        const pr = datos.productos.find((x) => String(x.id_producto) === String(params[1]));
        if (pr) pr.estado = params[0];
        return [{ affectedRows: pr ? 1 : 0 }];
    }

    // CLIENTAS
    if (s.startsWith('INSERT INTO clientas')) {
        const id_clienta = datos.clientas.length + 1;
        const [id_usuario, nombres, apellidos, telefono, email] = params;
        datos.clientas.push({ id_clienta, id_usuario, nombres, apellidos, telefono, email });
        return [{ insertId: id_clienta, affectedRows: 1 }];
    }
    if (s.startsWith('SELECT * FROM clientas WHERE id_usuario = ?')) {
        return [datos.clientas.filter((c) => String(c.id_usuario) === String(params[0]))];
    }
    if (s.startsWith('SELECT * FROM clientas ORDER BY nombres')) {
        return [datos.clientas.slice().sort((a, b) => a.nombres.localeCompare(b.nombres))];
    }
    if (s.startsWith('UPDATE clientas SET nombres = ?')) {
        const cl = datos.clientas.find((c) => String(c.id_clienta) === String(params[4]));
        if (cl) { cl.nombres = params[0]; cl.apellidos = params[1]; cl.telefono = params[2]; cl.email = params[3]; }
        return [{ affectedRows: cl ? 1 : 0 }];
    }

    // ESTILISTAS Y HORARIOS
    if (s.startsWith('INSERT INTO estilistas')) {
        const id_estilista = datos.estilistas.length + 1;
        const [id_usuario, nombres, apellidos, especialidad] = params;
        datos.estilistas.push({ id_estilista, id_usuario, nombres, apellidos, especialidad, estado: 'Activo' });
        return [{ insertId: id_estilista, affectedRows: 1 }];
    }
    if (s.startsWith('INSERT INTO estilista_servicios')) {
        datos.estilista_servicios.push({ id_estilista: Number(params[0]), id_servicio: Number(params[1]) });
        return [{ affectedRows: 1 }];
    }
    if (s.startsWith('DELETE FROM estilista_servicios WHERE id_estilista = ?')) {
        datos.estilista_servicios = datos.estilista_servicios.filter((es) => String(es.id_estilista) !== String(params[0]));
        return [{ affectedRows: 1 }];
    }
    if (s.includes('FROM horarios_estilista')) {
        if (s.includes('WHERE id_estilista = ? AND dia_semana = ?')) {
            const filas = datos.horarios_estilista
                .filter((h) => String(h.id_estilista) === String(params[0]) && Number(h.dia_semana) === Number(params[1]))
                .map((h) => ({
                    dia_semana: h.dia_semana,
                    trabaja: h.trabaja,
                    hora_inicio: String(h.hora_inicio).slice(0, 5),
                    hora_fin: String(h.hora_fin).slice(0, 5)
                }));
            return [filas];
        }
        if (s.includes('WHERE id_estilista = ?')) {
            const filas = datos.horarios_estilista
                .filter((h) => String(h.id_estilista) === String(params[0]))
                .sort((a, b) => a.dia_semana - b.dia_semana)
                .map((h) => ({
                    dia_semana: h.dia_semana,
                    trabaja: h.trabaja,
                    hora_inicio: String(h.hora_inicio).slice(0, 5),
                    hora_fin: String(h.hora_fin).slice(0, 5)
                }));
            return [filas];
        }
        const todos = datos.horarios_estilista
            .slice()
            .sort((a, b) => a.dia_semana - b.dia_semana)
            .map((h) => ({
                id_estilista: h.id_estilista,
                dia_semana: h.dia_semana,
                trabaja: h.trabaja,
                hora_inicio: String(h.hora_inicio).slice(0, 5),
                hora_fin: String(h.hora_fin).slice(0, 5)
            }));
        return [todos];
    }
    if (s.startsWith('DELETE FROM horarios_estilista WHERE id_estilista = ?')) {
        datos.horarios_estilista = datos.horarios_estilista.filter((h) => String(h.id_estilista) !== String(params[0]));
        return [{ affectedRows: 1 }];
    }
    if (s.startsWith('INSERT INTO horarios_estilista')) {
        const [id_estilista, dia_semana, trabaja, hora_inicio, hora_fin] = params;
        datos.horarios_estilista.push({
            id_estilista: Number(id_estilista),
            dia_semana: Number(dia_semana),
            trabaja: Boolean(trabaja),
            hora_inicio: String(hora_inicio),
            hora_fin: String(hora_fin)
        });
        return [{ affectedRows: 1 }];
    }
    if (s.includes('FROM estilistas e LEFT JOIN estilista_servicios')) {
        if (s.includes("WHERE e.estado = 'Activo'")) return [armarEstilistas(true, null)];
        if (s.includes('WHERE e.id_usuario = ?')) return [armarEstilistas(false, params[0])];
        return [armarEstilistas(false, null)];
    }
    if (s.includes('FROM estilistas e JOIN estilista_servicios es')) {
        const idServicio = Number(params[0]);
        const ids = datos.estilista_servicios.filter((es) => es.id_servicio === idServicio).map((es) => es.id_estilista);
        const res = datos.estilistas
            .filter((e) => e.estado === 'Activo' && ids.includes(e.id_estilista))
            .map((e) => ({ id_estilista: e.id_estilista, nombre: `${e.nombres} ${e.apellidos}` }));
        return [res];
    }
    if (s.startsWith('UPDATE estilistas SET estado = ?')) {
        const es = datos.estilistas.find((x) => String(x.id_estilista) === String(params[1]));
        if (es) es.estado = params[0];
        return [{ affectedRows: es ? 1 : 0 }];
    }
    if (s.startsWith('UPDATE estilistas SET especialidad = ?')) {
        const es = datos.estilistas.find((x) => String(x.id_estilista) === String(params[1]));
        if (es) es.especialidad = params[0];
        return [{ affectedRows: es ? 1 : 0 }];
    }

    // CITAS
    if (s.includes('FROM citas c JOIN clientas cl') && s.includes('ORDER BY c.fecha DESC')) {
        if (s.includes('WHERE e.id_usuario = ?')) {
            const est = datos.estilistas.find((e) => String(e.id_usuario) === String(params[0]));
            return [est ? armarCitas((c) => c.id_estilista === est.id_estilista) : []];
        }
        if (s.includes('WHERE cl.id_usuario = ?')) {
            const cli = datos.clientas.find((c) => String(c.id_usuario) === String(params[0]));
            return [cli ? armarCitas((c) => c.id_cliente === cli.id_clienta) : []];
        }
        return [armarCitas()];
    }
    if (s.includes('SELECT c.id_cita, c.id_cliente') && s.includes('WHERE c.id_cita = ?')) {
        const c = datos.citas.find((x) => String(x.id_cita) === String(params[0]));
        if (!c) return [[]];
        const cl = datos.clientas.find((x) => x.id_clienta === Number(c.id_cliente));
        const sr = datos.servicios.find((x) => x.id_servicio === Number(c.id_servicio));
        return [[{
            ...c,
            id_usuario_clienta: cl ? cl.id_usuario : null,
            duracion_min: sr ? sr.duracion_min : 60
        }]];
    }
    if (s.includes('WHERE c.id_estilista = ? AND c.fecha = ?')) {
        const [idEst, fecha, excluirId] = params;
        const filas = datos.citas
            .filter((c) => String(c.id_estilista) === String(idEst) && String(c.fecha).slice(0, 10) === String(fecha) && c.estado !== 'Cancelada' && String(c.id_cita) !== String(excluirId))
            .map((c) => {
                const sr = datos.servicios.find((x) => x.id_servicio === Number(c.id_servicio));
                return { hora: String(c.hora).slice(0, 5), duracion_min: sr ? sr.duracion_min : 60 };
            });
        return [filas];
    }
    if (s.includes('WHERE c.id_cliente = ? AND c.fecha = ?')) {
        const [idCli, fecha, excluirId] = params;
        const filas = datos.citas
            .filter((c) => String(c.id_cliente) === String(idCli) && String(c.fecha).slice(0, 10) === String(fecha) && c.estado !== 'Cancelada' && String(c.id_cita) !== String(excluirId))
            .map((c) => {
                const sr = datos.servicios.find((x) => x.id_servicio === Number(c.id_servicio));
                return { hora: String(c.hora).slice(0, 5), duracion_min: sr ? sr.duracion_min : 60 };
            });
        return [filas];
    }
    if (s.startsWith('INSERT INTO citas')) {
        const id_cita = datos.citas.length + 1;
        const [id_cliente, id_estilista, id_servicio, fecha, hora, precio, observaciones] = params;
        datos.citas.push({ id_cita, id_cliente: Number(id_cliente), id_estilista: Number(id_estilista), id_servicio: Number(id_servicio), fecha, hora, precio: Number(precio), observaciones, estado: 'Pendiente' });
        return [{ insertId: id_cita, affectedRows: 1 }];
    }
    if (s.startsWith('UPDATE citas SET estado = ? WHERE id_cita = ?')) {
        const c = datos.citas.find((x) => String(x.id_cita) === String(params[1]));
        if (c) c.estado = params[0];
        return [{ affectedRows: c ? 1 : 0 }];
    }
    if (s.startsWith("UPDATE citas SET fecha = ?, hora = ?, estado = 'Pendiente'")) {
        const c = datos.citas.find((x) => String(x.id_cita) === String(params[2]));
        if (c) { c.fecha = params[0]; c.hora = params[1]; c.estado = 'Pendiente'; }
        return [{ affectedRows: c ? 1 : 0 }];
    }

    // CHAT Y CONVERSACIONES
    if (s.startsWith('INSERT INTO conversaciones')) {
        const id_conversacion = datos.conversaciones.length + 1;
        datos.conversaciones.push({ id_conversacion, codigo: params[0], nombre: params[1], contacto: params[2], estado: 'Abierta', actualizado_en: new Date() });
        return [{ insertId: id_conversacion, affectedRows: 1 }];
    }
    if (s.startsWith('SELECT * FROM conversaciones WHERE codigo = ?')) {
        return [datos.conversaciones.filter((c) => c.codigo === params[0])];
    }
    if (s.startsWith('SELECT * FROM conversaciones WHERE id_conversacion = ?')) {
        return [datos.conversaciones.filter((c) => String(c.id_conversacion) === String(params[0]))];
    }
    if (s.includes('FROM conversaciones c ORDER BY c.actualizado_en DESC')) {
        const lista = datos.conversaciones.map((c) => {
            const msgs = datos.mensajes.filter((m) => m.id_conversacion === c.id_conversacion);
            const ultimo = msgs.length > 0 ? msgs[msgs.length - 1].texto : '';
            const sin_leer = msgs.filter((m) => m.autor === 'Visitante' && !m.leido).length;
            return { id: c.id_conversacion, nombre: c.nombre, contacto: c.contacto, estado: c.estado, actualizado_en: c.actualizado_en, ultimo, sin_leer };
        }).sort((a, b) => b.id - a.id);
        return [lista];
    }
    if (s.startsWith('UPDATE conversaciones SET estado = ? WHERE id_conversacion = ?')) {
        const c = datos.conversaciones.find((x) => String(x.id_conversacion) === String(params[1]));
        if (c) c.estado = params[0];
        return [{ affectedRows: c ? 1 : 0 }];
    }
    if (s.startsWith('INSERT INTO mensajes')) {
        const id_mensaje = datos.mensajes.length + 1;
        datos.mensajes.push({ id_mensaje, id_conversacion: Number(params[0]), autor: params[1], texto: params[2], leido: false, hora: horaActual() });
        return [{ insertId: id_mensaje, affectedRows: 1 }];
    }
    if (s.startsWith("UPDATE conversaciones SET estado = 'Abierta', actualizado_en = NOW()")) {
        const c = datos.conversaciones.find((x) => String(x.id_conversacion) === String(params[0]));
        if (c) { c.estado = 'Abierta'; c.actualizado_en = new Date(); }
        return [{ affectedRows: 1 }];
    }
    if (s.includes('FROM mensajes WHERE id_conversacion = ? AND id_mensaje > ?')) {
        const [idConv, desde] = params;
        const msgs = datos.mensajes
            .filter((m) => String(m.id_conversacion) === String(idConv) && m.id_mensaje > Number(desde))
            .map((m) => ({ id: m.id_mensaje, autor: m.autor, texto: m.texto, hora: m.hora }));
        return [msgs];
    }
    if (s.startsWith('UPDATE mensajes SET leido = TRUE')) {
        datos.mensajes.forEach((m) => {
            if (String(m.id_conversacion) === String(params[0]) && m.autor === 'Visitante') m.leido = true;
        });
        return [{ affectedRows: 1 }];
    }
    if (s.includes("SELECT COUNT(*) AS total FROM mensajes WHERE id_conversacion = ? AND autor = 'Salon'")) {
        const total = datos.mensajes.filter((m) => String(m.id_conversacion) === String(params[0]) && m.autor === 'Salon').length;
        return [[{ total }]];
    }
    if (s.includes("SELECT texto FROM mensajes WHERE id_conversacion = ? AND autor = 'Asistente'")) {
        const msgs = datos.mensajes.filter((m) => String(m.id_conversacion) === String(params[0]) && m.autor === 'Asistente');
        return [msgs.length > 0 ? [{ texto: msgs[msgs.length - 1].texto }] : []];
    }

    return [[]];
}

async function getConnection() {
    return {
        beginTransaction: async () => {},
        commit: async () => {},
        rollback: async () => {},
        release: () => {},
        query
    };
}

module.exports = { query, getConnection };
