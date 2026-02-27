import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    onlineUsers: number[];
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const { user, isAuthenticated } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<number[]>([]);

    useEffect(() => {
        if (!isAuthenticated || !user) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        const token = localStorage.getItem('token');
        const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:8000', { // Use explicit URL for socket
            auth: { token },
            transports: ['websocket', 'polling'] // Fallback
        });

        newSocket.on('connect', () => {
            console.log('Socket connected');
            setIsConnected(true);
            newSocket.emit('authenticate', { token });
        });

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected');
            setIsConnected(false);
        });

        newSocket.on('authenticated', () => {
            console.log('Socket authenticated');
        });

        newSocket.on('user_online', (data: { userId: number }) => {
            setOnlineUsers(prev => [...new Set([...prev, data.userId])]);
        });

        newSocket.on('user_offline', (data: { userId: number }) => {
            setOnlineUsers(prev => prev.filter(id => id !== data.userId));
        });

        newSocket.on('notification_created', (data: any) => {
            console.log('New notification received:', data);
            // In a real app, we would update a notification count context here
            // or trigger a toast
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [isAuthenticated, user?.id]); // Re-connect if user changes

    return (
        <SocketContext.Provider value={{ socket, isConnected, onlineUsers }}>
            {children}
        </SocketContext.Provider>
    );
};
