import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

export interface ChatMessage {
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
}

export interface Chat {
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

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
}

class ChatService {
  // Remove unused emailService property
  constructor() {
    // Initialize service
  }

  // Load user's chats
  async loadChats(userId: string): Promise<Chat[]> {
    if (!db) return [];

    try {
      const chatsQuery = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
      );

      const snapshot = await getDocs(chatsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Chat[];
    } catch (error) {
      console.error('Error loading chats:', error);
      return [];
    }
  }

  // Load messages for a specific chat
  async loadMessages(chatId: string, limitCount: number = 50): Promise<ChatMessage[]> {
    if (!db) return [];

    try {
      const messagesQuery = query(
        collection(db, `chats/${chatId}/messages`),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(messagesQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
    } catch (error) {
      console.error('Error loading messages:', error);
      return [];
    }
  }

  // Load users for chat
  async loadUsers(companyId: string): Promise<User[]> {
    if (!db) return [];

    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('companyId', '==', companyId),
        where('status', '==', 'active')
      );

      const snapshot = await getDocs(usersQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
    } catch (error) {
      console.error('Error loading users:', error);
      return [];
    }
  }

  // Send a message
  async sendMessage(chatId: string, message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<string> {
    if (!db) throw new Error('Database not initialized');

    try {
      const messageData = {
        ...message,
        createdAt: new Date().toISOString(),
        readBy: [message.senderId]
      };

      const docRef = await addDoc(collection(db, `chats/${chatId}/messages`), messageData);
      
      // Update chat's last message
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: {
          content: message.content,
          senderId: message.senderId,
          senderName: message.senderName,
          timestamp: messageData.createdAt,
          type: message.type
        },
        updatedAt: messageData.createdAt
      });

      // Send notifications to other participants
      await this.sendChatNotifications(chatId, message);

      return docRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Upload file to storage
  async uploadFile(file: File, chatId: string): Promise<{ url: string; fileName: string; fileSize: number }> {
    if (!storage) throw new Error('Storage not initialized');

    try {
      const fileName = `${Date.now()}_${file.name}`;
      const fileRef = ref(storage, `chat-files/${chatId}/${fileName}`);
      
      const snapshot = await uploadBytes(fileRef, file);
      const url = await getDownloadURL(snapshot.ref);

      return {
        url,
        fileName: file.name,
        fileSize: file.size
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // Create a new chat
  async createChat(chatData: Omit<Chat, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!db) throw new Error('Database not initialized');

    try {
      const chatDoc = {
        ...chatData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        unreadCount: {}
      };

      const docRef = await addDoc(collection(db, 'chats'), chatDoc);
      return docRef.id;
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  }

  // Mark messages as read
  async markMessagesAsRead(chatId: string, userId: string, messageIds: string[]): Promise<void> {
    if (!db) return;

    try {
      const batch = writeBatch(db);
      
      messageIds.forEach(messageId => {
        const messageRef = doc(db, `chats/${chatId}/messages`, messageId);
        batch.update(messageRef, {
          readBy: [userId]
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // Delete a message
  async deleteMessage(chatId: string, messageId: string): Promise<void> {
    if (!db) return;

    try {
      await deleteDoc(doc(db, `chats/${chatId}/messages`, messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }

  // Edit a message
  async editMessage(chatId: string, messageId: string, newContent: string): Promise<void> {
    if (!db) return;

    try {
      await updateDoc(doc(db, `chats/${chatId}/messages`, messageId), {
        content: newContent,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error editing message:', error);
    }
  }

  // Add reaction to message
  async addReaction(chatId: string, messageId: string, userId: string, reaction: string): Promise<void> {
    if (!db) return;

    try {
      const messageRef = doc(db, `chats/${chatId}/messages`, messageId);
      await updateDoc(messageRef, {
        [`reactions.${userId}`]: reaction
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  }

  // Forward message to another chat
  async forwardMessage(messageId: string, fromChatId: string, toChatId: string, userId: string, userName: string): Promise<void> {
    if (!db) return;

    try {
      // Get the original message
      const messageDoc = await getDocs(query(
        collection(db, `chats/${fromChatId}/messages`),
        where('__name__', '==', messageId)
      ));

      if (!messageDoc.empty) {
        const originalMessage = messageDoc.docs[0].data() as ChatMessage;
        
        // Create forwarded message
        const forwardedMessage: Omit<ChatMessage, 'id' | 'createdAt'> = {
          chatId: toChatId,
          senderId: userId,
          senderName: userName,
          content: originalMessage.content,
          type: originalMessage.type,
          fileUrl: originalMessage.fileUrl,
          fileName: originalMessage.fileName,
          fileSize: originalMessage.fileSize,
          thumbnailUrl: originalMessage.thumbnailUrl,
          duration: originalMessage.duration,
          reactions: {},
          readBy: [userId],
          forwardedFrom: {
            messageId: originalMessage.id,
            chatId: fromChatId,
            chatName: 'Original Chat', // You might want to get the actual chat name
            senderName: originalMessage.senderName
          }
        };

        await this.sendMessage(toChatId, forwardedMessage);
      }
    } catch (error) {
      console.error('Error forwarding message:', error);
    }
  }

  // Update chat settings
  async updateChatSettings(chatId: string, settings: Partial<Chat['settings']>): Promise<void> {
    if (!db) return;

    try {
      await updateDoc(doc(db, 'chats', chatId), {
        settings: settings,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating chat settings:', error);
    }
  }

  // Archive a chat
  async archiveChat(chatId: string, userId: string): Promise<void> {
    if (!db) return;

    try {
      // This could be implemented by adding an archived field to the chat
      // or by moving the chat to an archived collection
      await updateDoc(doc(db, 'chats', chatId), {
        [`archivedBy.${userId}`]: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error archiving chat:', error);
    }
  }

  // Pin a chat
  async pinChat(chatId: string, userId: string): Promise<void> {
    if (!db) return;

    try {
      await updateDoc(doc(db, 'chats', chatId), {
        [`pinnedBy.${userId}`]: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error pinning chat:', error);
    }
  }

  // Mute a chat
  async muteChat(chatId: string, userId: string, muted: boolean): Promise<void> {
    if (!db) return;

    try {
      await updateDoc(doc(db, 'chats', chatId), {
        [`mutedBy.${userId}`]: muted ? new Date().toISOString() : null
      });
    } catch (error) {
      console.error('Error muting chat:', error);
    }
  }

  // Leave a group chat
  async leaveGroup(chatId: string, userId: string): Promise<void> {
    if (!db) return;

    try {
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDocs(query(collection(db, 'chats'), where('__name__', '==', chatId)));
      
      if (!chatDoc.empty) {
        const chat = chatDoc.docs[0].data() as Chat;
        const updatedParticipants = chat.participants.filter(id => id !== userId);
        
        await updateDoc(chatRef, {
          participants: updatedParticipants,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error leaving group:', error);
    }
  }

  // Send notifications for chat messages
  private async sendChatNotifications(chatId: string, message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<void> {
    // This would integrate with your notification service
    // For now, we'll just log it
    console.log('Sending chat notifications for message:', message);
  }
}

export const chatService = new ChatService();