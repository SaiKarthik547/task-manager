import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { messagesAPI, usersAPI } from '../lib/api';
import Layout from '../components/Layout';

export default function Messages() {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [conversations, setConversations] = useState<any[]>([]);
    const [activeConversation, setActiveConversation] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [users, setUsers] = useState<any[]>([]); // For new chat modal
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load conversations on mount
    useEffect(() => {
        loadConversations();
        loadUsers();
    }, []);

    // Listen for incoming messages
    useEffect(() => {
        if (!socket) return;

        socket.on('new_message', (message: any) => {
            // Update messages list if viewing this conversation
            if (activeConversation && message.conversationId === activeConversation.id) {
                setMessages(prev => [...prev, message]);
                scrollToBottom();
            }
            // Refresh conversation list to update "last message"
            loadConversations();
        });

        return () => {
            socket.off('new_message');
        };
    }, [socket, activeConversation]);

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadConversations = async () => {
        try {
            const res = await messagesAPI.getConversations();
            setConversations(res.data.conversations);
        } catch (error) {
            console.error('Failed to load conversations', error);
        }
    };

    const loadUsers = async () => {
        try {
            const res = await usersAPI.getAll();
            setUsers(res.data.users.filter((u: any) => u.id !== user?.id));
        } catch (error) {
            console.error('Failed to load users', error);
        }
    };

    const loadMessages = async (conversation: any) => {
        setActiveConversation(conversation);
        try {
            const res = await messagesAPI.getMessages(conversation.id);
            setMessages(res.data.messages);
            scrollToBottom();

            // Join socket room
            socket?.emit('join_conversation', { conversationId: conversation.id });
        } catch (error) {
            console.error('Failed to load messages', error);
        }
    };

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConversation || !socket) return;

        // Optimistic update
        const tempId = Date.now();
        const msg = {
            id: tempId,
            conversation_id: activeConversation.id,
            sender_id: user?.id,
            content_encrypted: newMessage, // In real app, encrypt here
            created_at: new Date().toISOString(),
            is_private: 0,
            sender_name: user?.username // Helper for display
        };

        // Emit via socket
        socket.emit('send_message', {
            conversationId: activeConversation.id,
            content: newMessage,
            isPrivate: false
        });

        setMessages(prev => [...prev, msg]);
        setNewMessage('');

        // Refresh list to update preview
        // In fully robust app, wait for ack
    };

    const startNewChat = async (recipientId: number) => {
        try {
            await messagesAPI.createConversation(recipientId);
            setShowNewChatModal(false);
            await loadConversations();
            // TODO: Select the new conversation automatically
        } catch (error) {
            console.error('Failed to create conversation', error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <Layout>
            <div className="flex h-[calc(100vh-8rem)] glass-card overflow-hidden">
                {/* Conversations List */}
                <div className="w-1/3 border-r border-gray-200 bg-white/50 backdrop-blur-sm flex flex-col">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">Messages</h2>
                        <button
                            onClick={() => setShowNewChatModal(true)}
                            className="p-2 hover:bg-gray-200 rounded-full transition"
                        >
                            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                    </div>
                    <div className="overflow-y-auto flex-1">
                        {conversations.map(conv => (
                            <div
                                key={conv.id}
                                onClick={() => loadMessages(conv)}
                                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-white/80 transition ${activeConversation?.id === conv.id ? 'bg-blue-50' : ''}`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                        {/* Needs logic to show OTHER participant's initial */}
                                        ?
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 truncate">Conversation #{conv.id}</p>
                                        <p className="text-sm text-gray-500 truncate">
                                            {conv.last_message || 'No messages yet'}
                                        </p>
                                    </div>
                                    {conv.last_message_at && (
                                        <span className="text-xs text-gray-400 whitespace-nowrap">
                                            {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-white/30">
                    {activeConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-gray-100 bg-white/60">
                                <h3 className="font-bold text-gray-800">Conversation #{activeConversation.id}</h3>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.map(msg => {
                                    const isOwn = msg.sender_id === user?.id;
                                    return (
                                        <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${isOwn
                                                ? 'bg-gradient-primary text-white rounded-br-none'
                                                : 'bg-white text-gray-800 rounded-bl-none'
                                                }`}>
                                                <p className="text-sm">{msg.content_encrypted}</p>
                                                <p className={`text-[10px] mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <form onSubmit={sendMessage} className="p-4 bg-white/80 border-t border-gray-100">
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 input"
                                    />
                                    <button type="submit" className="btn btn-primary px-6">
                                        <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-500">
                            <div className="text-center">
                                <div className="text-6xl mb-4">💬</div>
                                <p>Select a conversation to start messaging</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* New Chat Modal */}
            {showNewChatModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowNewChatModal(false)}>
                    <div className="glass-card w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4">New Message</h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {users.map(u => (
                                <button
                                    key={u.id}
                                    onClick={() => startNewChat(u.id)}
                                    className="w-full flex items-center p-3 hover:bg-gray-100 rounded-xl transition text-left"
                                >
                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3 font-bold">
                                        {u.full_name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{u.full_name}</p>
                                        <p className="text-xs text-gray-500">@{u.username}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setShowNewChatModal(false)} className="mt-4 btn btn-secondary w-full">Cancel</button>
                    </div>
                </div>
            )}
        </Layout>
    );
}
