// Lista de rutas (endpoints) de la API.
// Cada ruta llama a una función de un controlador.
const express = require('express');
const router = express.Router();

const auth = require('../controllers/authController');
const citas = require('../controllers/citasController');
const catalogo = require('../controllers/catalogoController');
const gestion = require('../controllers/gestionController');
const chat = require('../controllers/chatController');

// Autenticación
router.post('/login', auth.login);
router.post('/register', auth.registrar);
router.post('/recuperar-password', auth.recuperarPassword);

// Citas
router.get('/citas', citas.listar);
router.post('/citas', citas.crear);
router.put('/citas/:id/estado', citas.cambiarEstado);
router.put('/citas/:id/reprogramar', citas.reprogramar);

// Servicios
router.get('/servicios', catalogo.servicios);
router.post('/servicios', gestion.crearServicio);
router.put('/servicios/:id', gestion.editarServicio);
router.put('/servicios/:id/estado', gestion.estadoServicio);

// Productos
router.get('/productos', catalogo.productos);
router.post('/productos', gestion.crearProducto);
router.put('/productos/:id', gestion.editarProducto);
router.put('/productos/:id/estado', gestion.estadoProducto);

// Estilistas
router.get('/estilistas', catalogo.estilistas);
router.get('/estilistas/usuario/:idUsuario', catalogo.estilistaPorUsuario);
router.put('/estilistas/:id/estado', gestion.estadoEstilista);
router.put('/estilistas/:id/servicios', gestion.serviciosEstilista);

// Clientas
router.get('/clientas', catalogo.clientas);
router.get('/clientas/usuario/:idUsuario', catalogo.clientaPorUsuario);
router.put('/clientas/:id', gestion.editarClienta);

// Chat de la página de inicio (visitante sin cuenta)
router.post('/chat', chat.iniciar);
router.get('/chat/:codigo', chat.verMensajes);
router.post('/chat/:codigo/mensajes', chat.enviarVisitante);

// Chat: pestaña Mensajes de la administradora
router.get('/conversaciones', chat.listar);
router.get('/conversaciones/:id/mensajes', chat.abrir);
router.post('/conversaciones/:id/responder', chat.responder);
router.put('/conversaciones/:id/estado', chat.cambiarEstado);

module.exports = router;
