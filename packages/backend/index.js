const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { config, logger, validateConfig, showConfig } = require('./src/config');
const userRoutes = require('./routes/userRoutes');
const roomRoutes = require('./routes/roomRoutes');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, config.socket);

// Middleware
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging de requests (solo en desarrollo)
if (config.logging.enableRequestLogging) {
  app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.path} - ${req.ip}`);
    next();
  });
}

// Rutas
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ 
    message: 'Scrum Poker API funcionando correctamente',
    app: config.app.name,
    version: config.app.version,
    environment: config.server.environment,
    timestamp: new Date().toISOString()
  });
});

// Ruta de health check
if (config.monitoring.enableHealthChecks) {
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.server.environment
    });
  });
}

// Socket.io para tiempo real
io.on('connection', (socket) => {
  logger.debug('Usuario conectado:', socket.id);
  
  socket.on('disconnect', () => {
    logger.debug('Usuario desconectado:', socket.id);
  });

  // Unirse a una sala
  socket.on('join-room', (roomCode, userInfo) => {
    socket.join(roomCode);
    logger.debug(`Usuario ${userInfo?.username || socket.id} se unió a la sala ${roomCode}`);
    
    // Notificar a otros usuarios en la sala
    socket.to(roomCode).emit('user-joined', {
      userId: userInfo?.id,
      username: userInfo?.username,
      socketId: socket.id
    });
  });

  // Salir de una sala
  socket.on('leave-room', (roomCode, userInfo) => {
    socket.leave(roomCode);
    logger.debug(`Usuario ${userInfo?.username || socket.id} salió de la sala ${roomCode}`);
    
    // Notificar a otros usuarios en la sala
    socket.to(roomCode).emit('user-left', {
      userId: userInfo?.id,
      username: userInfo?.username,
      socketId: socket.id
    });
  });

  // Eventos específicos de Scrum Poker
  socket.on('start-voting', (roomCode, story) => {
    logger.info(`Votación iniciada en sala ${roomCode} para historia: ${story}`);
    io.to(roomCode).emit('voting-started', { story });
  });

  socket.on('submit-vote', (roomCode, vote, userInfo) => {
    logger.debug(`Voto recibido en sala ${roomCode} de ${userInfo?.username}: ${vote}`);
    // Notificar que alguien ha votado (sin revelar el voto)
    socket.to(roomCode).emit('vote-submitted', {
      userId: userInfo?.id,
      username: userInfo?.username
    });
  });

  socket.on('reveal-votes', (roomCode, votes) => {
    logger.info(`Revelando votos en sala ${roomCode}`);
    io.to(roomCode).emit('votes-revealed', { votes });
  });

  socket.on('reset-voting', (roomCode) => {
    logger.info(`Reiniciando votación en sala ${roomCode}`);
    io.to(roomCode).emit('voting-reset');
  });
});

// Validar configuración antes de iniciar el servidor
try {
  validateConfig();
  showConfig();
} catch (error) {
  logger.error('Error en la configuración:', error.message);
  process.exit(1);
}

// Iniciar servidor
server.listen(config.server.port, config.server.host, () => {
  logger.info(`Servidor iniciado en ${config.server.host}:${config.server.port}`);
  logger.info(`Ambiente: ${config.server.environment}`);
});
