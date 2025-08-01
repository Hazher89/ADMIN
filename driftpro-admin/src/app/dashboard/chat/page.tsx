'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Mic, 
  Camera, 
  Search, 
  MessageSquare, 
  User, 
  Plus,
  CheckCheck,
  MoreHorizontal,
  Phone,
  Video,
  Info
} from 'lucide-react';

interface Chat {
  id: string;
  name: string;
  type: 'private' | 'group';
  participants: string[];
  lastMessage?: {
    content: string;
    senderName: string;
    timestamp: string;
  };
  unreadCount: number;
  avatar?: string;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
}

export default function ChatPage() {
  const { userProfile } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      // Mock data for demonstration
      const mockChats: Chat[] = [
        {
          id: '1',
          name: 'Generell Chat',
          type: 'group',
          participants: ['user1', 'user2', 'user3'],
          lastMessage: {
            content: 'Hei alle sammen! Hvordan går det?',
            senderName: 'John Doe',
            timestamp: '2024-07-27T10:30:00Z'
          },
          unreadCount: 3
        },
        {
          id: '2',
          name: 'HR-avdelingen',
          type: 'group',
          participants: ['hr1', 'hr2'],
          lastMessage: {
            content: 'Møte i morgen kl. 10:00',
            senderName: 'Jane Smith',
            timestamp: '2024-07-27T09:15:00Z'
          },
          unreadCount: 0
        },
        {
          id: '3',
          name: 'IT Support',
          type: 'group',
          participants: ['it1', 'it2', 'it3'],
          lastMessage: {
            content: 'Systemet er oppe igjen',
            senderName: 'Mike Johnson',
            timestamp: '2024-07-27T08:45:00Z'
          },
          unreadCount: 1
        },
        {
          id: '4',
          name: 'Sarah Wilson',
          type: 'private',
          participants: ['user1', 'sarah'],
          lastMessage: {
            content: 'Takk for hjelpen!',
            senderName: 'Sarah Wilson',
            timestamp: '2024-07-27T08:00:00Z'
          },
          unreadCount: 0
        }
      ];

      setChats(mockChats);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      // Mock messages for demonstration
      const mockMessages: Message[] = [
        {
          id: '1',
          senderId: 'user1',
          senderName: 'John Doe',
          content: 'Hei alle sammen! Hvordan går det?',
          timestamp: '2024-07-27T10:30:00Z',
          isOwn: false
        },
        {
          id: '2',
          senderId: 'user2',
          senderName: 'Jane Smith',
          content: 'Hei! Det går bra, takk!',
          timestamp: '2024-07-27T10:32:00Z',
          isOwn: false
        },
        {
          id: '3',
          senderId: 'currentUser',
          senderName: 'Du',
          content: 'Alt bra her også!',
          timestamp: '2024-07-27T10:35:00Z',
          isOwn: true
        },
        {
          id: '4',
          senderId: 'user3',
          senderName: 'Mike Johnson',
          content: 'Flott å høre!',
          timestamp: '2024-07-27T10:40:00Z',
          isOwn: false
        }
      ];

      setMessages(mockMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id);
    }
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedChat) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: 'currentUser',
      senderName: 'Du',
      content: newMessage,
      timestamp: new Date().toISOString(),
      isOwn: true
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ height: 'calc(100vh - 2rem)', display: 'flex', gap: '1rem' }}>
      {/* Chat List */}
      <div className="card" style={{ width: '350px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div className="card-icon">
              <MessageSquare />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#333' }}>Chat</h2>
              <p style={{ fontSize: '0.875rem', color: '#666' }}>Kommuniser med teamet</p>
            </div>
          </div>
          
          <div className="search-container">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Søk i chat..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div style={{ flex: '1', overflowY: 'auto', padding: '0.5rem' }}>
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className="card"
              style={{ 
                marginBottom: '0.5rem',
                cursor: 'pointer',
                padding: '1rem',
                backgroundColor: selectedChat?.id === chat.id ? 'rgba(102, 126, 234, 0.1)' : 'rgba(255, 255, 255, 0.95)',
                border: selectedChat?.id === chat.id ? '2px solid #667eea' : '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="user-avatar" style={{ width: '40px', height: '40px' }}>
                  {chat.name.charAt(0)}
                </div>
                <div style={{ flex: '1', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <h3 style={{ 
                      fontWeight: '600', 
                      color: '#333',
                      fontSize: '0.875rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {chat.name}
                    </h3>
                    {chat.unreadCount > 0 && (
                      <span className="badge badge-primary" style={{ fontSize: '0.625rem' }}>
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                  <p style={{ 
                    color: '#666', 
                    fontSize: '0.75rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {chat.lastMessage?.content || 'Ingen meldinger'}
                  </p>
                  <p style={{ 
                    color: '#999', 
                    fontSize: '0.625rem',
                    marginTop: '0.25rem'
                  }}>
                    {chat.lastMessage?.timestamp ? 
                      new Date(chat.lastMessage.timestamp).toLocaleTimeString('no-NO', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      }) : ''}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="card" style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div style={{ 
              padding: '1.5rem', 
              borderBottom: '1px solid rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="user-avatar" style={{ width: '40px', height: '40px' }}>
                  {selectedChat.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontWeight: '600', color: '#333', fontSize: '1.1rem' }}>
                    {selectedChat.name}
                  </h3>
                  <p style={{ color: '#666', fontSize: '0.875rem' }}>
                    {selectedChat.type === 'group' ? 'Gruppechat' : 'Privat melding'}
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                  <Phone style={{ width: '16px', height: '16px' }} />
                </button>
                <button className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                  <Video style={{ width: '16px', height: '16px' }} />
                </button>
                <button className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                  <Info style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div style={{ 
              flex: '1', 
              overflowY: 'auto', 
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  style={{ 
                    display: 'flex',
                    justifyContent: message.isOwn ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{
                    maxWidth: '70%',
                    padding: '1rem',
                    borderRadius: '20px',
                    backgroundColor: message.isOwn 
                      ? 'linear-gradient(135deg, #667eea, #764ba2)' 
                      : 'rgba(255, 255, 255, 0.9)',
                    color: message.isOwn ? 'white' : '#333',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    position: 'relative'
                  }}>
                    {!message.isOwn && (
                      <p style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: '600', 
                        marginBottom: '0.5rem',
                        color: '#667eea'
                      }}>
                        {message.senderName}
                      </p>
                    )}
                    <p style={{ fontSize: '0.875rem', lineHeight: '1.4' }}>
                      {message.content}
                    </p>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      marginTop: '0.5rem',
                      fontSize: '0.625rem',
                      opacity: 0.7
                    }}>
                      <span>
                        {new Date(message.timestamp).toLocaleTimeString('no-NO', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {message.isOwn && (
                        <CheckCheck style={{ width: '12px', height: '12px' }} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div style={{ 
              padding: '1.5rem', 
              borderTop: '1px solid rgba(0,0,0,0.1)',
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-end'
            }}>
              <div style={{ flex: '1', display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                  <Paperclip style={{ width: '16px', height: '16px' }} />
                </button>
                <button className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                  <Smile style={{ width: '16px', height: '16px' }} />
                </button>
                <button className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                  <Camera style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
              
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
                placeholder="Skriv en melding..."
                className="form-input"
                style={{ flex: '1' }}
              />
              
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="btn btn-primary"
                style={{ padding: '0.75rem 1.5rem' }}
              >
                <Send style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
          </>
        ) : (
          <div style={{ 
            flex: '1', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            textAlign: 'center'
          }}>
            <div>
              <MessageSquare style={{ 
                width: '64px', 
                height: '64px', 
                color: '#ccc', 
                margin: '0 auto 1rem' 
              }} />
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                color: '#333', 
                marginBottom: '0.5rem' 
              }}>
                Velg en chat
              </h3>
              <p style={{ color: '#666' }}>
                Velg en chat fra listen for å starte å snakke
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 