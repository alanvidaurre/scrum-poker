import React, { useState, useEffect } from 'react';
import UserRegistration from './components/UserRegistration';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificar si hay un usuario guardado en localStorage al cargar la app
  useEffect(() => {
    const savedUser = localStorage.getItem('scrumPokerUser');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error al parsear usuario guardado:', error);
        localStorage.removeItem('scrumPokerUser');
      }
    }
    setLoading(false);
  }, []);

  // Manejar el registro exitoso del usuario
  const handleUserRegistered = (userData) => {
    setUser(userData);
    // Guardar el usuario en localStorage para persistencia
    localStorage.setItem('scrumPokerUser', JSON.stringify(userData));
  };

  // Manejar el logout del usuario
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('scrumPokerUser');
  };

  // Mostrar loading mientras se verifica el usuario guardado
  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="App">
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <UserRegistration onUserRegistered={handleUserRegistered} />
      )}
    </div>
  );
}

export default App;
