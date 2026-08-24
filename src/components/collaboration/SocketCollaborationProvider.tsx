"use client";

import { useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useSocketCollaborationStore, getUserColor } from '@/store/useSocketCollaborationStore';
import { useCodeEditorStore } from '@/store/useCodeEditorStore';
import toast from 'react-hot-toast';

interface SocketCollaborationProviderProps {
  children: React.ReactNode;
}

export const SocketCollaborationProvider = ({ children }: SocketCollaborationProviderProps) => {
  const socket = useSocket();
  const {
    setSocket,
    setConnected,
    setRoomId,
    setUsers,
    addMessage,
    setMessages,
    setJoining,
    setInRoom,
    setCursor,
    removeCursor,
    setRemoteCode,
  } = useSocketCollaborationStore();

  const { setLanguage } = useCodeEditorStore();

  useEffect(() => {
    if (!socket) return;

    setSocket(socket);

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => {
      setConnected(false);
      setInRoom(false);
      setRoomId(null);
    });

    // room-state: sent once when user successfully joins
    socket.on('room-state', ({ code, language, messages, users, roomId: incomingRoomId }) => {
      // Use setRemoteCode instead of editor.setValue() to avoid triggering onChange echo
      if (code) setRemoteCode(code);
      setLanguage(language);
      setMessages(messages);
      setUsers(users);
      setJoining(false);
      setInRoom(true);
      if (incomingRoomId) setRoomId(incomingRoomId);
      toast.success('Joined room successfully!', { id: 'room-join' });
    });

    socket.on('user-joined', ({ user, users }) => {
      setUsers(users);
      toast(`${user.name} joined the room`, { icon: '👋' });
    });

    socket.on('user-left', ({ userId, userName, users }) => {
      setUsers(users);
      removeCursor(userId);
      toast(`${userName} left the room`, { icon: 'ℹ️' });
    });

    // code-update: use setRemoteCode so the editor applies it with suppression flag
    socket.on('code-update', ({ code }) => {
      setRemoteCode(code);
    });

    socket.on('language-update', ({ language, userId }) => {
      if (userId !== socket.id) {
        setLanguage(language);
        toast(`Language changed to ${language}`, { icon: '🔤' });
      }
    });

    socket.on('receive-message', (message) => addMessage(message));

    socket.on('cursor-update', ({ position, userId, userName }) => {
      if (userId !== socket.id) {
        setCursor(userId, {
          lineNumber: position.lineNumber,
          column: position.column,
          userName,
          color: getUserColor(userId),
        });
      }
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('room-state');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('code-update');
      socket.off('language-update');
      socket.off('receive-message');
      socket.off('cursor-update');
    };
  // editor removed from deps — provider no longer touches editor directly
  }, [socket, setSocket, setConnected, setRoomId, setUsers, addMessage, setMessages, setLanguage, setJoining, setInRoom, setCursor, removeCursor, setRemoteCode]);

  return <>{children}</>;
};