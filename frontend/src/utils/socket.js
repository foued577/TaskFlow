import { io } from 'socket.io-client';

// URL du serveur backend
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

// Configuration de la connexion Socket.io
const socket = io(SOCKET_URL, {
  autoConnect: false, // Ne pas connecter automatiquement
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  transports: ['websocket', 'polling'],
  withCredentials: true,
});

// Logs de connexion/déconnexion (utiles pour le debug)
socket.on('connect', () => {
  console.log('✅ Socket.io connecté:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('⚠️ Socket.io déconnecté:', reason);
});

socket.on('connect_error', (error) => {
  console.error('❌ Erreur de connexion Socket.io:', error.message);
});

export default socket;

