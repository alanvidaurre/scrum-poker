import React, { useState, useEffect } from 'react';
import CreateRoom from './CreateRoom';
import JoinRoom from './JoinRoom';
import ScrumPokerRoom from './ScrumPokerRoom';
import './Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [recentRooms, setRecentRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar salas recientes al montar el componente
  useEffect(() => {
    loadRecentRooms();
  }, []);

  const loadRecentRooms = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8090/api/rooms');
      const data = await response.json();
      
      if (response.ok) {
        // Mostrar solo las últimas 5 salas
        setRecentRooms(data.rooms.slice(-5).reverse());
      }
    } catch (error) {
      console.error('Error al cargar salas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoomCreated = (room) => {
    console.log('Sala creada:', room);
    setShowCreateRoom(false);
    // Entrar directamente a la sala creada
    setCurrentRoom({
      ...room,
      participants: [{ id: user.id, username: user.username }]
    });
  };

  const handleRoomJoined = (room) => {
    console.log('Se unió a la sala:', room);
    setShowJoinRoom(false);
    // Entrar directamente a la sala
    setCurrentRoom(room);
  };

  const handleJoinRecentRoom = async (roomCode) => {
    try {
      // Primero obtener información de la sala
      const roomResponse = await fetch(`http://localhost:8090/api/rooms/${roomCode}`);
      const roomData = await roomResponse.json();
      
      if (!roomResponse.ok) {
        alert(`Error: ${roomData.error}`);
        return;
      }

      // Luego unirse a la sala
      const joinResponse = await fetch(`http://localhost:8090/api/rooms/${roomCode}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          username: user.username
        }),
      });

      const joinData = await joinResponse.json();

      if (joinResponse.ok) {
        // Entrar a la sala
        setCurrentRoom(roomData.room);
        loadRecentRooms();
      } else {
        alert(`Error: ${joinData.error}`);
      }
    } catch (error) {
      console.error('Error al unirse a la sala:', error);
      alert('Error de conexión');
    }
  };

  const handleLeaveRoom = async () => {
    if (!currentRoom) return;

    try {
      await fetch(`http://localhost:8090/api/rooms/${currentRoom.code}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id
        }),
      });
      
      // Volver al dashboard
      setCurrentRoom(null);
      loadRecentRooms();
    } catch (error) {
      console.error('Error al salir de la sala:', error);
      // Aún así, volver al dashboard
      setCurrentRoom(null);
    }
  };

  // Si está en una sala, mostrar el componente de la sala
  if (currentRoom) {
    return (
      <ScrumPokerRoom 
        room={currentRoom}
        user={user}
        onLeaveRoom={handleLeaveRoom}
      />
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1>Scrum Poker</h1>
          <div className="user-info">
            <span className="welcome-text">Bienvenido, <strong>{user.username}</strong></span>
            <button onClick={onLogout} className="logout-button">
              Cerrar Sesión
            </button>
          </div>
        </header>
        
        <main className="dashboard-content">
          <div className="main-actions-card">
            <h2>¿Qué te gustaría hacer?</h2>
            <p>Crea una nueva sala de Scrum Poker o únete a una existente</p>
            
            <div className="actions">
              <button 
                className="primary-button"
                onClick={() => setShowCreateRoom(true)}
              >
                🏗️ Crear Nueva Sala
              </button>
              <button 
                className="secondary-button"
                onClick={() => setShowJoinRoom(true)}
              >
                🚪 Unirse a Sala
              </button>
            </div>
          </div>

          {recentRooms.length > 0 && (
            <div className="recent-rooms-card">
              <h2>Salas Recientes</h2>
              <p>Salas creadas recientemente por otros usuarios</p>
              
              {loading ? (
                <div className="loading-text">Cargando salas...</div>
              ) : (
                <div className="rooms-list">
                  {recentRooms.map((room) => (
                    <div key={room.id} className="room-item">
                      <div className="room-info">
                        <div className="room-name">{room.name}</div>
                        <div className="room-details">
                          <span>Código: <strong>{room.code}</strong></span>
                          <span>Por: {room.createdBy}</span>
                          <span>{room.participantCount}/{room.maxParticipants} participantes</span>
                        </div>
                      </div>
                      <div className="room-actions">
                        <button 
                          className="join-room-button"
                          onClick={() => handleJoinRecentRoom(room.code)}
                          disabled={room.participantCount >= room.maxParticipants}
                        >
                          {room.participantCount >= room.maxParticipants ? 'Llena' : 'Unirse'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="info-card">
            <h2>Información de Usuario</h2>
            <div className="user-details">
              <p><strong>Nombre:</strong> {user.username}</p>
              <p><strong>ID de usuario:</strong> <code>{user.id}</code></p>
            </div>
          </div>
        </main>
      </div>

      {/* Modales */}
      {showCreateRoom && (
        <CreateRoom 
          user={user}
          onRoomCreated={handleRoomCreated}
          onCancel={() => setShowCreateRoom(false)}
        />
      )}

      {showJoinRoom && (
        <JoinRoom 
          user={user}
          onRoomJoined={handleRoomJoined}
          onCancel={() => setShowJoinRoom(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;