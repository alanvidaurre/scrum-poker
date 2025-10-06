// Simulación de base de datos en memoria para usuarios
const users = new Map();

// Registrar un nuevo usuario
const registerUser = (req, res) => {
  try {
    const { username } = req.body;

    // Validaciones
    if (!username) {
      return res.status(400).json({
        error: 'El nombre de usuario es requerido'
      });
    }

    if (username.trim().length < 2) {
      return res.status(400).json({
        error: 'El nombre de usuario debe tener al menos 2 caracteres'
      });
    }

    if (username.trim().length > 20) {
      return res.status(400).json({
        error: 'El nombre de usuario no puede tener más de 20 caracteres'
      });
    }

    // Verificar si el usuario ya existe
    if (users.has(username.trim())) {
      return res.status(409).json({
        error: 'El nombre de usuario ya está en uso'
      });
    }

    // Generar un ID único para el usuario
    const userId = Date.now() + Math.random().toString(36).substr(2, 9);
    
    // Crear el objeto usuario
    const user = {
      id: userId,
      username: username.trim(),
      createdAt: new Date().toISOString()
    };

    // Guardar el usuario
    users.set(username.trim(), user);

    // Responder con éxito
    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: {
        id: user.id,
        username: user.username
      }
    });

  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

// Obtener todos los usuarios registrados
const getUsers = (req, res) => {
  try {
    const userList = Array.from(users.values()).map(user => ({
      id: user.id,
      username: user.username
    }));

    res.status(200).json({
      users: userList,
      count: userList.length
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

// Verificar si un usuario existe
const checkUser = (req, res) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({
        error: 'Nombre de usuario requerido'
      });
    }

    const userExists = users.has(username);

    res.status(200).json({
      exists: userExists,
      username: username
    });
  } catch (error) {
    console.error('Error al verificar usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

// Eliminar un usuario
const deleteUser = (req, res) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({
        error: 'Nombre de usuario requerido'
      });
    }

    if (!users.has(username)) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    users.delete(username);

    res.status(200).json({
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

module.exports = {
  registerUser,
  getUsers,
  checkUser,
  deleteUser
};