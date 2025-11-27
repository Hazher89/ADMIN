'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { chatService, Chat, ChatMessage, User } from '@/lib/chat-service';
import { 
  Search, Filter, MessageSquare, Users, Send, MoreHorizontal, 
  Paperclip, Smile, Phone, Video, Eye, Edit, Trash2, Archive,
  Pin, Bell, BellOff, UserPlus, Settings, Image as ImageIcon, File, 
  Mic, Copy, Forward, Reply, X, Check, CheckCheck, Clock, 
  Download, Share2, AtSign, Hash, Star, Flag, Minimize2, Maximize2,
  Plus, ChevronDown, ChevronUp, AlertCircle, Info, Volume2, VolumeX
} from 'lucide-react';
import { onSnapshot, collection, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Emoji picker data
const EMOJI_CATEGORIES = ['😀', '😂', '❤️', '👍', '🎉', '🔥', '💯', '✨'];
const COMMON_EMOJIS = ['😀', '😂', '❤️', '👍', '😍', '🔥', '💯', '✨', '😊', '🥰', '😎', '🤔', '😢', '🙏', '👏', '🎉', '🎊', '✅', '❌', '⭐'];

export default function ChatPage() {
  const { userProfile } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showChatList, setShowChatList] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageSearchTerm, setMessageSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<ChatMessage | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [showGroupMembers, setShowGroupMembers] = useState(false);
  const [showSearchMessages, setShowSearchMessages] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [newChatType, setNewChatType] = useState<'private' | 'group'>('private');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pinnedMessages, setPinnedMessages] = useState<ChatMessage[]>([]);
  const [messageMenuOpen, setMessageMenuOpen] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeMessagesRef = useRef<(() => void) | null>(null);
  const unsubscribeChatsRef = useRef<(() => void) | null>(null);

  // Real-time listeners
  useEffect(() => {
    if (!userProfile?.id || !userProfile?.companyId || !db) return;

    // Listen to chats in real-time
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userProfile.id)
    );

    const unsubscribeChats = onSnapshot(chatsQuery, (snapshot) => {
      const chatsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Chat[];
      chatsData.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setChats(chatsData);
    });

    unsubscribeChatsRef.current = unsubscribeChats;

    return () => {
      if (unsubscribeChats) unsubscribeChats();
      if (unsubscribeMessagesRef.current) unsubscribeMessagesRef.current();
    };
  }, [userProfile?.id, userProfile?.companyId]);

  // Listen to messages in real-time when chat is selected
  useEffect(() => {
    if (!selectedChat?.id || !db) return;

    const messagesQuery = query(
      collection(db, `chats/${selectedChat.id}/messages`),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt || new Date().toISOString()
      })) as ChatMessage[];
      
      messagesData.reverse(); // Show oldest first
      setMessages(messagesData);
      
      // Mark messages as read
      if (userProfile?.id) {
        const unreadMessages = messagesData.filter(msg => 
          !msg.readBy?.includes(userProfile.id) && msg.senderId !== userProfile.id
        );
        if (unreadMessages.length > 0) {
          chatService.markMessagesAsRead(
            selectedChat.id, 
            userProfile.id, 
            unreadMessages.map(m => m.id)
          );
        }
      }

      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    unsubscribeMessagesRef.current = unsubscribeMessages;

    return () => {
      if (unsubscribeMessages) unsubscribeMessages();
    };
  }, [selectedChat?.id, userProfile?.id]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowChatList(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (userProfile?.id && userProfile?.companyId) {
      loadData();
    }
  }, [userProfile?.id, userProfile?.companyId]);

  useEffect(() => {
    if (isMobile && selectedChat) {
      setShowChatList(false);
    } else if (!isMobile) {
      setShowChatList(true);
    }
  }, [selectedChat, isMobile]);

  const loadData = async () => {
    if (!userProfile?.id || !userProfile?.companyId) return;

    try {
      setLoading(true);
      
      const [chatsData, usersData] = await Promise.all([
        chatService.loadChats(userProfile.id),
        chatService.loadUsers(userProfile.companyId)
      ]);
      
      setChats(chatsData);
      setUsers(usersData);
      
      // Load online status (simplified - in production, use presence system)
      const onlineSet = new Set<string>();
      usersData.forEach(user => {
        if (user.status === 'online') {
          onlineSet.add(user.id);
        }
      });
      setOnlineUsers(onlineSet);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChatSelect = async (chat: Chat) => {
    setSelectedChat(chat);
    setReplyingTo(null);
    setEditingMessage(null);
    setMessageSearchTerm('');
    setShowSearchMessages(false);
    
    // Load pinned messages
    if (chat.id) {
      // This would load pinned messages - implement as needed
      setPinnedMessages([]);
    }
  };

  const handleTyping = useCallback(() => {
    if (!selectedChat || !userProfile?.id || isTyping) return;
    
    setIsTyping(true);
    // In production, emit typing event to Firestore
    // For now, just handle locally
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      // Stop typing indicator
    }, 3000);
  }, [selectedChat, userProfile?.id, isTyping]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !userProfile?.id) return;

    try {
      const messageData = {
        chatId: selectedChat.id,
        senderId: userProfile.id,
        senderName: userProfile.displayName || 'Ukjent',
        content: newMessage.trim(),
        type: 'text' as const,
        reactions: {},
        readBy: [userProfile.id],
        replyTo: replyingTo ? {
          messageId: replyingTo.id,
          content: replyingTo.content.substring(0, 50),
          senderName: replyingTo.senderName
        } : undefined
      };

      await chatService.sendMessage(selectedChat.id, messageData);
      setNewMessage('');
      setReplyingTo(null);
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Feil ved sending av melding');
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!selectedChat || !userProfile?.id) return;

    setUploadingFile(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 20, 90));
      }, 200);

      const { url, fileName, fileSize } = await chatService.uploadFile(file, selectedChat.id);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      const fileType = file.type.startsWith('image/') ? 'image' : 
                       file.type.startsWith('video/') ? 'video' :
                       file.type.startsWith('audio/') ? 'audio' : 'file';

      const messageData = {
        chatId: selectedChat.id,
        senderId: userProfile.id,
        senderName: userProfile.displayName || 'Ukjent',
        content: fileType === 'image' ? '📷 Bilde' : fileType === 'video' ? '🎥 Video' : '📎 Fil',
        type: fileType as 'text' | 'image' | 'file' | 'video' | 'audio',
        fileUrl: url,
        fileName: fileName,
        fileSize: fileSize,
        reactions: {},
        readBy: [userProfile.id]
      };

      await chatService.sendMessage(selectedChat.id, messageData);
      
      setTimeout(() => {
        setUploadingFile(false);
        setUploadProgress(0);
        setShowFilePicker(false);
      }, 500);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Feil ved opplasting av fil');
      setUploadingFile(false);
      setUploadProgress(0);
    }
  };

  const editMessage = async (messageId: string) => {
    if (!selectedChat || !editContent.trim()) return;

    try {
      await chatService.editMessage(selectedChat.id, messageId, editContent.trim());
      setEditingMessage(null);
      setEditContent('');
    } catch (error) {
      console.error('Error editing message:', error);
      alert('Feil ved redigering av melding');
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!selectedChat) return;
    if (!confirm('Er du sikker på at du vil slette denne meldingen?')) return;

    try {
      await chatService.deleteMessage(selectedChat.id, messageId);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    if (!selectedChat || !userProfile?.id) return;

    try {
      await chatService.addReaction(selectedChat.id, messageId, userProfile.id, emoji);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const forwardMessage = async (messageId: string, toChatId: string) => {
    if (!selectedChat || !userProfile?.id) return;

    try {
      const message = messages.find(m => m.id === messageId);
      if (message) {
        await chatService.forwardMessage(
          messageId,
          selectedChat.id,
          toChatId,
          userProfile.id,
          userProfile.displayName || 'Ukjent'
        );
        setForwardingMessage(null);
      }
    } catch (error) {
      console.error('Error forwarding message:', error);
      alert('Feil ved videresending av melding');
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    // Show toast notification (implement as needed)
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInMinutes < 1) return 'Nå';
    if (diffInMinutes < 60) return `${diffInMinutes}m siden`;
    if (diffInHours < 24) return `${diffInHours}t siden`;
    if (diffInDays < 7) return `${diffInDays}d siden`;
    
    return date.toLocaleDateString('no-NO', { day: 'numeric', month: 'short' });
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('no-NO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const shouldShowDateSeparator = (currentMsg: ChatMessage, previousMsg: ChatMessage | null) => {
    if (!previousMsg) return true;
    const currentDate = new Date(currentMsg.createdAt).toDateString();
    const previousDate = new Date(previousMsg.createdAt).toDateString();
    return currentDate !== previousDate;
  };

  const getMessageStatus = (message: ChatMessage) => {
    if (!userProfile?.id || message.senderId !== userProfile.id) return null;
    
    if (message.readBy?.length > 1) {
      return <CheckCheck size={14} style={{ color: '#3b82f6' }} />;
    } else if (message.readBy?.includes(userProfile.id)) {
      return <CheckCheck size={14} style={{ color: '#9ca3af' }} />;
    } else {
      return <Check size={14} style={{ color: '#9ca3af' }} />;
    }
  };

  const filteredChats = chats.filter(chat => {
    const matchesSearch = (chat.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (chat.lastMessage?.content?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredMessages = messages.filter(msg => {
    if (!messageSearchTerm) return true;
    return (msg.content || '').toLowerCase().includes(messageSearchTerm.toLowerCase()) ||
           (msg.senderName || '').toLowerCase().includes(messageSearchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <div style={{ fontSize: '1.125rem', color: 'var(--gray-500)' }}>Laster chat...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      height: isMobile ? 'calc(100vh - 60px)' : 'calc(100vh - 80px)',
      background: 'var(--background-color)',
      width: '100%',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Chat List Sidebar */}
      <div style={{
        width: isMobile ? '100%' : '350px',
        background: 'var(--card-background)',
        borderRight: isMobile ? 'none' : '1px solid var(--border-color)',
        display: isMobile ? (showChatList ? 'flex' : 'none') : 'flex',
        flexDirection: 'column',
        height: '100%',
        position: isMobile ? 'absolute' : 'relative',
        zIndex: isMobile ? 100 : 'auto',
        left: 0,
        top: 0
      }}>
        <div style={{
          padding: isMobile ? '0.75rem' : '1rem',
          borderBottom: '0.5px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{ 
            fontSize: isMobile ? '1.125rem' : '1.25rem', 
            fontWeight: 600, 
            color: 'var(--text-color)',
            margin: 0
          }}>
            💬 Chat
          </h2>
          <div style={{ display: 'flex', gap: isMobile ? '0.375rem' : '0.5rem' }}>
            <button
              onClick={() => setShowNewChat(true)}
              style={{
                padding: isMobile ? '0.625rem' : '0.5rem',
                background: 'var(--gray-100)',
                border: 'none',
                borderRadius: isMobile ? '0.625rem' : '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: isMobile ? '44px' : undefined,
                minHeight: isMobile ? '44px' : undefined
              }}
              title="Ny chat"
            >
              <MessageSquare size={isMobile ? 20 : 18} style={{ color: 'var(--text-color)' }} />
            </button>
            <button 
              style={{
                padding: isMobile ? '0.625rem' : '0.5rem',
                background: 'var(--gray-100)',
                border: 'none',
                borderRadius: isMobile ? '0.625rem' : '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: isMobile ? '44px' : undefined,
                minHeight: isMobile ? '44px' : undefined
              }}
              title="Innstillinger"
            >
              <Settings size={isMobile ? 20 : 18} style={{ color: 'var(--text-color)' }} />
            </button>
          </div>
        </div>

        <div style={{
          padding: isMobile ? '0.625rem 0.75rem' : '0.75rem',
          borderBottom: '0.5px solid var(--border-color)'
        }}>
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Search size={isMobile ? 18 : 16} style={{ 
              position: 'absolute', 
              left: isMobile ? '0.875rem' : '12px', 
              color: 'var(--gray-400)' 
            }} />
            <input
              type="text"
              placeholder="Søk i chat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: isMobile ? '0.875rem 0.875rem 0.875rem 2.75rem' : '0.5rem 0.5rem 0.5rem 2.5rem',
                border: '1px solid var(--border-color)',
                borderRadius: isMobile ? '0.5rem' : '8px',
                fontSize: isMobile ? '16px' : '0.875rem',
                background: 'var(--card-background)',
                color: 'var(--text-color)'
              }}
            />
          </div>
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.5rem'
        }}>
          {filteredChats.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--gray-500)',
              textAlign: 'center',
              padding: '2rem'
            }}>
              <MessageSquare size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p style={{ margin: 0 }}>Ingen chat funnet</p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
                Start en ny samtale!
              </p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleChatSelect(chat)}
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: selectedChat?.id === chat.id ? 'var(--primary)' : 'transparent',
                  color: selectedChat?.id === chat.id ? 'white' : 'var(--text-color)',
                  marginBottom: '0.25rem',
                  display: 'flex',
                  gap: '0.75rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (selectedChat?.id !== chat.id) {
                    e.currentTarget.style.background = 'var(--gray-100)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedChat?.id !== chat.id) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: selectedChat?.id === chat.id ? 'rgba(255,255,255,0.2)' : 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: selectedChat?.id === chat.id ? 'white' : 'white',
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  flexShrink: 0
                }}>
                  {chat.type === 'group' ? (
                    <Users size={24} />
                  ) : (
                    chat.name?.charAt(0)?.toUpperCase() || 'U'
                  )}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.25rem'
                  }}>
                    <div style={{
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {chat.name || 'Ukjent chat'}
                    </div>
                    {chat.lastMessage && (
                      <span style={{
                        fontSize: '0.75rem',
                        opacity: 0.7
                      }}>
                        {formatDate(chat.lastMessage.timestamp)}
                      </span>
                    )}
                  </div>
                  {chat.lastMessage && (
                    <div style={{
                      fontSize: '0.75rem',
                      opacity: 0.8,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <span>{(chat.lastMessage.senderName || '') === userProfile?.displayName ? 'Du: ' : ''}</span>
                      <span>{chat.lastMessage.content}</span>
                    </div>
                  )}
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: '0.25rem'
                }}>
                  {chat.unreadCount[userProfile?.id || ''] > 0 && (
                    <span style={{
                      background: selectedChat?.id === chat.id ? 'rgba(255,255,255,0.3)' : 'var(--primary)',
                      color: 'white',
                      borderRadius: '12px',
                      padding: '0.125rem 0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      minWidth: '20px',
                      textAlign: 'center'
                    }}>
                      {chat.unreadCount[userProfile?.id || '']}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Messages Area */}
      <div style={{
        flex: 1,
        display: isMobile ? (showChatList ? 'none' : 'flex') : 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--card-background)',
        width: isMobile ? '100%' : undefined
      }}>
        {selectedChat ? (
          <>
            {/* Messages Header */}
            <div style={{
              padding: isMobile ? '0.75rem' : '1rem 1.5rem',
              borderBottom: '0.5px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--card-background)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '0.75rem', flex: 1, minWidth: 0 }}>
                {isMobile && (
                  <button
                    onClick={() => {
                      setShowChatList(true);
                      setSelectedChat(null);
                    }}
                    style={{
                      padding: '0.5rem',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '44px',
                      minHeight: '44px',
                      flexShrink: 0
                    }}
                  >
                    <X size={20} style={{ color: 'var(--text-color)' }} />
                  </button>
                )}
                <div style={{
                  width: isMobile ? '36px' : '40px',
                  height: isMobile ? '36px' : '40px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: isMobile ? '0.875rem' : '1rem',
                  fontWeight: '600',
                  flexShrink: 0
                }}>
                  {selectedChat.type === 'group' ? (
                    <Users size={isMobile ? 18 : 20} />
                  ) : (
                    selectedChat.name?.charAt(0)?.toUpperCase() || 'U'
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ 
                    fontSize: isMobile ? '0.9375rem' : '1rem', 
                    fontWeight: 600, 
                    color: 'var(--text-color)',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {selectedChat.name || 'Ukjent chat'}
                  </h3>
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--gray-500)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    {selectedChat.type === 'group' ? (
                      <>
                        <span>{selectedChat.participants.length} medlemmer</span>
                        {typingUsers.size > 0 && (
                          <span style={{ color: 'var(--primary)' }}>
                            {Array.from(typingUsers).map(id => {
                              const user = users.find(u => u.id === id);
                              return user?.name || 'Noen';
                            }).join(', ')} skriver...
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        {onlineUsers.has(selectedChat.participants.find(id => id !== userProfile?.id) || '') ? (
                          <span style={{ color: 'var(--success)' }}>● Online</span>
                        ) : (
                          <span>Offline</span>
                        )}
                        {typingUsers.size > 0 && (
                          <span style={{ color: 'var(--primary)' }}>skriver...</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: isMobile ? '0.375rem' : '0.5rem', flexShrink: 0 }}>
                {!isMobile && (
                <button
                  onClick={() => setShowSearchMessages(!showSearchMessages)}
                  style={{
                    padding: '0.5rem',
                    background: 'var(--gray-100)',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Søk i meldinger"
                >
                  <Search size={18} style={{ color: 'var(--text-color)' }} />
                </button>
                )}
                {selectedChat.type === 'group' && !isMobile && (
                  <button
                    onClick={() => setShowGroupMembers(true)}
                    style={{
                      padding: '0.5rem',
                      background: 'var(--gray-100)',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Gruppemedlemmer"
                  >
                    <Users size={18} style={{ color: 'var(--text-color)' }} />
                  </button>
                )}
                {!isMobile && (
                <button
                  onClick={() => setShowChatSettings(true)}
                  style={{
                    padding: '0.5rem',
                    background: 'var(--gray-100)',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Chat-innstillinger"
                >
                  <MoreHorizontal size={18} style={{ color: 'var(--text-color)' }} />
                </button>
                )}
              </div>
            </div>

            {/* Message Search Bar */}
            {showSearchMessages && (
              <div style={{
                padding: '0.75rem 1.5rem',
                borderBottom: '1px solid var(--border-color)',
                background: 'var(--gray-50)'
              }}>
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <Search size={16} style={{ 
                    position: 'absolute', 
                    left: '12px', 
                    color: 'var(--gray-400)' 
                  }} />
                  <input
                    type="text"
                    placeholder="Søk i meldinger..."
                    value={messageSearchTerm}
                    onChange={(e) => setMessageSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.5rem 0.5rem 2.5rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)'
                    }}
                  />
                  {messageSearchTerm && (
                    <button
                      onClick={() => setMessageSearchTerm('')}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.25rem'
                      }}
                    >
                      <X size={16} style={{ color: 'var(--gray-400)' }} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Messages Container */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              {filteredMessages.length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'var(--gray-500)',
                  textAlign: 'center'
                }}>
                  <MessageSquare size={64} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>Ingen meldinger ennå</h3>
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>Start en samtale!</p>
                </div>
              ) : (
                <>
                  {filteredMessages.map((message, index) => {
                    const previousMessage = index > 0 ? filteredMessages[index - 1] : null;
                    const showDateSeparator = shouldShowDateSeparator(message, previousMessage);
                    const isOwnMessage = message.senderId === userProfile?.id;
                    const showSenderName = !isOwnMessage && (
                      index === 0 || filteredMessages[index - 1].senderId !== message.senderId
                    );

                    return (
                      <React.Fragment key={message.id}>
                        {showDateSeparator && (
                          <div style={{
                            textAlign: 'center',
                            margin: '1rem 0',
                            fontSize: '0.75rem',
                            color: 'var(--gray-500)',
                            fontWeight: '500'
                          }}>
                            {new Date(message.createdAt).toLocaleDateString('no-NO', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </div>
                        )}
                        
                        {editingMessage === message.id ? (
                          <div style={{
                            background: 'var(--gray-100)',
                            borderRadius: '12px',
                            padding: '0.75rem',
                            marginLeft: isOwnMessage ? 'auto' : '0',
                            marginRight: isOwnMessage ? '0' : 'auto',
                            maxWidth: '70%'
                          }}>
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                                background: 'var(--card-background)',
                                color: 'var(--text-color)',
                                resize: 'vertical',
                                minHeight: '60px'
                              }}
                              autoFocus
                            />
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                              <button
                                onClick={() => editMessage(message.id)}
                                style={{
                                  padding: '0.375rem 0.75rem',
                                  background: 'var(--primary)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  cursor: 'pointer'
                                }}
                              >
                                Lagre
                              </button>
                              <button
                                onClick={() => {
                                  setEditingMessage(null);
                                  setEditContent('');
                                }}
                                style={{
                                  padding: '0.375rem 0.75rem',
                                  background: 'var(--gray-200)',
                                  color: 'var(--text-color)',
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  cursor: 'pointer'
                                }}
                              >
                                Avbryt
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
                              marginBottom: showSenderName ? '0.25rem' : '0.125rem',
                              position: 'relative'
                            }}
                            onMouseEnter={() => setMessageMenuOpen(message.id)}
                            onMouseLeave={() => setMessageMenuOpen(null)}
                          >
                            {/* Reply Preview */}
                            {message.replyTo && (
                              <div style={{
                                background: 'var(--gray-100)',
                                borderLeft: '3px solid var(--primary)',
                                borderRadius: '6px',
                                padding: '0.5rem',
                                marginBottom: '0.5rem',
                                fontSize: '0.75rem',
                                maxWidth: '100%'
                              }}>
                                <div style={{ fontWeight: '600', color: 'var(--primary)', marginBottom: '0.25rem' }}>
                                  {message.replyTo.senderName || 'Ukjent'}
                                </div>
                                <div style={{ color: 'var(--gray-600)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {message.replyTo.content}
                                </div>
                              </div>
                            )}

                            <div style={{
                              display: 'flex',
                              alignItems: 'flex-end',
                              gap: '0.5rem',
                              maxWidth: '70%',
                              flexDirection: isOwnMessage ? 'row-reverse' : 'row'
                            }}>
                              {!isOwnMessage && (
                                <div style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  background: 'var(--primary)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontSize: '0.875rem',
                                  fontWeight: '600',
                                  flexShrink: 0,
                                  opacity: showSenderName ? 1 : 0
                                }}>
                                  {(message.senderName || 'U').charAt(0).toUpperCase()}
                                </div>
                              )}
                              
                              <div style={{
                                background: isOwnMessage ? 'var(--primary)' : 'var(--gray-100)',
                                color: isOwnMessage ? 'white' : 'var(--text-color)',
                                borderRadius: '12px',
                                padding: '0.75rem 1rem',
                                position: 'relative',
                                wordWrap: 'break-word',
                                maxWidth: '100%'
                              }}>
                                {showSenderName && !isOwnMessage && (
                                  <div style={{
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    marginBottom: '0.25rem',
                                    opacity: 0.9
                                  }}>
                                    {message.senderName || 'Ukjent'}
                                  </div>
                                )}

                                {/* File Message */}
                                {message.type !== 'text' && (
                                  <div style={{ marginBottom: '0.5rem' }}>
                                    {message.type === 'image' && message.fileUrl ? (
                                      <img 
                                        src={message.fileUrl} 
                                        alt={message.content}
                                        style={{
                                          maxWidth: '100%',
                                          borderRadius: '8px',
                                          maxHeight: '300px',
                                          objectFit: 'cover'
                                        }}
                                        onClick={() => window.open(message.fileUrl, '_blank')}
                                      />
                                    ) : message.type === 'file' && message.fileUrl ? (
                                      <a
                                        href={message.fileUrl}
                                        download={message.fileName}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.5rem',
                                          padding: '0.75rem',
                                          background: isOwnMessage ? 'rgba(255,255,255,0.2)' : 'var(--gray-200)',
                                          borderRadius: '8px',
                                          textDecoration: 'none',
                                          color: isOwnMessage ? 'white' : 'var(--text-color)'
                                        }}
                                      >
                                        <File size={20} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div style={{ fontWeight: '600', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {message.fileName}
                                          </div>
                                          {message.fileSize && (
                                            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                                              {(message.fileSize / 1024).toFixed(1)} KB
                                            </div>
                                          )}
                                        </div>
                                        <Download size={18} />
                                      </a>
                                    ) : null}
                                  </div>
                                )}

                                <div style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
                                  {message.content}
                                </div>

                                {/* Reactions */}
                                {Object.keys(message.reactions || {}).length > 0 && (
                                  <div style={{
                                    display: 'flex',
                                    gap: '0.25rem',
                                    marginTop: '0.5rem',
                                    flexWrap: 'wrap'
                                  }}>
                                    {Object.entries(message.reactions).map(([userId, emoji]) => (
                                      <span
                                        key={userId}
                                        style={{
                                          background: isOwnMessage ? 'rgba(255,255,255,0.2)' : 'var(--gray-200)',
                                          borderRadius: '12px',
                                          padding: '0.25rem 0.5rem',
                                          fontSize: '0.75rem',
                                          cursor: 'pointer'
                                        }}
                                        onClick={() => {
                                          if (userId === userProfile?.id) {
                                            // Remove reaction
                                            addReaction(message.id, '');
                                          } else {
                                            addReaction(message.id, emoji);
                                          }
                                        }}
                                      >
                                        {emoji}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  marginTop: '0.5rem',
                                  fontSize: '0.75rem',
                                  opacity: 0.7,
                                  justifyContent: isOwnMessage ? 'flex-end' : 'flex-start'
                                }}>
                                  <span>{formatMessageTime(message.createdAt)}</span>
                                  {isOwnMessage && getMessageStatus(message)}
                                </div>
                              </div>

                              {/* Message Actions Menu */}
                              {messageMenuOpen === message.id && (
                                <div style={{
                                  position: 'absolute',
                                  top: '0',
                                  [isOwnMessage ? 'right' : 'left']: '100%',
                                  marginLeft: isOwnMessage ? '0' : '0.5rem',
                                  marginRight: isOwnMessage ? '0.5rem' : '0',
                                  background: 'var(--card-background)',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: '8px',
                                  boxShadow: 'var(--shadow-lg)',
                                  padding: '0.25rem',
                                  zIndex: 100,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.125rem',
                                  minWidth: '120px'
                                }}>
                                  <button
                                    onClick={() => {
                                      setReplyingTo(message);
                                      messageInputRef.current?.focus();
                                    }}
                                    style={{
                                      padding: '0.5rem',
                                      background: 'transparent',
                                      border: 'none',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      fontSize: '0.875rem',
                                      color: 'var(--text-color)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      textAlign: 'left'
                                    }}
                                  >
                                    <Reply size={14} />
                                    Svar
                                  </button>
                                  <button
                                    onClick={() => {
                                      setForwardingMessage(message);
                                    }}
                                    style={{
                                      padding: '0.5rem',
                                      background: 'transparent',
                                      border: 'none',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      fontSize: '0.875rem',
                                      color: 'var(--text-color)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      textAlign: 'left'
                                    }}
                                  >
                                    <Forward size={14} />
                                    Videresend
                                  </button>
                                  <button
                                    onClick={() => copyMessage(message.content)}
                                    style={{
                                      padding: '0.5rem',
                                      background: 'transparent',
                                      border: 'none',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      fontSize: '0.875rem',
                                      color: 'var(--text-color)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      textAlign: 'left'
                                    }}
                                  >
                                    <Copy size={14} />
                                    Kopier
                                  </button>
                                  {isOwnMessage && (
                                    <>
                                      <button
                                        onClick={() => {
                                          setEditingMessage(message.id);
                                          setEditContent(message.content);
                                        }}
                                        style={{
                                          padding: '0.5rem',
                                          background: 'transparent',
                                          border: 'none',
                                          borderRadius: '6px',
                                          cursor: 'pointer',
                                          fontSize: '0.875rem',
                                          color: 'var(--text-color)',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.5rem',
                                          textAlign: 'left'
                                        }}
                                      >
                                        <Edit size={14} />
                                        Rediger
                                      </button>
                                      <button
                                        onClick={() => deleteMessage(message.id)}
                                        style={{
                                          padding: '0.5rem',
                                          background: 'transparent',
                                          border: 'none',
                                          borderRadius: '6px',
                                          cursor: 'pointer',
                                          fontSize: '0.875rem',
                                          color: 'var(--danger)',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.5rem',
                                          textAlign: 'left'
                                        }}
                                      >
                                        <Trash2 size={14} />
                                        Slett
                                      </button>
                                    </>
                                  )}
                                  <div style={{
                                    borderTop: '1px solid var(--border-color)',
                                    margin: '0.25rem 0',
                                    paddingTop: '0.25rem'
                                  }}>
                                    <div style={{
                                      padding: '0.5rem',
                                      fontSize: '0.75rem',
                                      color: 'var(--gray-500)',
                                      fontWeight: '600',
                                      marginBottom: '0.25rem'
                                    }}>
                                      Reager
                                    </div>
                                    <div style={{
                                      display: 'flex',
                                      gap: '0.25rem',
                                      flexWrap: 'wrap'
                                    }}>
                                      {COMMON_EMOJIS.slice(0, 6).map(emoji => (
                                        <button
                                          key={emoji}
                                          onClick={() => {
                                            addReaction(message.id, emoji);
                                            setMessageMenuOpen(null);
                                          }}
                                          style={{
                                            background: 'transparent',
                                            border: 'none',
                                            fontSize: '1.25rem',
                                            cursor: 'pointer',
                                            padding: '0.25rem',
                                            borderRadius: '4px'
                                          }}
                                        >
                                          {emoji}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Reply Preview */}
            {replyingTo && (
              <div style={{
                padding: '0.75rem 1.5rem',
                borderTop: '1px solid var(--border-color)',
                background: 'var(--gray-50)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                  <Reply size={16} style={{ color: 'var(--gray-500)' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--primary)' }}>
                      Svarer til {replyingTo.senderName || 'Ukjent'}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--gray-600)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {replyingTo.content}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={16} style={{ color: 'var(--gray-500)' }} />
                </button>
              </div>
            )}

            {/* Message Input */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border-color)',
              background: 'var(--card-background)'
            }}>
              {uploadingFile && (
                <div style={{
                  marginBottom: '0.75rem',
                  background: 'var(--gray-100)',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <div style={{
                    flex: 1,
                    background: 'var(--gray-200)',
                    borderRadius: '4px',
                    height: '6px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      background: 'var(--primary)',
                      height: '100%',
                      width: `${uploadProgress}%`,
                      transition: 'width 0.3s'
                    }} />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>
                    {uploadProgress}%
                  </span>
                </div>
              )}

              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '0.75rem'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  flex: 1
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'var(--gray-100)',
                    borderRadius: '12px',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid var(--border-color)'
                  }}>
                    <button
                      onClick={() => {
                        setShowFilePicker(!showFilePicker);
                        setShowEmojiPicker(false);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--gray-600)'
                      }}
                      title="Vedlegg"
                    >
                      <Paperclip size={20} />
                    </button>

                    <textarea
                      ref={messageInputRef}
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Skriv en melding..."
                      rows={1}
                      style={{
                        flex: 1,
                        border: 'none',
                        background: 'transparent',
                        fontSize: '0.875rem',
                        color: 'var(--text-color)',
                        resize: 'none',
                        maxHeight: '120px',
                        outline: 'none',
                        fontFamily: 'inherit'
                      }}
                    />

                    <button
                      onClick={() => {
                        setShowEmojiPicker(!showEmojiPicker);
                        setShowFilePicker(false);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--gray-600)'
                      }}
                      title="Emoji"
                    >
                      <Smile size={20} />
                    </button>
                  </div>

                  {/* File Picker */}
                  {showFilePicker && (
                    <div style={{
                      background: 'var(--card-background)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '1rem',
                      boxShadow: 'var(--shadow-lg)',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '0.75rem'
                    }}>
                      <button
                        onClick={() => {
                          fileInputRef.current?.click();
                          setShowFilePicker(false);
                        }}
                        style={{
                          padding: '1rem',
                          background: 'var(--gray-100)',
                          border: '2px dashed var(--border-color)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--primary)';
                          e.currentTarget.style.background = 'var(--primary-light)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                          e.currentTarget.style.background = 'var(--gray-100)';
                        }}
                      >
                        <ImageIcon size={24} style={{ color: 'var(--primary)' }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-color)' }}>Bilde</span>
                      </button>
                      <button
                        onClick={() => {
                          fileInputRef.current?.click();
                          setShowFilePicker(false);
                        }}
                        style={{
                          padding: '1rem',
                          background: 'var(--gray-100)',
                          border: '2px dashed var(--border-color)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--primary)';
                          e.currentTarget.style.background = 'var(--primary-light)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                          e.currentTarget.style.background = 'var(--gray-100)';
                        }}
                      >
                        <File size={24} style={{ color: 'var(--primary)' }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-color)' }}>Fil</span>
                      </button>
                      <button
                        style={{
                          padding: '1rem',
                          background: 'var(--gray-100)',
                          border: '2px dashed var(--border-color)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.2s',
                          opacity: 0.5
                        }}
                        title="Kommer snart"
                      >
                        <Mic size={24} style={{ color: 'var(--gray-500)' }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Stemme</span>
                      </button>
                    </div>
                  )}

                  {/* Emoji Picker */}
                  {showEmojiPicker && (
                    <div style={{
                      background: 'var(--card-background)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '1rem',
                      boxShadow: 'var(--shadow-lg)',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(8, 1fr)',
                      gap: '0.5rem',
                      maxWidth: '400px'
                    }}>
                      {COMMON_EMOJIS.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => {
                            setNewMessage(prev => prev + emoji);
                            setShowEmojiPicker(false);
                            messageInputRef.current?.focus();
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            borderRadius: '8px',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--gray-100)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  style={{
                    padding: '0.75rem',
                    background: newMessage.trim() ? 'var(--primary)' : 'var(--gray-300)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '48px',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                    flexShrink: 0
                  }}
                  title="Send melding"
                >
                  <Send size={20} />
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(file);
                  }
                }}
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              />
            </div>
          </>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--gray-500)',
            textAlign: 'center',
            padding: '2rem'
          }}>
            <MessageSquare size={64} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <h3 style={{ margin: 0, marginBottom: '0.5rem', color: 'var(--text-color)' }}>
              Velg en chat
            </h3>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>
              Velg en chat fra listen for å starte en samtale
            </p>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--card-background)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                color: 'var(--text-color)',
                margin: 0
              }}>
                Ny chat
              </h2>
              <button
                onClick={() => setShowNewChat(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: 'var(--gray-500)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px'
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--text-color)',
                    marginBottom: '0.5rem'
                  }}>
                    Chat navn
                  </label>
                  <input
                    type="text"
                    placeholder="Skriv chat navn..."
                    value={newChatName}
                    onChange={(e) => setNewChatName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--text-color)',
                    marginBottom: '0.5rem'
                  }}>
                    Type
                  </label>
                  <select
                    value={newChatType}
                    onChange={(e) => setNewChatType(e.target.value as 'private' | 'group')}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)'
                    }}
                  >
                    <option value="private">Privat</option>
                    <option value="group">Gruppe</option>
                  </select>
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--text-color)',
                    marginBottom: '0.5rem'
                  }}>
                    Deltakere
                  </label>
                  <div style={{
                    maxHeight: '200px',
                    overflowY: 'auto',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '0.5rem'
                  }}>
                    {users.filter(user => user.id !== userProfile?.id).map((user) => (
                      <div 
                        key={user.id} 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                        onClick={() => {
                          if (selectedUsers.includes(user.id)) {
                            setSelectedUsers(prev => prev.filter(id => id !== user.id));
                          } else {
                            setSelectedUsers(prev => [...prev, user.id]);
                          }
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--gray-100)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => {}}
                          style={{ cursor: 'pointer' }}
                        />
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          flexShrink: 0
                        }}>
                          {(user.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontWeight: '500',
                            fontSize: '0.875rem',
                            color: 'var(--text-color)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {user.name || 'Ukjent'}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--gray-500)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {user.email}
                          </div>
                        </div>
                        {onlineUsers.has(user.id) && (
                          <div style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: 'var(--success)',
                            border: '2px solid var(--card-background)',
                            flexShrink: 0
                          }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div style={{
              padding: '1.5rem',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowNewChat(false);
                  setNewChatName('');
                  setSelectedUsers([]);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--gray-100)',
                  color: 'var(--text-color)',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Avbryt
              </button>
              <button
                onClick={async () => {
                  if (!userProfile?.id || !newChatName.trim() || selectedUsers.length === 0) return;

                  try {
                    const chatData = {
                      name: newChatName.trim(),
                      type: newChatType,
                      participants: [...selectedUsers, userProfile.id],
                      participantNames: {
                        [userProfile.id]: userProfile.displayName || 'Du',
                        ...selectedUsers.reduce((acc, userId) => {
                          const user = users.find(u => u.id === userId);
                          return { ...acc, [userId]: user?.name || 'Ukjent' };
                        }, {})
                      },
                      unreadCount: {},
                      settings: {
                        readReceipts: true,
                        typingIndicators: true,
                        notifications: true
                      }
                    };

                    const chatId = await chatService.createChat(chatData);
                    await loadData();
                    setShowNewChat(false);
                    setNewChatName('');
                    setSelectedUsers([]);
                    
                    // Select the new chat
                    const newChat = chats.find(c => c.id === chatId) || await chatService.loadChats(userProfile.id).then(chats => chats.find(c => c.id === chatId));
                    if (newChat) {
                      handleChatSelect(newChat);
                    }
                  } catch (error) {
                    console.error('Error creating chat:', error);
                    alert('Feil ved opprettelse av chat');
                  }
                }}
                disabled={!newChatName.trim() || selectedUsers.length === 0}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: (!newChatName.trim() || selectedUsers.length === 0) ? 'var(--gray-300)' : 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: (!newChatName.trim() || selectedUsers.length === 0) ? 'not-allowed' : 'pointer'
                }}
              >
                Opprett chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forward Message Modal */}
      {forwardingMessage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--card-background)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: 'var(--text-color)',
                margin: 0
              }}>
                Videresend melding
              </h2>
              <button
                onClick={() => setForwardingMessage(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: 'var(--gray-500)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px'
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{
              padding: '1.5rem',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              <div style={{
                marginBottom: '1rem',
                padding: '0.75rem',
                background: 'var(--gray-100)',
                borderRadius: '8px',
                fontSize: '0.875rem',
                color: 'var(--text-color)'
              }}>
                {forwardingMessage.content}
              </div>
              <div style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                color: 'var(--text-color)',
                marginBottom: '0.75rem'
              }}>
                Velg chat å videresende til:
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                {chats.filter(chat => chat.id !== selectedChat?.id).map(chat => (
                  <button
                    key={chat.id}
                    onClick={() => {
                      if (forwardingMessage && userProfile?.id) {
                        forwardMessage(forwardingMessage.id, chat.id);
                      }
                    }}
                    style={{
                      padding: '0.75rem',
                      background: 'var(--gray-100)',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      textAlign: 'left',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--gray-200)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--gray-100)';
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: '600',
                      flexShrink: 0
                    }}>
                      {chat.type === 'group' ? (
                        <Users size={20} />
                      ) : (
                        (chat.name || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div style={{
                      flex: 1,
                      minWidth: 0,
                      color: 'var(--text-color)'
                    }}>
                      <div style={{
                        fontWeight: '500',
                        fontSize: '0.875rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {chat.name || 'Ukjent chat'}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--gray-500)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {chat.type === 'group' ? `${chat.participants.length} medlemmer` : 'Privat chat'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Group Members Modal */}
      {showGroupMembers && selectedChat && selectedChat.type === 'group' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--card-background)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '400px',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: 'var(--text-color)',
                margin: 0
              }}>
                Gruppemedlemmer ({selectedChat.participants.length})
              </h2>
              <button
                onClick={() => setShowGroupMembers(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: 'var(--gray-500)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px'
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              {selectedChat.participants.map(participantId => {
                const participant = users.find(u => u.id === participantId) || 
                                  { id: participantId, name: selectedChat.participantNames[participantId] || 'Ukjent', email: '' };
                const isOnline = onlineUsers.has(participantId);
                
                return (
                  <div
                    key={participantId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      background: participantId === userProfile?.id ? 'var(--gray-100)' : 'transparent'
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: '600',
                      flexShrink: 0,
                      position: 'relative'
                    }}>
                      {(participant.name || 'U').charAt(0).toUpperCase()}
                      {isOnline && (
                        <div style={{
                          position: 'absolute',
                          bottom: '0',
                          right: '0',
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: 'var(--success)',
                          border: '2px solid var(--card-background)'
                        }} />
                      )}
                    </div>
                    <div style={{
                      flex: 1,
                      minWidth: 0
                    }}>
                      <div style={{
                        fontWeight: '500',
                        fontSize: '0.875rem',
                        color: 'var(--text-color)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}                      >
                        {participant.name || 'Ukjent'}
                        {participantId === userProfile?.id && ' (Du)'}
                      </div>
                      {participant.email && (
                        <div style={{
                          fontSize: '0.75rem',
                          color: 'var(--gray-500)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {participant.email}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Chat Settings Modal */}
      {showChatSettings && selectedChat && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--card-background)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: 'var(--text-color)',
                margin: 0
              }}>
                Chat-innstillinger
              </h2>
              <button
                onClick={() => setShowChatSettings(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: 'var(--gray-500)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px'
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <button
                onClick={() => {
                  if (userProfile?.id) {
                    chatService.muteChat(selectedChat.id, userProfile.id, !selectedChat.mutedBy?.[userProfile.id]);
                    setShowChatSettings(false);
                  }
                }}
                style={{
                  padding: '0.75rem',
                  background: 'var(--gray-100)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  textAlign: 'left'
                }}
              >
                {selectedChat.mutedBy?.[userProfile?.id || ''] ? (
                  <BellOff size={20} style={{ color: 'var(--text-color)' }} />
                ) : (
                  <Bell size={20} style={{ color: 'var(--text-color)' }} />
                )}
                <span style={{ color: 'var(--text-color)' }}>
                  {selectedChat.mutedBy?.[userProfile?.id || ''] ? 'Slå på varsler' : 'Slå av varsler'}
                </span>
              </button>
              <button
                onClick={() => {
                  if (userProfile?.id) {
                    chatService.pinChat(selectedChat.id, userProfile.id);
                    setShowChatSettings(false);
                  }
                }}
                style={{
                  padding: '0.75rem',
                  background: 'var(--gray-100)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  textAlign: 'left'
                }}
              >
                <Pin size={20} style={{ color: 'var(--text-color)' }} />
                <span style={{ color: 'var(--text-color)' }}>Pinne chat</span>
              </button>
              {selectedChat.type === 'group' && (
                <button
                  onClick={async () => {
                    if (userProfile?.id && confirm('Er du sikker på at du vil forlate denne gruppen?')) {
                      await chatService.leaveGroup(selectedChat.id, userProfile.id);
                      await loadData();
                      setSelectedChat(null);
                      setShowChatSettings(false);
                    }
                  }}
                  style={{
                    padding: '0.75rem',
                    background: 'var(--danger)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    textAlign: 'left'
                  }}
                >
                  <X size={20} />
                  <span>Forlat gruppe</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
