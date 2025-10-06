import React, { useState } from 'react';
import config, { getApiUrl, log } from '../config';
import './JoinRoom.css';

const JoinRoom = ({ user, onRoomJoined, onCancel }) => {
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roomInfo, setRoomInfo] = useState(null);

  const handleCodeChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setRoomCode(value);
    
    if (error) {
      setError('');
    }
    
    if (roomInfo) {
      setRoomInfo(null);
    }
  };

  const handleVerifyRoom = async () => {
    if (!roomCode.trim()) {
      setError('Por favor ingresa un código de sala');
      return;
    }

    if (roomCode.length !== 6) {
      setError('El código debe tener 6 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      log.info('Verificando sala:', roomCode);
      const response = await fetch(getApiUrl(`/api/rooms/${roomCode}`), {
        timeout: config.requestTimeout
      });
      const data = await response.json();

      if (response.ok) {
        setRoomInfo(data.room);
        log.info('Sala encontrada:', data.room);
      } else {
        setError(data.error || 'Sala no encontrada');
        setRoomInfo(null);
        log.warn('Sala no encontrada:', data);
      }
    } catch (error) {
      log.error('Error al verificar sala:', error);
      setError('Error de conexión. Verifica que el servidor esté funcionando.');
      setRoomInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomInfo) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      log.info('Uniéndose a sala:', { roomCode, userId: user.id });
      const response = await fetch(getApiUrl(`/api/rooms/${roomCode}/join`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          username: user.username
        }),
        timeout: config.requestTimeout
      });

      const data = await response.json();

      if (response.ok) {
        // Se unió exitosamente
        log.info('Se unió exitosamente a la sala:', roomInfo);
        onRoomJoined({
          ...roomInfo,
          participantCount: roomInfo.participantCount + 1
        });
      } else {
        // Error del servidor
        setError(data.error || 'Error al unirse a la sala');
        log.error('Error al unirse a la sala:', data);
      }
    } catch (error) {
      log.error('Error al unirse a la sala:', error);
      setError('Error de conexión. Verifica que el servidor esté funcionando.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (roomInfo) {
      handleJoinRoom();
    } else {
      handleVerifyRoom();
    }
  };

  return (
    <div className="join-room-overlay">
      <div className="join-room-modal">
        <div className="modal-header">
          <h2>Unirse a Sala</h2>
          <button onClick={onCancel} className="close-button">
            ×
          </button>
        </div>
        
        <div className="modal-content">
          <form onSubmit={handleSubmit} className="join-room-form">
            <div className="input-group">
              <label htmlFor="roomCode">Código de la sala:</label>
              <input
                type="text"
                id="roomCode"
                value={roomCode}
                onChange={handleCodeChange}
                placeholder="ABC123"
                disabled={loading}
                maxLength={6}
                autoFocus
                className="room-code-input"
              />
              <div className="code-hint">
                Ingresa el código de 6 caracteres que te proporcionó el organizador
              </div>
            </div>

            {roomInfo && (
              <div className="room-preview">
                <h3>Información de la sala:</h3>
                <div className="preview-card">
                  <div className="room-info">
                    <div className="room-name">{roomInfo.name}</div>
                    <div className="room-details">
                      <span>Código: <strong>{roomInfo.code}</strong></span>
                      <span>Creado por: {roomInfo.createdBy}</span>
                      <span>
                        Participantes: {roomInfo.participantCount}/{roomInfo.maxParticipants}
                      </span>
                      <span className={`status ${roomInfo.status}`}>
                        Estado: {roomInfo.status === 'waiting' ? 'Esperando' : 
                                roomInfo.status === 'voting' ? 'Votando' : 'Finalizada'}
                      </span>
                    </div>
                  </div>
                  
                  {roomInfo.participantCount >= roomInfo.maxParticipants && (
                    <div className="warning-message">
                      ⚠️ Esta sala está llena
                    </div>
                  )}
                </div>
              </div>
            )}
            
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
              
              {!roomInfo ? (
                <button 
                  type="submit" 
                  disabled={loading || roomCode.length !== 6}
                  className="verify-button"
                >
                  {loading ? 'Verificando...' : 'Verificar Sala'}
                </button>
              ) : (
                <button 
                  type="submit" 
                  disabled={loading || (roomInfo.participantCount >= roomInfo.maxParticipants)}
                  className="join-button"
                >
                  {loading ? 'Uniéndose...' : 'Unirse a Sala'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JoinRoom;