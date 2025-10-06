// Configuración centralizada para diferentes ambientes
const config = {
  // URLs base para APIs y Socket.io
  apiBaseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8090',
  socketUrl: process.env.REACT_APP_SOCKET_URL || 'http://localhost:8090',
  
  // Información de la aplicación
  appName: process.env.REACT_APP_APP_NAME || 'Scrum Poker',
  version: process.env.REACT_APP_VERSION || '1.0.0',
  environment: process.env.REACT_APP_ENVIRONMENT || 'development',
  
  // Configuración de desarrollo
  debug: process.env.REACT_APP_DEBUG === 'true',
  
  // Configuración de Socket.io
  socketConfig: {
    cors: {
      origin: process.env.REACT_APP_SOCKET_URL || 'http://localhost:8090',
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling'],
    timeout: 20000,
    autoConnect: true
  },
  
  // Timeouts y límites
  requestTimeout: 10000,
  maxRetries: 3,
  
  // Configuración específica por ambiente
  features: {
    enableLogging: process.env.REACT_APP_DEBUG === 'true',
    enableAnalytics: process.env.REACT_APP_ENVIRONMENT === 'production',
    enableErrorReporting: process.env.REACT_APP_ENVIRONMENT !== 'development'
  },
  
  // URLs de endpoints
  endpoints: {
    users: '/api/users',
    rooms: '/api/rooms',
    health: '/health'
  }
};

// Función para obtener la URL completa de un endpoint
export const getApiUrl = (endpoint) => {
  const baseUrl = config.apiBaseUrl.replace(/\/$/, ''); // Remover barra final
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${path}`;
};

// Función para logging condicional
export const log = {
  info: (...args) => {
    if (config.debug) {
      console.log(`[${config.appName}]`, ...args);
    }
  },
  warn: (...args) => {
    if (config.debug) {
      console.warn(`[${config.appName}]`, ...args);
    }
  },
  error: (...args) => {
    if (config.debug || config.environment !== 'development') {
      console.error(`[${config.appName}]`, ...args);
    }
  }
};

// Función para verificar si estamos en un ambiente específico
export const isEnvironment = (env) => config.environment === env;
export const isDevelopment = () => isEnvironment('development');
export const isQA = () => isEnvironment('qa');
export const isProduction = () => isEnvironment('production');

export default config;