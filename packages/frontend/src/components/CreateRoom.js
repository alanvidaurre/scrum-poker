import React, { useState } from 'react';
import config, { getApiUrl, log } from '../config';
import './CreateRoom.css';

const CreateRoom = ({ user, onRoomCreated, onCancel }) => {
  const [roomName, setRoomName] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(8);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!roomName.trim()) {
      setError('Por favor ingresa un nombre para la sala');
      return;
    }

    if (roomName.trim().length < 3) {
      setError('El nombre debe tener al menos 3 caracteres');
      return;
    }

    if (roomName.trim().length > 50) {
      setError('El nombre no puede tener más de 50 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      log.info('Creando sala:', { roomName: roomName.trim(), maxParticipants, user: user.id });
      const response = await fetch(getApiUrl('/api/rooms'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName: roomName.trim(),
          createdBy: user.id,
          maxParticipants: maxParticipants
        }),
        timeout: config.requestTimeout
      });

      const data = await response.json();

      if (response.ok) {
        // Sala creada exitosamente
        log.info('Sala creada exitosamente:', data.room);
        onRoomCreated(data.room);
      } else {
        // Error del servidor
        setError(data.error || 'Error al crear la sala');
        log.error('Error al crear sala:', data);
      }
    } catch (error) {
      log.error('Error al conectar con el servidor:', error);
      setError('Error de conexión. Verifica que el servidor esté funcionando.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setRoomName(e.target.value);
    if (error) {
      setError(''); // Limpiar error cuando el usuario empiece a escribir
    }
  };

  return (
    <div className="create-room-overlay">
      <div className="create-room-modal">
        <div className="modal-header">
          <h2>Crear Nueva Sala</h2>
          <button onClick={onCancel} className="close-button">
            ×
          </button>
        </div>
        
        <div className="modal-content">
          <form onSubmit={handleSubmit} className="create-room-form">
            <div className="input-group">
              <label htmlFor="roomName">Nombre de la sala:</label>
              <input
                type="text"
                id="roomName"
                value={roomName}
                onChange={handleInputChange}
                placeholder="Ej: Sprint Planning Equipo Alpha"
                disabled={loading}
                maxLength={50}
                autoFocus
              />
              <div className="character-count">
                {roomName.length}/50 caracteres
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="maxParticipants">Máximo de participantes:</label>
              <select
                id="maxParticipants"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
                disabled={loading}
              >
                <option value={4}>4 participantes</option>
                <option value={6}>6 participantes</option>
                <option value={8}>8 participantes</option>
                <option value={10}>10 participantes</option>
                <option value={12}>12 participantes</option>
                <option value={15}>15 participantes</option>
              </select>
            </div>

            <div className="room-preview">
              <h3>Vista previa:</h3>
              <div className="preview-card">
                <div className="room-info">
                  <strong>{roomName || 'Nombre de la sala'}</strong>
                  <span>Creado por: {user.username}</span>
                  <span>Máximo: {maxParticipants} participantes</span>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            
            <div className="modal-actions">
              <button 
                type="button" 
                onClick={onCancel}
                className="cancel-button"
                disabled={loading}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={loading || !roomName.trim()}
                className="create-button"
              >
                {loading ? 'Creando...' : 'Crear Sala'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateRoom;