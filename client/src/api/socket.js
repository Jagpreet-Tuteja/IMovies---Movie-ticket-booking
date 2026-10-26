import { io } from 'socket.io-client';

// In development this goes through the Vite proxy to the Express server
export const socket = io(import.meta.env.VITE_SOCKET_URL || undefined, { autoConnect: false });
