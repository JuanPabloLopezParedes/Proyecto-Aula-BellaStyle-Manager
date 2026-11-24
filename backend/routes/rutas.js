// Lista de rutas (endpoints) de la API.
// Cada ruta llama a una función de un controlador.
const express = require('express');
const router = express.Router();

const auth = require('../controllers/authController');
const citas = require('../controllers/citasController');
const catalogo = require('../controllers/catalogoController');
const gestion = require('../controllers/gestionController');
const chat = require('../controllers/chatController');
const { protegerRuta } = require('../utils/token');

// Autenticación y gestión de jerarquía de Administradoras
router.post('/login', auth.login);
router.post('/register', auth.registrar);
router.post('/recuperar-password', auth.recuperarPassword);
router.get('/administradoras', protegerRuta(['Administradora']), auth.listarAdministradoras);
router.put('/administradoras/:id/permiso', protegerRuta(['Administradora']), auth.cambiarPermisoAdministradora);

// Citas, disponibilidad en tiempo real, correo de confirmación, chat de cita, pasarela de pago, foto de resultado y calificación
router.get('/resenas', citas.resenasPublicas);
router.get('/galeria-resultados', citas.galeriaResultadosPublicos);
router.get('/citas', protegerRuta(), citas.listar);
router.get('/citas/disponibilidad', citas.disponibilidad);
router.get('/citas/:id/correo', protegerRuta(), citas.verCorreoCita);
router.get('/citas/:id/mensajes', protegerRuta(), citas.mensajesDeCita);
router.post('/citas/:id/mensajes', protegerRuta(), citas.enviarMensajeCita);
router.post('/citas', protegerRuta(), citas.crear);
router.put('/citas/:id/pago', protegerRuta(), citas.registrarPagoCita);
router.put('/citas/:id/resultado', protegerRuta(['Administradora', 'Estilista']), citas.guardarResultadoCita);
router.put('/citas/:id/estado', protegerRuta(), citas.cambiarEstado);
router.put('/citas/:id/reprogramar', protegerRuta(), citas.reprogramar);
router.put('/citas/:id/calificar', protegerRuta(['Clienta', 'Administradora']), citas.calificar);

// Servicios
router.get('/servicios', catalogo.servicios);
router.post('/servicios', protegerRuta(['Administradora']), gestion.crearServicio);
router.put('/servicios/:id', protegerRuta(['Administradora']), gestion.editarServicio);
router.put('/servicios/:id/estado', protegerRuta(['Administradora']), gestion.estadoServicio);

// Productos
router.get('/productos', catalogo.productos);
router.post('/productos', protegerRuta(['Administradora']), gestion.crearProducto);
router.put('/productos/:id', protegerRuta(['Administradora']), gestion.editarProducto);
router.put('/productos/:id/estado', protegerRuta(['Administradora']), gestion.estadoProducto);

// Estilistas y horarios semanales
router.get('/estilistas', catalogo.estilistas);
router.get('/estilistas/usuario/:idUsuario', protegerRuta(), catalogo.estilistaPorUsuario);
router.get('/estilistas/:id/horario', catalogo.horarioDeEstilista);
router.put('/estilistas/:id/estado', protegerRuta(['Administradora']), gestion.estadoEstilista);
router.put('/estilistas/:id/servicios', protegerRuta(['Administradora', 'Estilista']), gestion.serviciosEstilista);
router.put('/estilistas/:id/horario', protegerRuta(['Administradora']), gestion.horarioEstilista);

// Clientas y ficha técnica capilar
router.get('/clientas', protegerRuta(['Administradora', 'Estilista']), catalogo.clientas);
router.get('/clientas/usuario/:idUsuario', protegerRuta(), catalogo.clientaPorUsuario);
router.put('/clientas/:id', protegerRuta(), gestion.editarClienta);
router.put('/clientas/:id/ficha', protegerRuta(['Administradora', 'Estilista']), gestion.fichaTecnicaClienta);

// Chat de la página de inicio (visitante sin cuenta)
router.post('/chat', chat.iniciar);
router.get('/chat/:codigo', chat.verMensajes);
router.post('/chat/:codigo/mensajes', chat.enviarVisitante);

// Chat: pestaña Mensajes de la administradora
router.get('/conversaciones', protegerRuta(['Administradora']), chat.listar);
router.get('/conversaciones/:id/mensajes', protegerRuta(['Administradora']), chat.abrir);
router.post('/conversaciones/:id/responder', protegerRuta(['Administradora']), chat.responder);
router.put('/conversaciones/:id/estado', protegerRuta(['Administradora']), chat.cambiarEstado);

module.exports = router;
