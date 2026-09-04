import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

export const useSocketQueue = ({ centreId, farmerId, onQueueUpdate }) => {
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // connected, reconnecting, disconnected
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setConnectionStatus('disconnected');
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
      setConnectionStatus('connected');
      console.log('[Socket Hook] Connected to queue server:', socket.id);

      if (centreId) {
        socket.emit('join_centre', centreId);
      }
      if (farmerId) {
        socket.emit('join_farmer', farmerId);
      }
    });

    socket.on('queue:updated', (data) => {
      console.log('[Socket Event] queue:updated received:', data);
      if (onQueueUpdate) onQueueUpdate(data);
    });

    socket.on('queue:called', (data) => {
      console.log('[Socket Event] queue:called received:', data);
      if (onQueueUpdate) onQueueUpdate(data);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket Hook] Connection error:', err.message);
      setConnectionStatus('reconnecting');
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket Hook] Disconnected:', reason);
      setConnectionStatus('reconnecting');
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [centreId, farmerId]);

  return {
    socket: socketRef.current,
    connectionStatus,
    isConnected: connectionStatus === 'connected'
  };
};

export default useSocketQueue;
