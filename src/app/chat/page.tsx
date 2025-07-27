'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { chatService, userService } from '@/lib/firebase-services';
import { Chat, Message, ChatType, MessageType } from '@/types';
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  Image as ImageIcon,
  Video,
  File,
  Mic,
  MoreVertical,
  Users,
  Search,
  Phone,
  Video as VideoIcon,
  Smile,
  Eye,
  Check,
  CheckCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ChatPage() {
  const { userProfile } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    loadChats();
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id);
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChats = async () => {
    try {
      setLoading(true);
      const userChats = await chatService.getChatsByUser(userProfile?.id || '');
      setChats(userChats);
    } catch (error) {
      console.error('Error loading chats:', error);
      toast.error('Kunne ikke laste chat');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      // Load all users for new chat creation
      const allUsers = await userService.getUsersByRole('employee');
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      const chatMessages = await chatService.getMessages(chatId);
      setMessages(chatMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Kunne ikke laste meldinger');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const messageData = {
        senderId: userProfile?.id || '',
        senderName: userProfile?.displayName || '',
        content: newMessage,
        type: MessageType.TEXT
      };

      await chatService.sendMessage(selectedChat.id, messageData);
      setNewMessage('');
      
      // Reload messages to get the new one
      loadMessages(selectedChat.id);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Kunne ikke sende melding');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredChats = chats.filter(chat => {
    const searchLower = searchTerm.toLowerCase();
    return chat.name?.toLowerCase().includes(searchLower) ||
           chat.lastMessage?.content.toLowerCase().includes(searchLower);
  });

  const getChatPreview = (chat: Chat) => {
    if (chat.lastMessage) {
      const content = chat.lastMessage.content;
      return content.length > 50 ? content.substring(0, 50) + '...' : content;
    }
    return 'Ingen meldinger ennå';
  };

  const getMessageTime = (timestamp: Date) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInHours = (now.getTime() - messageTime.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageTime.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });
    } else {
      return messageTime.toLocaleDateString('no-NO', { day: '2-digit', month: '2-digit' });
    }
  };

  const getReadStatus = (message: Message) => {
    if (message.senderId === userProfile?.id) {
      const readCount = message.readBy.length;
      const totalParticipants = selectedChat?.participants.length || 0;
      
      if (readCount === totalParticipants) {
        return <CheckCheck className="h-4 w-4 text-blue-500" />;
      } else if (readCount > 1) {
        return <CheckCheck className="h-4 w-4 text-gray-400" />;
      } else {
        return <Check className="h-4 w-4 text-gray-400" />;
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Chat List Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Chat</h2>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <MessageSquare className="h-5 w-5" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Søk i chat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedChat?.id === chat.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
                  {chat.type === ChatType.GROUP ? (
                    <Users className="h-6 w-6 text-white" />
                  ) : (
                    <span className="text-white font-medium">
                      {chat.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {chat.name || 'Ukjent bruker'}
                    </h3>
                    {chat.lastMessage && (
                      <span className="text-xs text-gray-500">
                        {getMessageTime(chat.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-500 truncate">
                    {getChatPreview(chat)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                    {selectedChat.type === ChatType.GROUP ? (
                      <Users className="h-5 w-5 text-white" />
                    ) : (
                      <span className="text-white font-medium">
                        {selectedChat.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {selectedChat.name || 'Ukjent bruker'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedChat.type === ChatType.GROUP ? 'Gruppe' : 'Direkte melding'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                    <Phone className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                    <VideoIcon className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === userProfile?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.senderId === userProfile?.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs opacity-75">
                        {message.senderName}
                      </span>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs opacity-75">
                          {getMessageTime(message.createdAt)}
                        </span>
                        {getReadStatus(message)}
                      </div>
                    </div>
                    
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
              
              {typingUsers.length > 0 && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-500 px-4 py-2 rounded-lg border border-gray-200">
                    <span className="text-sm italic">
                      {typingUsers.join(', ')} skriver...
                    </span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                  <Smile className="h-5 w-5" />
                </button>
                
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                  <Paperclip className="h-5 w-5" />
                </button>
                
                <div className="flex-1">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Skriv en melding..."
                    rows={1}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
                
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-5 w-5" />
                </button>
                
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                  <Mic className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Welcome Screen */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageSquare className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Velg en chat
              </h3>
              <p className="text-sm text-gray-500">
                Velg en chat fra listen til venstre for å starte å snakke
              </p>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal would go here */}
      {/* This is a placeholder for the modal component */}
    </div>
  );
} 