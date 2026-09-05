import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const rawSocketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';
const SOCKET_URL = rawSocketUrl.trim().replace(/\/+$/, '').replace(/\/api$/, '');

export const useAdminSocket = ({ onUpdate }) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsConnected(false);
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('[Admin Socket] Connected to command stream:', socket.id);
      socket.emit('join_admin');
    });

    socket.on('queue:updated', (data) => {
      console.log('[Admin Socket] queue:updated received:', data);
      if (onUpdateRef.current) onUpdateRef.current('queue', data);
    });

    socket.on('procurement:completed', (data) => {
      console.log('[Admin Socket] procurement:completed received:', data);
      if (onUpdateRef.current) onUpdateRef.current('procurement', data);
    });

    socket.on('payment:updated', (data) => {
      console.log('[Admin Socket] payment:updated received:', data);
      if (onUpdateRef.current) onUpdateRef.current('payment', data);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  return { isConnected };
};

export default useAdminSocket;
