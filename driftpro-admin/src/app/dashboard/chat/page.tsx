'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { chatService, Chat, ChatMessage, User } from '@/lib/chat-service';
import { 
  Search, Filter, MessageSquare, Users, Send, MoreHorizontal, 
  Paperclip, Smile, Phone, Video, Eye, Edit, Trash2, Archive,
  Pin, Bell, BellOff, UserPlus, Settings
} from 'lucide-react';

export default function ChatPage() {
  const { userProfile } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [newChatType, setNewChatType] = useState<'private' | 'group'>('private');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  useEffect(() => {
    if (userProfile?.id && userProfile?.companyId) {
      loadData();
    }
  }, [userProfile?.id, userProfile?.companyId]);

  const loadData = async () => {
    if (!userProfile?.id || !userProfile?.companyId) return;

    try {
      setLoading(true);
      
      // Load real data from Firebase
      const [chatsData, usersData] = await Promise.all([
        chatService.loadChats(userProfile.id),
        chatService.loadUsers(userProfile.companyId)
      ]);
      
      setChats(chatsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading data:', error);
      setChats([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const createSampleChats = async (userId: string, users: User[]): Promise<Chat[]> => {
    const sampleChats: Chat[] = [];
    
    // Create a private chat with the first other user
    if (users.length > 1) {
      const otherUser = users.find(u => u.id !== userId);
      if (otherUser) {
        const privateChat: Chat = {
          id: `chat_${Date.now()}_1`,
          name: otherUser.name,
          type: 'private',
          participants: [userId, otherUser.id],
          participantNames: {
            [userId]: userProfile?.displayName || 'Du',
            [otherUser.id]: otherUser.name
          },
          lastMessage: {
            content: 'Hei! Hvordan går det?',
            senderId: otherUser.id,
            senderName: otherUser.name,
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            type: 'text'
          },
          unreadCount: {
            [userId]: 1
          },
          settings: {
            readReceipts: true,
            typingIndicators: true,
            notifications: true
          },
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString()
        };
        sampleChats.push(privateChat);
      }
    }

    // Create a group chat
    const groupChat: Chat = {
      id: `chat_${Date.now()}_2`,
      name: 'DriftPro Team',
      type: 'group',
      participants: [userId, ...users.slice(0, 3).map(u => u.id)],
      participantNames: {
        [userId]: userProfile?.displayName || 'Du',
        ...users.slice(0, 3).reduce((acc, user) => ({ ...acc, [user.id]: user.name }), {})
      },
      lastMessage: {
        content: 'Møte i morgen kl 10:00',
        senderId: userId,
        senderName: userProfile?.displayName || 'Du',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        type: 'text'
      },
      unreadCount: {},
      settings: {
        readReceipts: true,
        typingIndicators: true,
        notifications: true
      },
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString()
    };
    sampleChats.push(groupChat);

    return sampleChats;
  };

  const createSampleData = (userId: string) => {
    const sampleUsers: User[] = [
      {
        id: 'user1',
        name: 'Ola Nordmann',
        email: 'ola@driftpro.no',
        status: 'online',
        lastSeen: new Date().toISOString()
      },
      {
        id: 'user2',
        name: 'Kari Hansen',
        email: 'kari@driftpro.no',
        status: 'away',
        lastSeen: new Date(Date.now() - 300000).toISOString()
      },
      {
        id: 'user3',
        name: 'Per Olsen',
        email: 'per@driftpro.no',
        status: 'offline',
        lastSeen: new Date(Date.now() - 3600000).toISOString()
      }
    ];

    const sampleChats: Chat[] = [
      {
        id: 'chat1',
        name: 'Ola Nordmann',
        type: 'private',
        participants: [userId, 'user1'],
        participantNames: {
          [userId]: userProfile?.displayName || 'Du',
          'user1': 'Ola Nordmann'
        },
        lastMessage: {
          content: 'Hei! Hvordan går det?',
          senderId: 'user1',
          senderName: 'Ola Nordmann',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          type: 'text'
        },
        unreadCount: {
          [userId]: 1
        },
        settings: {
          readReceipts: true,
          typingIndicators: true,
          notifications: true
        },
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'chat2',
        name: 'DriftPro Team',
        type: 'group',
        participants: [userId, 'user1', 'user2', 'user3'],
        participantNames: {
          [userId]: userProfile?.displayName || 'Du',
          'user1': 'Ola Nordmann',
          'user2': 'Kari Hansen',
          'user3': 'Per Olsen'
        },
        lastMessage: {
          content: 'Møte i morgen kl 10:00',
          senderId: userId,
          senderName: userProfile?.displayName || 'Du',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          type: 'text'
        },
        unreadCount: {},
        settings: {
          readReceipts: true,
          typingIndicators: true,
          notifications: true
        },
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 1800000).toISOString()
      }
    ];

    return { chats: sampleChats, users: sampleUsers };
  };

  const loadMessages = async (chatId: string) => {
    try {
      let messagesData = await chatService.loadMessages(chatId);
      
      // If no messages exist, create sample messages
      if (messagesData.length === 0) {
        messagesData = createSampleMessages(chatId);
      }
      
      setMessages(messagesData);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const createSampleMessages = (chatId: string): ChatMessage[] => {
    const now = new Date();
    const currentUserId = userProfile?.id || 'currentUser';
    return [
      {
        id: 'msg1',
        chatId,
        senderId: chatId === 'chat1' ? 'user1' : currentUserId,
        senderName: chatId === 'chat1' ? 'Ola Nordmann' : (userProfile?.displayName || 'Du'),
        content: 'Hei! Hvordan går det?',
        type: 'text',
        reactions: {},
        readBy: ['user1', currentUserId],
        createdAt: new Date(now.getTime() - 3600000).toISOString()
      },
      {
        id: 'msg2',
        chatId,
        senderId: currentUserId,
        senderName: userProfile?.displayName || 'Du',
        content: 'Det går bra, takk! Hvordan er det med deg?',
        type: 'text',
        reactions: {},
        readBy: ['user1', currentUserId],
        createdAt: new Date(now.getTime() - 3000000).toISOString()
      },
      {
        id: 'msg3',
        chatId,
        senderId: chatId === 'chat1' ? 'user1' : 'user2',
        senderName: chatId === 'chat1' ? 'Ola Nordmann' : 'Kari Hansen',
        content: 'Alt bra her også! Har du sett den nye funksjonen?',
        type: 'text',
        reactions: {},
        readBy: [currentUserId],
        createdAt: new Date(now.getTime() - 1800000).toISOString()
      }
    ];
  };

  const filteredChats = chats.filter(chat => {
    const matchesSearch = (chat.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (chat.lastMessage?.content?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Nå';
    } else if (diffInHours < 24) {
      return `${diffInHours}t siden`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d siden`;
    }
  };

  const formatMessageTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('no-NO', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

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
        readBy: [userProfile.id]
      };

      await chatService.sendMessage(selectedChat.id, messageData);
      setNewMessage('');
      
      // Reload messages to show the new message
      await loadMessages(selectedChat.id);
    } catch (error) {
      console.error('Error sending message:', error);
      // Add message locally for immediate feedback
      const newMsg: ChatMessage = {
        id: `local_${Date.now()}`,
        chatId: selectedChat.id,
        senderId: userProfile.id,
        senderName: userProfile.displayName || 'Du',
        content: newMessage.trim(),
        type: 'text',
        reactions: {},
        readBy: [userProfile.id],
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [newMsg, ...prev]);
      setNewMessage('');
    }
  };

  const handleChatSelect = async (chat: Chat) => {
    setSelectedChat(chat);
    await loadMessages(chat.id);
  };

  const createNewChat = async () => {
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
      await loadData(); // Reload chats
      setShowNewChat(false);
      setNewChatName('');
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error creating chat:', error);
      alert('Feil ved opprettelse av chat');
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!selectedChat) return;

    try {
      await chatService.deleteMessage(selectedChat.id, messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
      // Remove message locally for immediate feedback
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    }
  };

  const archiveChat = async (chatId: string) => {
    if (!userProfile?.id) return;

    try {
      await chatService.archiveChat(chatId, userProfile.id);
      await loadData(); // Reload chats
      if (selectedChat?.id === chatId) {
        setSelectedChat(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error archiving chat:', error);
      alert('Feil ved arkivering av chat');
    }
  };

  const handleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      {/* Chat List Sidebar */}
      <div className="chat-sidebar">
        <div className="chat-header">
          <h2 className="chat-title">💬 Chat</h2>
          <div className="chat-actions">
            <button
              onClick={() => setShowNewChat(true)}
              className="action-btn"
              title="Ny chat"
            >
              <MessageSquare style={{ width: '16px', height: '16px' }} />
            </button>
            <button className="action-btn" title="Innstillinger">
              <Settings style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </div>

        <div className="chat-search">
          <Search style={{ width: '16px', height: '16px', color: '#6b7280' }} />
          <input
            type="text"
            placeholder="Søk i chat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="chat-list">
          {filteredChats.length === 0 ? (
            <div className="empty-chats">
              <MessageSquare style={{ width: '48px', height: '48px', color: '#9ca3af' }} />
              <p>Ingen chat funnet</p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
                onClick={() => handleChatSelect(chat)}
              >
                <div className="chat-avatar">
                  {chat.type === 'group' ? (
                    <Users style={{ width: '20px', height: '20px' }} />
                  ) : (
                    <div className="user-avatar">
                      {chat.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                
                <div className="chat-info">
                  <div className="chat-name">{chat.name}</div>
                  {chat.lastMessage && (
                    <div className="chat-preview">
                      <span className="last-message">
                        {chat.lastMessage.senderName}: {chat.lastMessage.content}
                      </span>
                      <span className="last-time">
                        {formatDate(chat.lastMessage.timestamp)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="chat-meta">
                  {chat.unreadCount[userProfile?.id || ''] > 0 && (
                    <span className="unread-badge">
                      {chat.unreadCount[userProfile?.id || '']}
                    </span>
                  )}
                  <button className="chat-menu-btn">
                    <MoreHorizontal style={{ width: '16px', height: '16px' }} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="chat-messages">
        {selectedChat ? (
          <>
            <div className="messages-header">
              <div className="chat-details">
                <h3 className="chat-name">{selectedChat.name}</h3>
                <span className="chat-type">
                  {selectedChat.type === 'group' ? 'Gruppe' : 'Privat'}
                </span>
              </div>
              <div className="chat-actions">
                <button className="action-btn" title="Video call">
                  <Video style={{ width: '16px', height: '16px' }} />
                </button>
                <button className="action-btn" title="Voice call">
                  <Phone style={{ width: '16px', height: '16px' }} />
                </button>
                <button className="action-btn" title="Se profil">
                  <Eye style={{ width: '16px', height: '16px' }} />
                </button>
                <button 
                  className="action-btn" 
                  title="Arkiver"
                  onClick={() => archiveChat(selectedChat.id)}
                >
                  <Archive style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
            </div>

            <div className="messages-container">
              {messages.length === 0 ? (
                <div className="empty-messages">
                  <MessageSquare style={{ width: '48px', height: '48px', color: '#9ca3af' }} />
                  <p>Ingen meldinger ennå</p>
                  <p>Start en samtale!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`message ${message.senderId === userProfile?.id ? 'own' : 'other'}`}
                  >
                    <div className="message-content">
                      <div className="message-header">
                        <span className="sender-name">{message.senderName}</span>
                        <span className="message-time">
                          {formatMessageTime(message.createdAt)}
                        </span>
                      </div>
                      <div className="message-text">{message.content}</div>
                    </div>
                    
                    {message.senderId === userProfile?.id && (
                      <div className="message-actions">
                        <button
                          onClick={() => deleteMessage(message.id)}
                          className="message-action-btn"
                          title="Slett"
                        >
                          <Trash2 style={{ width: '12px', height: '12px' }} />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="message-input">
              <div className="input-actions">
                <button className="input-action-btn" title="Vedlegg">
                  <Paperclip style={{ width: '16px', height: '16px' }} />
                </button>
                <button className="input-action-btn" title="Emoji">
                  <Smile style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
              <input
                type="text"
                placeholder="Skriv en melding..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="message-input-field"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="send-btn"
              >
                <Send style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            <MessageSquare style={{ width: '64px', height: '64px', color: '#9ca3af' }} />
            <h3>Velg en chat</h3>
            <p>Velg en chat fra listen for å starte en samtale</p>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Ny chat</h2>
              <button
                onClick={() => setShowNewChat(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Chat navn</label>
                <input
                  type="text"
                  placeholder="Skriv chat navn..."
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select 
                  className="form-select"
                  value={newChatType}
                  onChange={(e) => setNewChatType(e.target.value as 'private' | 'group')}
                >
                  <option value="private">Privat</option>
                  <option value="group">Gruppe</option>
                </select>
              </div>
              <div className="form-group">
                <label>Deltakere</label>
                <div className="users-list">
                  {users.filter(user => user.id !== userProfile?.id).map((user) => (
                    <div key={user.id} className="user-item">
                      <input 
                        type="checkbox" 
                        id={user.id}
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleUserSelection(user.id)}
                      />
                      <label htmlFor={user.id}>{user.name}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowNewChat(false)}
                className="btn btn-secondary"
              >
                Avbryt
              </button>
              <button 
                onClick={createNewChat}
                disabled={!newChatName.trim() || selectedUsers.length === 0}
                className="btn btn-primary"
              >
                Opprett chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 