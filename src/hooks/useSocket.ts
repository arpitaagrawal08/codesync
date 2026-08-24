import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const nextSocket = io('http://localhost:3001', {
      transports: ['polling', 'websocket'],
    });

    setSocket(nextSocket);

    nextSocket.on('connect', () => {
      console.log('Connected to server:', nextSocket.id);
    });

    nextSocket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    nextSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    return () => {
      nextSocket.disconnect();
      setSocket(null);
    };
  }, []);

  return socket;
};