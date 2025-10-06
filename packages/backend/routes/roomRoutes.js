const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

// POST /api/rooms - Crear una nueva sala
router.post('/', roomController.createRoom);

// GET /api/rooms - Obtener todas las salas
router.get('/', roomController.getRooms);

// GET /api/rooms/:roomCode - Obtener una sala específica
router.get('/:roomCode', roomController.getRoom);

// POST /api/rooms/:roomCode/join - Unirse a una sala
router.post('/:roomCode/join', roomController.joinRoom);

// POST /api/rooms/:roomCode/leave - Salir de una sala
router.post('/:roomCode/leave', roomController.leaveRoom);

// DELETE /api/rooms/:roomCode - Eliminar una sala (solo creador)
router.delete('/:roomCode', roomController.deleteRoom);

module.exports = router;