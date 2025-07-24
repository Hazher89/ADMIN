'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Chat, User } from '@/types';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  UsersIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export default function ChatPage() {
  const { selectedCompany } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedCompany) return;

      try {
        // Fetch chats
        const chatsRef = collection(db, 'chats');
        const chatsQuery = query(
          chatsRef,
          where('companyId', '==', selectedCompany),
          orderBy('lastMessageAt', 'desc')
        );
        const chatsSnapshot = await getDocs(chatsQuery);
        
        const chatsData = chatsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          lastMessageAt: doc.data().lastMessageAt?.toDate(),
        })) as Chat[];

        setChats(chatsData);

        // Fetch users for participant info
        const usersRef = collection(db, 'users');
        const usersQuery = query(usersRef, where('companyId', '==', selectedCompany));
        const usersSnapshot = await getDocs(usersQuery);
        
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          lastLoginAt: doc.data().lastLoginAt?.toDate(),
        })) as User[];

        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCompany]);

  const filteredChats = chats.filter(chat => {
    const matchesSearch = chat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chat.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || chat.type === filterType;
    return matchesSearch && matchesType;
  });

  const getChatTypeLabel = (type: string) => {
    switch (type) {
      case 'individual': return 'Individuell';
      case 'group': return 'Gruppe';
      case 'department': return 'Avdeling';
      case 'company': return 'Bedrift';
      default: return type;
    }
  };

  const getChatTypeColor = (type: string) => {
    switch (type) {
      case 'individual': return 'bg-blue-100 text-blue-800';
      case 'group': return 'bg-purple-100 text-purple-800';
      case 'department': return 'bg-green-100 text-green-800';
      case 'company': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getParticipantNames = (participantIds: string[]) => {
    const participantNames = participantIds
      .map(id => users.find(u => u.id === id)?.name)
      .filter(Boolean);
    return participantNames.join(', ');
  };

  const formatLastMessageTime = (date?: Date) => {
    if (!date) return 'Ingen meldinger';
    
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Nylig';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}t siden`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d siden`;
    return date.toLocaleDateString('no-NO');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Chat</h1>
        <p className="text-gray-600">Oversikt over alle chat-rom</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Søk etter chat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Alle typer</option>
            <option value="individual">Individuell</option>
            <option value="group">Gruppe</option>
            <option value="department">Avdeling</option>
            <option value="company">Bedrift</option>
          </select>
        </div>
      </div>

      {/* Chats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredChats.map((chat) => (
          <div
            key={chat.id}
            className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-500 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {chat.name || 'Unnamed Chat'}
                  </h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getChatTypeColor(chat.type)}`}>
                    {getChatTypeLabel(chat.type)}
                  </span>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-900">
                <EyeIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-500">
                <UsersIcon className="h-4 w-4 mr-2" />
                <span>{chat.participants.length} deltakere</span>
              </div>

              {chat.lastMessage && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Siste melding:</span>
                  <p className="truncate">{chat.lastMessage}</p>
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  <span>{formatLastMessageTime(chat.lastMessageAt)}</span>
                </div>
                {chat.unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {chat.unreadCount}
                  </span>
                )}
              </div>

              <div className="text-sm text-gray-500">
                <span className="font-medium">Deltakere:</span>
                <p className="truncate">{getParticipantNames(chat.participants)}</p>
              </div>

              <div className="flex items-center justify-between">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  chat.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {chat.isActive ? 'Aktiv' : 'Inaktiv'}
                </span>
                {chat.isPinned && (
                  <span className="text-yellow-500 text-sm">📌 Festet</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredChats.length === 0 && (
        <div className="text-center py-12">
          <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm ? 'Ingen chats funnet' : 'Ingen chats opprettet ennå'}
          </p>
        </div>
      )}
    </div>
  );
} 