'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { chatService } from '@/lib/chat-service';
import {
  Send,
  Paperclip,
  Smile,
  Mic,
  Camera,
  File,
  Search,
  Settings,
  Users,
  X,
  Check,
  Download,
  MessageSquare,
  User,
  Plus,
  Minimize2,
  CheckCheck,
  Maximize2
} from 'lucide-react';

interface Chat {
  id: string;
  name: string;
  type: 'private' | 'group';
  participants: string[];
  participantNames: Record<string, string>;
  lastMessage?: {
    content: string;
    senderId: string;
    senderName: string;
    timestamp: string;
    type: string;
  };
  unreadCount: Record<string, number>;
  settings: {
    readReceipts: boolean;
    typingIndicators: boolean;
    notifications: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'video' | 'audio';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  thumbnailUrl?: string;
  duration?: number;
  reactions: Record<string, string>;
  replyTo?: {
    messageId: string;
    content: string;
    senderName: string;
  };
  forwardedFrom?: {
    messageId: string;
    chatId: string;
    chatName: string;
    senderName: string;
  };
  readBy: string[];
  createdAt: string;
  updatedAt?: string;
  deleted?: boolean;
  edited?: boolean;
  timestamp?: { toDate: () => Date };
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
}

export default function ChatPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  // Load chats
  useEffect(() => {
    if (!user?.uid) return;

    const setupChats = async () => {
      try {
        const chatsData = await chatService.loadChats(user.uid);
        setChats(chatsData);
      } catch (error) {
        console.error('Error loading chats:', error);
      }
    };

    setupChats();
  }, [user]);

  // Load users
  useEffect(() => {
    const loadUsers = async () => {
      try {
        // TODO: Implement user loading when userService is available
        setUsers([]);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };

    loadUsers();
  }, []);

  // Load messages for selected chat
  useEffect(() => {
    if (!selectedChat?.id || !user?.uid) return;

    const setupMessages = async () => {
      try {
        const messagesData = await chatService.loadMessages(selectedChat.id);
        setMessages(messagesData);
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    setupMessages();
  }, [selectedChat, user]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const sendMessage = async () => {
    if (!user?.uid || !selectedChat?.id || !newMessage.trim()) return;

    const messageData = {
      chatId: selectedChat.id,
      senderId: user.uid,
      senderName: user.displayName || user.email || 'Unknown',
      content: newMessage,
      type: 'text' as const,
      reactions: {},
      readBy: [user.uid],
      replyTo: replyToMessage ? {
        messageId: replyToMessage.id,
        content: replyToMessage.content,
        senderName: replyToMessage.senderName
      } : undefined
    };

    await chatService.sendMessage(selectedChat.id, messageData);

    setNewMessage('');
    setReplyToMessage(null);
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!user?.uid || !selectedChat?.id) return;

    try {
      const fileData = await chatService.uploadFile(file, selectedChat.id);
      let type: 'image' | 'file' | 'video' = 'file';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';

      const messageData = {
        chatId: selectedChat.id,
        senderId: user.uid,
        senderName: user.displayName || user.email || 'Unknown',
        content: file.name,
        type: type as 'image' | 'file' | 'video',
        fileUrl: fileData.url,
        fileName: fileData.fileName,
        fileSize: fileData.fileSize,
        reactions: {},
        readBy: [user.uid]
      };

      await chatService.sendMessage(selectedChat.id, messageData);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleSendMessage = () => {
    if (!user?.uid || !selectedChat?.id || !newMessage.trim()) return;
    sendMessage();
  };

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Chat</h1>
          <p className="text-sm text-gray-600">Kommuniser med teamet</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            {isMinimized ? <Maximize2 className="h-5 w-5" /> : <Minimize2 className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Chat Content */}
      <div className="flex-1 flex">
        {/* Chat List */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <input
              type="text"
              placeholder="Søk i chat..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedChat?.id === chat.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {chat.type === 'group' ? 'G' : chat.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{chat.name}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {chat.lastMessage?.content || 'Ingen meldinger'}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {chat.lastMessage?.timestamp ? 
                      new Date(chat.lastMessage.timestamp).toLocaleTimeString('no-NO', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      }) : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {selectedChat.type === 'group' ? 'G' : selectedChat.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{selectedChat.name}</h3>
                    <p className="text-sm text-gray-500">
                      {selectedChat.type === 'group' ? 'Gruppechat' : 'Privat melding'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderId === user?.uid
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      {message.replyTo && (
                        <div className="text-xs opacity-75 mb-1">
                          Svar til: {message.replyTo.senderName}
                        </div>
                      )}
                      <p className="text-sm">{message.content}</p>
                      {message.fileUrl && (
                        <div className="mt-2">
                          <a
                            href={message.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs underline"
                          >
                            📎 Vedlegg
                          </a>
                        </div>
                      )}
                      <div className="text-xs opacity-75 mt-1">
                        {message.timestamp?.toDate().toLocaleTimeString('no-NO', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        {message.senderId === user?.uid && (
                          <span className="ml-2">
                            <CheckCheck className="h-3 w-3 inline" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Skriv en melding..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                  >
                    <Smile className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                  >
                    <Paperclip className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                  >
                    <Camera className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setIsRecording(!isRecording)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                  >
                    <Mic className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Velg en chat</h3>
                <p className="text-gray-500">Velg en chat fra listen for å starte å snakke</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        onChange={(e) => {
          const files = e.target.files;
          if (files) {
            Array.from(files).forEach(file => handleFileUpload(file));
          }
        }}
        className="hidden"
      />

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFileUpload(file);
          }
        }}
        className="hidden"
      />
    </div>
  );
} 