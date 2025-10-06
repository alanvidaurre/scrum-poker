import React, { useState } from 'react';
import config, { getApiUrl, log } from '../config';
import './UserRegistration.css';

const UserRegistration = ({ onUserRegistered }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Por favor ingresa un nombre de usuario');
      return;
    }

    if (username.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres');
      return;
    }

    if (username.trim().length > 20) {
      setError('El nombre no puede tener más de 20 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      log.info('Registrando usuario:', username.trim());
      const response = await fetch(getApiUrl('/api/users'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.trim() }),
        timeout: config.requestTimeout
      });

      const data = await response.json();

      if (response.ok) {
        // Usuario registrado exitosamente
        log.info('Usuario registrado exitosamente:', data.user);
        onUserRegistered(data.user);
      } else {
        // Error del servidor
        setError(data.error || 'Error al registrar usuario');
        log.error('Error al registrar usuario:', data);
      }
    } catch (error) {
      log.error('Error al conectar con el servidor:', error);
      setError('Error de conexión. Verifica que el servidor esté funcionando.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setUsername(e.target.value);
    if (error) {
      setError(''); // Limpiar error cuando el usuario empiece a escribir
    }
  };

  return (
    <div className="user-registration">
      <div className="registration-container">
        <h1>Scrum Poker</h1>
        <h2>Bienvenido</h2>
        <p>Ingresa tu nombre para comenzar</p>
        
        <form onSubmit={handleSubmit} className="registration-form">
          <div className="input-group">
            <label htmlFor="username">Nombre de usuario:</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={handleInputChange}
              placeholder="Ej: Juan Pérez"
              disabled={loading}
              maxLength={20}
              autoComplete="name"
              autoFocus
            />
          </div>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={loading || !username.trim()}
            className="submit-button"
          >
            {loading ? 'Registrando...' : 'Ingresar'}
          </button>
        </form>
        
        <div className="character-count">
          {username.length}/20 caracteres
        </div>
      </div>
    </div>
  );
};

export default UserRegistration;