const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// POST /api/users - Registrar un nuevo usuario
router.post('/', userController.registerUser);

// GET /api/users - Obtener todos los usuarios
router.get('/', userController.getUsers);

// GET /api/users/check/:username - Verificar si un usuario existe
router.get('/check/:username', userController.checkUser);

// DELETE /api/users/:username - Eliminar un usuario
router.delete('/:username', userController.deleteUser);

module.exports = router;