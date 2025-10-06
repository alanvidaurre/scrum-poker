// Simulación de base de datos en memoria para salas
const rooms = new Map();

// Generar un código único para la sala
const generateRoomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Crear una nueva sala
const createRoom = (req, res) => {
  try {
    const { roomName, createdBy, maxParticipants = 10 } = req.body;

    // Validaciones
    if (!roomName) {
      return res.status(400).json({
        error: 'El nombre de la sala es requerido'
      });
    }

    if (!createdBy) {
      return res.status(400).json({
        error: 'El creador de la sala es requerido'
      });
    }

    if (roomName.trim().length < 3) {
      return res.status(400).json({
        error: 'El nombre de la sala debe tener al menos 3 caracteres'
      });
    }

    if (roomName.trim().length > 50) {
      return res.status(400).json({
        error: 'El nombre de la sala no puede tener más de 50 caracteres'
      });
    }

    // Generar un código único para la sala
    let roomCode;
    do {
      roomCode = generateRoomCode();
    } while (rooms.has(roomCode));

    // Crear el objeto sala
    const room = {
      id: roomCode,
      name: roomName.trim(),
      code: roomCode,
      createdBy: createdBy,
      createdAt: new Date().toISOString(),
      maxParticipants: parseInt(maxParticipants),
      participants: [createdBy], // El creador se une automáticamente
      status: 'waiting', // waiting, voting, finished
      currentStory: null,
      votes: new Map(),
      stories: []
    };

    // Guardar la sala
    rooms.set(roomCode, room);

    // Responder con éxito
    res.status(201).json({
      message: 'Sala creada exitosamente',
      room: {
        id: room.id,
        name: room.name,
        code: room.code,
        createdBy: room.createdBy,
        maxParticipants: room.maxParticipants,
        participantCount: room.participants.length,
        status: room.status
      }
    });

  } catch (error) {
    console.error('Error al crear sala:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

// Obtener todas las salas
const getRooms = (req, res) => {
  try {
    const roomList = Array.from(rooms.values()).map(room => ({
      id: room.id,
      name: room.name,
      code: room.code,
      createdBy: room.createdBy,
      createdAt: room.createdAt,
      maxParticipants: room.maxParticipants,
      participantCount: room.participants.length,
      status: room.status
    }));

    res.status(200).json({
      rooms: roomList,
      count: roomList.length
    });
  } catch (error) {
    console.error('Error al obtener salas:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

// Obtener una sala específica
const getRoom = (req, res) => {
  try {
    const { roomCode } = req.params;

    if (!roomCode) {
      return res.status(400).json({
        error: 'Código de sala requerido'
      });
    }

    const room = rooms.get(roomCode);

    if (!room) {
      return res.status(404).json({
        error: 'Sala no encontrada'
      });
    }

    res.status(200).json({
      room: {
        id: room.id,
        name: room.name,
        code: room.code,
        createdBy: room.createdBy,
        createdAt: room.createdAt,
        maxParticipants: room.maxParticipants,
        participants: room.participants,
        participantCount: room.participants.length,
        status: room.status,
        currentStory: room.currentStory,
        stories: room.stories
      }
    });
  } catch (error) {
    console.error('Error al obtener sala:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

// Unirse a una sala
const joinRoom = (req, res) => {
  try {
    const { roomCode } = req.params;
    const { userId, username } = req.body;

    if (!roomCode) {
      return res.status(400).json({
        error: 'Código de sala requerido'
      });
    }

    if (!userId || !username) {
      return res.status(400).json({
        error: 'ID de usuario y nombre son requeridos'
      });
    }

    const room = rooms.get(roomCode);

    if (!room) {
      return res.status(404).json({
        error: 'Sala no encontrada'
      });
    }

    // Verificar si la sala está llena
    if (room.participants.length >= room.maxParticipants) {
      return res.status(409).json({
        error: 'La sala está llena'
      });
    }

    // Verificar si el usuario ya está en la sala
    const userInRoom = room.participants.find(p => 
      (typeof p === 'object' ? p.id : p) === userId
    );

    if (userInRoom) {
      return res.status(409).json({
        error: 'El usuario ya está en la sala'
      });
    }

    // Agregar el usuario a la sala
    const participant = {
      id: userId,
      username: username,
      joinedAt: new Date().toISOString()
    };

    room.participants.push(participant);

    res.status(200).json({
      message: 'Te has unido a la sala exitosamente',
      room: {
        id: room.id,
        name: room.name,
        code: room.code,
        participantCount: room.participants.length,
        status: room.status
      }
    });

  } catch (error) {
    console.error('Error al unirse a sala:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

// Salir de una sala
const leaveRoom = (req, res) => {
  try {
    const { roomCode } = req.params;
    const { userId } = req.body;

    if (!roomCode) {
      return res.status(400).json({
        error: 'Código de sala requerido'
      });
    }

    if (!userId) {
      return res.status(400).json({
        error: 'ID de usuario requerido'
      });
    }

    const room = rooms.get(roomCode);

    if (!room) {
      return res.status(404).json({
        error: 'Sala no encontrada'
      });
    }

    // Remover el usuario de la sala
    const initialLength = room.participants.length;
    room.participants = room.participants.filter(p => 
      (typeof p === 'object' ? p.id : p) !== userId
    );

    if (room.participants.length === initialLength) {
      return res.status(404).json({
        error: 'Usuario no encontrado en la sala'
      });
    }

    // Si la sala queda vacía, eliminarla
    if (room.participants.length === 0) {
      rooms.delete(roomCode);
      return res.status(200).json({
        message: 'Has salido de la sala. La sala ha sido eliminada por estar vacía.'
      });
    }

    res.status(200).json({
      message: 'Has salido de la sala exitosamente',
      room: {
        id: room.id,
        name: room.name,
        code: room.code,
        participantCount: room.participants.length
      }
    });

  } catch (error) {
    console.error('Error al salir de sala:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

// Eliminar una sala (solo el creador)
const deleteRoom = (req, res) => {
  try {
    const { roomCode } = req.params;
    const { userId } = req.body;

    if (!roomCode) {
      return res.status(400).json({
        error: 'Código de sala requerido'
      });
    }

    if (!userId) {
      return res.status(400).json({
        error: 'ID de usuario requerido'
      });
    }

    const room = rooms.get(roomCode);

    if (!room) {
      return res.status(404).json({
        error: 'Sala no encontrada'
      });
    }

    // Verificar si el usuario es el creador
    const creatorId = typeof room.createdBy === 'object' ? room.createdBy.id : room.createdBy;
    if (creatorId !== userId) {
      return res.status(403).json({
        error: 'Solo el creador de la sala puede eliminarla'
      });
    }

    // Eliminar la sala
    rooms.delete(roomCode);

    res.status(200).json({
      message: 'Sala eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar sala:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

module.exports = {
  createRoom,
  getRooms,
  getRoom,
  joinRoom,
  leaveRoom,
  deleteRoom
};