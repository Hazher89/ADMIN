'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, 
  Paperclip, 
  Camera, 
  Image, 
  File, 
  Video, 
  Mic, 
  MoreVertical, 
  Search, 
  Plus, 
  Users, 
  Settings, 
  Bell, 
  BellOff,
  Check,
  CheckCheck,
  Eye,
  EyeOff,
  Smile,
  Phone,
  PhoneOff,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
  X,
  Edit,
  Trash2,
  UserPlus,
  UserMinus,
  Shield,
  Lock,
  Unlock,
  Archive,
  Pin,
  Star,
  Download,
  Share,
  Copy,
  Reply,
  Forward,
  Block,
  Report,
  MessageCircle
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, where, getDocs, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { chatService, Chat, ChatMessage, User } from '@/lib/chat-service';

export default function ChatPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [fileInput, setFileInput] = useState<HTMLInputElement | null>(null);
  const [cameraInput, setCameraInput] = useState<HTMLInputElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);
  const [forwardMessage, setForwardMessage] = useState<ChatMessage | null>(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load chats
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = chatService.loadChats(user.uid, (chats) => {
      setChats(chats);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // Load users
  useEffect(() => {
    chatService.loadUsers((users) => {
      setUsers(users);
    });
  }, []);

  // Load messages for selected chat
  useEffect(() => {
    if (!selectedChat?.id || !user?.uid) return;

    const unsubscribe = chatService.loadMessages(selectedChat.id, (messages) => {
      setMessages(messages);
      // Mark messages as read
      chatService.markMessagesAsRead(selectedChat.id, user.uid, messages);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [selectedChat, user]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const sendMessage = async () => {
    if (!user?.uid || !selectedChat?.id || !newMessage.trim()) return;

    await chatService.sendMessage(
      selectedChat.id,
      user.uid,
      user.displayName || user.email || 'Unknown',
      user.photoURL,
      newMessage,
      'text',
      undefined,
      undefined,
      undefined,
      replyToMessage
    );

    setNewMessage('');
    setReplyToMessage(null);
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!user?.uid || !selectedChat?.id) return;

    try {
      const fileUrl = await chatService.uploadFile(file);
      let type: 'image' | 'file' | 'video' = 'file';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';

      await chatService.sendMessage(
        selectedChat.id,
        user.uid,
        user.displayName || user.email || 'Unknown',
        user.photoURL,
        file.name,
        type,
        fileUrl,
        file.name,
        file.size
      );
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  // Create new chat
  const createNewChat = async (participantId: string) => {
    if (!user?.uid) return;

    const participant = users.find(u => u.id === participantId);
    if (!participant) return;

    const chatId = await chatService.createChat(
      participant.name,
      [user.uid, participantId],
      {
        [user.uid]: user.displayName || user.email || 'Unknown',
        [participantId]: participant.name
      },
      {
        [user.uid]: user.photoURL,
        [participantId]: participant.avatar
      }
    );

    if (chatId) {
      const newChat = chats.find(c => c.id === chatId);
      if (newChat) {
        setSelectedChat(newChat);
      }
    }
    setShowNewChatModal(false);
  };

  // Create group chat
  const createGroupChat = async () => {
    if (!user?.uid || !groupName.trim() || selectedUsers.length === 0) return;

    const groupParticipants = [user.uid, ...selectedUsers];
    const participantNames: { [key: string]: string } = {};
    const participantAvatars: { [key: string]: string } = {};

    // Add current user
    participantNames[user.uid] = user.displayName || user.email || 'Unknown';
    participantAvatars[user.uid] = user.photoURL;

    // Add selected users
    selectedUsers.forEach(userId => {
      const userData = users.find(u => u.id === userId);
      if (userData) {
        participantNames[userId] = userData.name;
        participantAvatars[userId] = userData.avatar || '';
      }
    });

    const chatId = await chatService.createChat(
      groupName,
      groupParticipants,
      participantNames,
      participantAvatars,
      true,
      {
        description: groupDescription,
        createdBy: user.uid,
        createdAt: new Date(),
        admins: [user.uid],
        pinnedMessages: []
      }
    );

    if (chatId) {
      const newChat = chats.find(c => c.id === chatId);
      if (newChat) {
        setSelectedChat(newChat);
      }
    }
    setShowGroupModal(false);
    setGroupName('');
    setGroupDescription('');
    setSelectedUsers([]);
  };

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    user.id !== user?.uid
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Chat List Sidebar */}
      <div className={`w-80 bg-white border-r border-gray-200 flex flex-col ${isMinimized ? 'hidden' : ''}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">Chat</h1>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowNewChatModal(true)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <Plus className="h-5 w-5" />
              </button>
              <button
                onClick={() => setShowGroupModal(true)}
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
                      {chat.isGroup ? (
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
                          {new Date(chat.lastMessage.timestamp?.toDate()).toLocaleTimeString('no-NO', { 
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
              <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
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
                  onClick={() => setIsMinimized(false)}
                  className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
                >
                  <X className="h-5 w-5" />
                </button>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    {selectedChat.isGroup ? (
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
                    {selectedChat.isGroup && (
                      <p className="text-sm text-gray-600">
                        {selectedChat.participants.length} medlemmer
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowChatSettings(true)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                >
                  <Settings className="h-5 w-5" />
                </button>
                
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                >
                  {isMinimized ? <Maximize2 className="h-5 w-5" /> : <Minimize2 className="h-5 w-5" />}
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
                  {message.repliedTo && (
                    <div className="mb-1 p-2 bg-gray-100 rounded-lg text-xs">
                      <p className="font-semibold text-gray-700">{message.repliedTo.senderName}</p>
                      <p className="text-gray-600">{message.repliedTo.content}</p>
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
                            <img 
                              src={message.fileUrl} 
                              alt="Shared image"
                              className="max-w-full rounded-lg"
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
                        setForwardMessage(message);
                        setShowForwardModal(true);
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
            <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Velg en chat</h3>
            <p className="text-gray-600">Velg en chat fra listen for å starte å snakke</p>
          </div>
        </div>
      )}
    </div>
  );
} 