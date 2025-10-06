import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import config, { log, isDevelopment } from '../config';
import './ScrumPokerRoom.css';

const ScrumPokerRoom = ({ room, user, onLeaveRoom }) => {
  const [socket, setSocket] = useState(null);
  const [participants, setParticipants] = useState(room.participants || []);
  const [currentStory, setCurrentStory] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);
  const [votes, setVotes] = useState(new Map());
  const [votingPhase, setVotingPhase] = useState('waiting'); // waiting, voting, revealed
  const [isHost, setIsHost] = useState(false);
  const [storyDescription, setStoryDescription] = useState('');

  // Cartas disponibles para Scrum Poker
  const cards = [
    { value: '0', label: '0' },
    { value: '0.5', label: '½' },
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '5', label: '5' },
    { value: '8', label: '8' },
    { value: '13', label: '13' },
    { value: '21', label: '21' },
    { value: '34', label: '34' },
    { value: '55', label: '55' },
    { value: '89', label: '89' },
    { value: '?', label: '?' },
    { value: 'coffee', label: '☕' }
  ];

  useEffect(() => {
    // Inicializar conexión Socket.io
    log.info('Conectando a Socket.io:', config.socketUrl);
    const newSocket = io(config.socketUrl, config.socketConfig);
    setSocket(newSocket);

    // Verificar si el usuario es el host
    const hostId = typeof room.createdBy === 'object' ? room.createdBy.id : room.createdBy;
    setIsHost(hostId === user.id);

    // Unirse a la sala
    newSocket.emit('join-room', room.code, user);

    // Escuchar eventos
    newSocket.on('user-joined', (userInfo) => {
      setParticipants(prev => [...prev, userInfo]);
    });

    newSocket.on('user-left', (userInfo) => {
      setParticipants(prev => prev.filter(p => 
        (typeof p === 'object' ? p.id : p) !== userInfo.userId
      ));
      // Remover el voto del usuario que se fue
      setVotes(prev => {
        const newVotes = new Map(prev);
        newVotes.delete(userInfo.userId);
        return newVotes;
      });
    });

    newSocket.on('voting-started', (data) => {
      setCurrentStory(data.story);
      setVotingPhase('voting');
      setSelectedCard(null);
      setVotes(new Map());
    });

    newSocket.on('vote-submitted', (data) => {
      setVotes(prev => {
        const newVotes = new Map(prev);
        newVotes.set(data.userId, { username: data.username, vote: 'hidden' });
        return newVotes;
      });
    });

    newSocket.on('votes-revealed', (data) => {
      setVotes(new Map(Object.entries(data.votes)));
      setVotingPhase('revealed');
    });

    newSocket.on('voting-reset', () => {
      setVotingPhase('waiting');
      setSelectedCard(null);
      setVotes(new Map());
      setCurrentStory('');
    });

    return () => {
      newSocket.emit('leave-room', room.code, user);
      newSocket.disconnect();
    };
  }, [room.code, user, room.createdBy]);

  const startVoting = () => {
    if (!storyDescription.trim()) {
      alert('Por favor ingresa la descripción de la historia');
      return;
    }
    socket.emit('start-voting', room.code, storyDescription.trim());
    setCurrentStory(storyDescription.trim());
  };

  const selectCard = (card) => {
    if (votingPhase !== 'voting') return;
    
    setSelectedCard(card);
    socket.emit('submit-vote', room.code, card.value, user);
    
    // Actualizar localmente
    setVotes(prev => {
      const newVotes = new Map(prev);
      newVotes.set(user.id, { username: user.username, vote: 'hidden' });
      return newVotes;
    });
  };

  const revealVotes = () => {
    const votesObject = {};
    votes.forEach((voteData, userId) => {
      if (userId === user.id) {
        votesObject[userId] = { username: voteData.username, vote: selectedCard?.value || '?' };
      } else {
        votesObject[userId] = voteData;
      }
    });
    
    socket.emit('reveal-votes', room.code, votesObject);
  };

  const resetVoting = () => {
    // Confirmar solo si hay votos en progreso
    if (votingPhase === 'voting' && votes.size > 0) {
      const confirmReset = window.confirm(
        '¿Estás seguro de que quieres reiniciar la votación?\n\nSe perderán todos los votos actuales.'
      );
      if (!confirmReset) return;
    }
    
    socket.emit('reset-voting', room.code);
    setStoryDescription('');
  };

  const calculateAverage = () => {
    const numericVotes = Array.from(votes.values())
      .map(v => parseFloat(v.vote))
      .filter(v => !isNaN(v) && v !== null);
    
    if (numericVotes.length === 0) return null;
    
    const sum = numericVotes.reduce((a, b) => a + b, 0);
    return (sum / numericVotes.length).toFixed(1);
  };

  const getVoteStats = () => {
    const voteValues = Array.from(votes.values()).map(v => v.vote);
    const unique = [...new Set(voteValues)];
    const consensus = unique.length === 1 && unique[0] !== 'hidden';
    
    return {
      totalVotes: votes.size,
      expectedVotes: participants.length,
      consensus,
      average: calculateAverage()
    };
  };

  const stats = getVoteStats();

  return (
    <div className="scrum-poker-room">
      <div className="room-container">
        {/* Header */}
        <header className="room-header">
          <div className="room-info">
            <h1>{room.name}</h1>
            <span className="room-code">Código: {room.code}</span>
          </div>
          <div className="room-actions">
            <span className="participant-count">
              {participants.length} participante{participants.length !== 1 ? 's' : ''}
            </span>
            <button onClick={onLeaveRoom} className="leave-button">
              Salir
            </button>
          </div>
        </header>

        {/* Historia actual */}
        <div className="story-section">
          {votingPhase === 'waiting' ? (
            isHost ? (
              <div className="story-input">
                <h2>Iniciar nueva votación</h2>
                <input
                  type="text"
                  placeholder="Describe la historia o tarea a estimar..."
                  value={storyDescription}
                  onChange={(e) => setStoryDescription(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && startVoting()}
                  className="story-description-input"
                />
                <button 
                  onClick={startVoting}
                  disabled={!storyDescription.trim()}
                  className="start-voting-button"
                >
                  Iniciar Votación
                </button>
              </div>
            ) : (
              <div className="waiting-message">
                <h2>Esperando que el host inicie la votación...</h2>
                <p>El organizador de la sala iniciará la próxima historia</p>
              </div>
            )
          ) : (
            <div className="current-story">
              <h2>Historia actual:</h2>
              <p className="story-text">{currentStory}</p>
              <div className="voting-status">
                <span className={`phase ${votingPhase}`}>
                  {votingPhase === 'voting' ? '🗳️ Votación en progreso' : '👁️ Votos revelados'}
                </span>
                <span className="vote-count">
                  {stats.totalVotes}/{stats.expectedVotes} votos
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Cartas de votación */}
        {votingPhase === 'voting' && (
          <div className="cards-section">
            <h3>Selecciona tu estimación:</h3>
            <div className="cards-grid">
              {cards.map((card) => (
                <div
                  key={card.value}
                  className={`poker-card ${selectedCard?.value === card.value ? 'selected' : ''}`}
                  onClick={() => selectCard(card)}
                >
                  <span className="card-label">{card.label}</span>
                </div>
              ))}
            </div>
            <p className="voting-instruction">
              {selectedCard 
                ? `Has seleccionado: ${selectedCard.label}` 
                : 'Selecciona una carta para votar'
              }
            </p>
          </div>
        )}

        {/* Participantes y votos */}
        <div className="participants-section">
          <h3>Participantes ({participants.length})</h3>
          <div className="participants-grid">
            {participants.map((participant, index) => {
              const participantId = typeof participant === 'object' ? participant.id : participant;
              const participantName = typeof participant === 'object' ? participant.username : participant;
              const hasVoted = votes.has(participantId);
              const vote = votes.get(participantId);
              
              return (
                <div key={participantId || index} className="participant-card">
                  <div className="participant-info">
                    <span className="participant-name">{participantName}</span>
                    {isHost && (typeof room.createdBy === 'object' ? room.createdBy.id : room.createdBy) === participantId && (
                      <span className="host-badge">HOST</span>
                    )}
                  </div>
                  <div className="participant-vote">
                    {votingPhase === 'waiting' ? (
                      <span className="status waiting">Esperando</span>
                    ) : votingPhase === 'voting' ? (
                      hasVoted ? (
                        <div className="vote-card voted">✓</div>
                      ) : (
                        <span className="status pending">Pensando...</span>
                      )
                    ) : (
                      <div className={`vote-card revealed ${vote?.vote}`}>
                        {vote?.vote || '?'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Resultados y controles */}
        {votingPhase === 'voting' && isHost && (
          <div className="host-controls">
            {stats.totalVotes === stats.expectedVotes ? (
              <button onClick={revealVotes} className="reveal-button">
                Revelar Votos
              </button>
            ) : stats.totalVotes > 0 ? (
              <div className="partial-voting-controls">
                <div className="voting-progress">
                  <span className="progress-text">
                    Esperando votos: {stats.totalVotes}/{stats.expectedVotes}
                  </span>
                </div>
                <button 
                  onClick={() => {
                    const confirmReveal = window.confirm(
                      `Solo ${stats.totalVotes} de ${stats.expectedVotes} participantes han votado.\n\n¿Quieres revelar los votos parciales?`
                    );
                    if (confirmReveal) revealVotes();
                  }} 
                  className="reveal-button partial"
                >
                  Revelar Parcial
                </button>
              </div>
            ) : (
              <div className="voting-progress">
                <span className="progress-text">
                  Esperando que los participantes voten...
                </span>
              </div>
            )}
            <button onClick={resetVoting} className="reset-button secondary">
              🔄 Reiniciar Votación
            </button>
          </div>
        )}

        {votingPhase === 'revealed' && (
          <div className="results-section">
            <div className="results-summary">
              <h3>Resultados de la votación</h3>
              {stats.average && (
                <div className="average">
                  Promedio: <strong>{stats.average}</strong>
                </div>
              )}
              {stats.consensus ? (
                <div className="consensus">
                  🎯 ¡Consenso alcanzado!
                </div>
              ) : (
                <div className="no-consensus">
                  💭 Sin consenso - Discutir diferencias
                </div>
              )}
            </div>
            
            {isHost && (
              <div className="host-controls">
                <button onClick={resetVoting} className="reset-button">
                  Nueva Votación
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScrumPokerRoom;