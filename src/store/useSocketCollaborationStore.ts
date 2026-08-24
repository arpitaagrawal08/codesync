import { create } from 'zustand';
import { Socket } from 'socket.io-client';

// Color palette for user cursors and avatars (8 distinct colors)
const USER_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

export function getUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

export interface User {
  id: string;
  name: string;
  joinedAt?: number;
  color?: string;
}

export interface CursorPosition {
  lineNumber: number;
  column: number;
  userName: string;
  color: string;
}

export interface ChatMessage {
  id: number;
  message: string;
  userName: string;
  userId: string;
  timestamp: number;
}

interface SocketCollaborationState {
  socket: Socket | null;
  isConnected: boolean;    // true when socket is connected to server
  isInRoom: boolean;       // true when actively in a collaboration room
  roomId: string | null;
  remoteCode: string | null; // code received from server to apply (avoids onChange echo)
  users: User[];
  messages: ChatMessage[];
  isJoining: boolean;
  cursors: Record<string, CursorPosition>; // userId -> cursor position

  // Actions
  setSocket: (socket: Socket) => void;
  setConnected: (connected: boolean) => void;
  setRoomId: (roomId: string | null) => void;
  setUsers: (users: User[]) => void;
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setJoining: (joining: boolean) => void;
  setInRoom: (inRoom: boolean) => void;
  setRemoteCode: (code: string | null) => void;
  setCursor: (userId: string, position: CursorPosition) => void;
  removeCursor: (userId: string) => void;

  // Socket actions
  joinRoom: (roomId: string, userName: string, initialLanguage?: string) => void;
  leaveRoom: () => void;
  sendCodeChange: (code: string) => void;
  sendLanguageChange: (language: string) => void;
  sendMessage: (message: string, userName: string) => void;
  sendCursorChange: (lineNumber: number, column: number) => void;
}

export const useSocketCollaborationStore = create<SocketCollaborationState>((set, get) => ({
  socket: null,
  isConnected: false,
  isInRoom: false,
  remoteCode: null,
  roomId: null,
  users: [],
  messages: [],
  isJoining: false,
  cursors: {},

  setSocket: (socket) => set({ socket }),
  setConnected: (connected) => set({ isConnected: connected }),
  setRoomId: (roomId) => set({ roomId }),
  setUsers: (users) => {
    // Assign colors to users
    const usersWithColors = users.map((u) => ({
      ...u,
      color: u.color ?? getUserColor(u.id),
    }));
    set({ users: usersWithColors });
  },
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  setMessages: (messages) => set({ messages }),
  setJoining: (joining) => set({ isJoining: joining }),
  setInRoom: (inRoom) => set({ isInRoom: inRoom }),
  setRemoteCode: (code) => set({ remoteCode: code }),

  setCursor: (userId, position) =>
    set((state) => ({
      cursors: { ...state.cursors, [userId]: position },
    })),

  removeCursor: (userId) =>
    set((state) => {
      const next = { ...state.cursors };
      delete next[userId];
      return { cursors: next };
    }),

  joinRoom: (roomId, userName, initialLanguage) => {
    const { socket } = get();
    if (socket) {
      set({ isJoining: true, roomId }); // optimistically set roomId
      socket.emit('join-room', { roomId, userName, initialLanguage });
    }
  },

  leaveRoom: () => {
    const { socket, roomId } = get();
    if (socket && roomId) {
      socket.emit('leave-room', { roomId });
    }
    // Clear room state but keep socket alive (isConnected stays true)
    set({
      roomId: null,
      users: [],
      messages: [],
      cursors: {},
      isInRoom: false,
      remoteCode: null, // clear so previous room's code can't bleed into the next room
    });
  },

  sendCodeChange: (code) => {
    const { socket, roomId } = get();
    if (socket && roomId) {
      socket.emit('code-change', {
        roomId,
        code,
        userId: socket.id,
      });
    }
  },

  sendLanguageChange: (language) => {
    const { socket, roomId } = get();
    if (socket && roomId) {
      socket.emit('language-change', {
        roomId,
        language,
        userId: socket.id,
      });
    }
  },

  sendMessage: (message, userName) => {
    const { socket, roomId } = get();
    if (socket && roomId) {
      socket.emit('send-message', {
        roomId,
        message,
        userName,
      });
    }
  },

  sendCursorChange: (lineNumber, column) => {
    const { socket, roomId } = get();
    if (socket && roomId) {
      socket.emit('cursor-change', {
        roomId,
        position: { lineNumber, column },
        userId: socket.id,
      });
    }
  },
}));