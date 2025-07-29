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
  CheckCheck
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

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Chat List Sidebar */}
      <div className={`w-80 bg-white border-r border-gray-200 flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">Chat</h1>
            <div className="flex space-x-2">
              <button
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <Plus className="h-5 w-5" />
              </button>
              <button
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <Users className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Søk i chat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.length > 0 ? (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedChat?.id === chat.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      {chat.type === 'group' ? (
                        <Users className="h-6 w-6 text-gray-600" />
                      ) : (
                        <span className="text-lg font-semibold text-gray-600">
                          {chat.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {chat.participants.some(p => users.find(u => u.id === p)?.status === 'online') && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {chat.name}
                      </h3>
                      {chat.lastMessage && (
                        <span className="text-xs text-gray-500">
                          {new Date(chat.lastMessage.timestamp).toLocaleTimeString('no-NO', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      )}
                    </div>
                    
                    {chat.lastMessage && (
                      <p className="text-sm text-gray-600 truncate">
                        {chat.lastMessage.senderName}: {chat.lastMessage.content}
                      </p>
                    )}
                    
                    {chat.unreadCount[user?.uid || ''] > 0 && (
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">
                          {chat.unreadCount[user?.uid || '']} uleste meldinger
                        </span>
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>Ingen chat funnet</p>
              <p className="text-sm">Start en ny chat for å begynne å snakke</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
                >
                  <X className="h-5 w-5" />
                </button>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    {selectedChat.type === 'group' ? (
                      <Users className="h-5 w-5 text-gray-600" />
                    ) : (
                      <span className="text-sm font-semibold text-gray-600">
                        {selectedChat.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedChat.name}
                    </h2>
                    {selectedChat.type === 'group' && (
                      <p className="text-sm text-gray-600">
                        {selectedChat.participants.length} medlemmer
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                >
                  <Settings className="h-5 w-5" />
                </button>
                
                <button
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                >
                  <Minimize2 className="h-5 w-5" />
                </button>
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
                <div className={`max-w-xs lg:max-w-md ${message.senderId === user?.uid ? 'order-2' : 'order-1'}`}>
                  {/* Reply */}
                  {message.replyTo && (
                    <div className="mb-1 p-2 bg-gray-100 rounded-lg text-xs">
                      <p className="font-semibold text-gray-700">{message.replyTo.senderName}</p>
                      <p className="text-gray-600">{message.replyTo.content}</p>
                    </div>
                  )}

                  {/* Message Content */}
                  <div className={`p-3 rounded-lg ${
                    message.senderId === user?.uid 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white border border-gray-200'
                  }`}>
                    {message.deleted ? (
                      <p className="text-gray-500 italic">This message was deleted</p>
                    ) : (
                      <>
                        {message.type === 'text' && (
                          <p className="text-sm">{message.content}</p>
                        )}
                        
                        {message.type === 'image' && (
                          <div>
                            <Image 
                              src={message.fileUrl || ''} 
                              alt="Shared image"
                              width={200}
                              height={200}
                              className="rounded-lg max-w-xs"
                            />
                            <p className="text-sm mt-1">{message.content}</p>
                          </div>
                        )}
                        
                        {message.type === 'file' && (
                          <div className="flex items-center space-x-2">
                            <File className="h-5 w-5" />
                            <div>
                              <p className="text-sm font-semibold">{message.fileName}</p>
                              <p className="text-xs text-gray-500">
                                {(message.fileSize || 0 / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <button className="text-blue-500 hover:text-blue-700">
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                        
                        {message.type === 'video' && (
                          <div>
                            <video 
                              src={message.fileUrl} 
                              controls
                              className="max-w-full rounded-lg"
                            />
                            <p className="text-sm mt-1">{message.content}</p>
                          </div>
                        )}
                        
                        {message.type === 'audio' && (
                          <div className="flex items-center space-x-2">
                            <audio src={message.fileUrl} controls className="h-8" />
                            <p className="text-sm">{message.content}</p>
                          </div>
                        )}

                        {message.edited && (
                          <p className="text-xs text-gray-500 mt-1">(edited)</p>
                        )}

                        {message.forwardedFrom && (
                          <p className="text-xs text-gray-500 mt-1">
                            Forwarded from {message.forwardedFrom.senderName}
                          </p>
                        )}

                        {/* Reactions */}
                        {Object.keys(message.reactions).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {Object.entries(message.reactions).map(([userId, emoji]) => (
                              <span key={userId} className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                                {emoji}
                              </span>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Message Info */}
                  <div className={`flex items-center space-x-2 mt-1 ${
                    message.senderId === user?.uid ? 'justify-end' : 'justify-start'
                  }`}>
                    <span className="text-xs text-gray-500">
                      {message.timestamp?.toDate().toLocaleTimeString('no-NO', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                    
                    {message.senderId === user?.uid && (
                      <>
                        {message.readBy.length > 1 ? (
                          <CheckCheck className="h-3 w-3 text-blue-500" />
                        ) : (
                          <Check className="h-3 w-3 text-gray-400" />
                        )}
                      </>
                    )}
                  </div>

                  {/* Message Actions */}
                  <div className={`flex items-center space-x-1 mt-1 ${
                    message.senderId === user?.uid ? 'justify-end' : 'justify-start'
                  }`}>
                    <button
                      onClick={() => chatService.addReaction(selectedChat.id, message.id, user?.uid || '', '👍')}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      👍
                    </button>
                    <button
                      onClick={() => chatService.addReaction(selectedChat.id, message.id, user?.uid || '', '❤️')}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      ❤️
                    </button>
                    <button
                      onClick={() => chatService.addReaction(selectedChat.id, message.id, user?.uid || '', '😂')}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      😂
                    </button>
                    
                    {message.senderId === user?.uid && (
                      <>
                        <button
                          onClick={() => setReplyToMessage(message)}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Reply
                        </button>
                        <button
                          onClick={() => {
                            const newContent = prompt('Edit message:', message.content);
                            if (newContent && newContent !== message.content) {
                              chatService.editMessage(selectedChat.id, message.id, newContent);
                            }
                          }}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => chatService.deleteMessage(selectedChat.id, message.id)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </>
                    )}
                    
                    <button
                      onClick={() => {
                        // setForwardMessage(message); // This state variable was removed
                        // setShowForwardModal(true); // This state variable was removed
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Forward
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="bg-white border-t border-gray-200 p-4">
            {/* Reply Preview */}
            {replyToMessage && (
              <div className="mb-3 p-2 bg-gray-100 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700">
                    Replying to {replyToMessage.senderName}: {replyToMessage.content}
                  </p>
                  <button
                    onClick={() => setReplyToMessage(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
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

              <div className="flex-1">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {isRecording ? (
                <button
                  onClick={() => setIsRecording(false)}
                  className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  <Mic className="h-5 w-5" />
                </button>
              ) : (
                <button
                  onClick={() => setIsRecording(true)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                >
                  <Mic className="h-5 w-5" />
                </button>
              )}

              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </button>
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
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Velg en chat</h3>
            <p className="text-gray-600">Velg en chat fra listen for å starte å snakke</p>
          </div>
        </div>
      )}
    </div>
  );
} 