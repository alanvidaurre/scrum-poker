// Configuración centralizada para el backend
require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

const config = {
  // Configuración del servidor
  server: {
    port: parseInt(process.env.PORT) || 8090,
    host: process.env.HOST || 'localhost',
    environment: process.env.NODE_ENV || 'development'
  },

  // Configuración de CORS
  cors: {
    origins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3030'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },

  // Configuración de Socket.io
  socket: {
    cors: {
      origin: process.env.SOCKET_CORS_ORIGINS ? process.env.SOCKET_CORS_ORIGINS.split(',') : ['http://localhost:3030'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  },

  // Configuración de logging
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING === 'true',
    enableConsoleColors: process.env.NODE_ENV === 'development'
  },

  // Configuración de la aplicación
  app: {
    name: process.env.APP_NAME || 'Scrum Poker Backend',
    version: process.env.VERSION || '1.0.0'
  },

  // Límites y configuraciones de negocio
  limits: {
    maxRooms: parseInt(process.env.MAX_ROOMS) || 100,
    maxParticipantsPerRoom: parseInt(process.env.MAX_PARTICIPANTS_PER_ROOM) || 20,
    roomCodeLength: parseInt(process.env.ROOM_CODE_LENGTH) || 6,
    roomExpiryHours: parseInt(process.env.ROOM_EXPIRY_HOURS) || 24
  },

  // Configuración de monitoreo
  monitoring: {
    enableHealthChecks: process.env.ENABLE_HEALTH_CHECKS === 'true',
    enableMetrics: process.env.METRICS_ENABLED === 'true'
  },

  // Configuración de seguridad
  security: {
    enableRateLimiting: process.env.ENABLE_RATE_LIMITING === 'true',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutos
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    forceHttps: process.env.FORCE_HTTPS === 'true',
    secureCookies: process.env.SECURE_COOKIES === 'true'
  },

  // Configuración de base de datos (para futuras implementaciones)
  database: {
    type: process.env.DB_TYPE || 'memory',
    connectionString: process.env.DB_CONNECTION_STRING || null
  },

  // Configuración de sesiones (para futuras implementaciones)
  session: {
    secret: process.env.SESSION_SECRET || 'default-dev-secret',
    timeout: parseInt(process.env.SESSION_TIMEOUT) || 3600000 // 1 hora
  }
};

// Funciones utilitarias
const logger = {
  info: (...args) => {
    if (['debug', 'info'].includes(config.logging.level)) {
      console.log(`[${new Date().toISOString()}] [INFO] [${config.app.name}]`, ...args);
    }
  },
  warn: (...args) => {
    if (['debug', 'info', 'warn'].includes(config.logging.level)) {
      console.warn(`[${new Date().toISOString()}] [WARN] [${config.app.name}]`, ...args);
    }
  },
  error: (...args) => {
    console.error(`[${new Date().toISOString()}] [ERROR] [${config.app.name}]`, ...args);
  },
  debug: (...args) => {
    if (config.logging.level === 'debug') {
      console.log(`[${new Date().toISOString()}] [DEBUG] [${config.app.name}]`, ...args);
    }
  }
};

// Función para validar configuración crítica
const validateConfig = () => {
  const errors = [];

  if (!config.server.port || config.server.port < 1 || config.server.port > 65535) {
    errors.push('Puerto del servidor inválido');
  }

  if (!config.cors.origins || config.cors.origins.length === 0) {
    errors.push('No se han configurado orígenes CORS');
  }

  if (config.server.environment === 'production') {
    if (config.session.secret === 'default-dev-secret') {
      errors.push('Se debe configurar un SECRET de sesión seguro para producción');
    }
    
    if (!config.security.forceHttps) {
      logger.warn('Se recomienda forzar HTTPS en producción');
    }
  }

  if (errors.length > 0) {
    logger.error('Errores de configuración:', errors);
    throw new Error(`Configuración inválida: ${errors.join(', ')}`);
  }

  logger.info('Configuración validada correctamente');
};

// Función para mostrar información de configuración
const showConfig = () => {
  logger.info('=== CONFIGURACIÓN DEL SERVIDOR ===');
  logger.info(`Ambiente: ${config.server.environment}`);
  logger.info(`Puerto: ${config.server.port}`);
  logger.info(`Host: ${config.server.host}`);
  logger.info(`Aplicación: ${config.app.name} v${config.app.version}`);
  logger.info(`Orígenes CORS: ${config.cors.origins.join(', ')}`);
  logger.info(`Nivel de log: ${config.logging.level}`);
  logger.info('================================');
};

// Función para verificar si estamos en un ambiente específico
const isEnvironment = (env) => config.server.environment === env;
const isDevelopment = () => isEnvironment('development');
const isQA = () => isEnvironment('qa');
const isProduction = () => isEnvironment('production');

module.exports = {
  config,
  logger,
  validateConfig,
  showConfig,
  isEnvironment,
  isDevelopment,
  isQA,
  isProduction
};