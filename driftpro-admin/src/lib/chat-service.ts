import { db, storage } from './firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  where, 
  getDocs, 
  serverTimestamp, 
  deleteDoc,
  writeBatch 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { emailService } from './email-service';
import { notificationService } from './notification-service';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'video' | 'audio';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  thumbnailUrl?: string;
  timestamp: any;
  readBy: string[];
  repliedTo?: {
    messageId: string;
    content: string;
    senderName: string;
  };
  forwardedFrom?: {
    messageId: string;
    chatId: string;
    senderName: string;
  };
  edited: boolean;
  editedAt?: any;
  deleted: boolean;
  reactions: {
    [userId: string]: string; // emoji
  };
}

export interface Chat {
  id: string;
  name: string;
  type: 'private' | 'group';
  participants: string[];
  participantNames: { [userId: string]: string };
  participantAvatars: { [userId: string]: string };
  lastMessage?: {
    content: string;
    senderName: string;
    timestamp: any;
    type: string;
  };
  unreadCount: { [userId: string]: number };
  isGroup: boolean;
  groupInfo?: {
    description: string;
    createdBy: string;
    createdAt: any;
    admins: string[];
    pinnedMessages: string[];
  };
  settings: {
    readReceipts: boolean;
    notifications: boolean;
    archived: boolean;
    pinned: boolean;
    muted: boolean;
  };
  createdAt: any;
  updatedAt: any;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen?: any;
  department?: string;
  role?: string;
}

class ChatService {
  // Load chats for a user
  async loadChats(userId: string, callback: (chats: Chat[]) => void) {
    if (!db) return;

    try {
      const chatsQuery = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
      );

      return onSnapshot(chatsQuery, (snapshot) => {
        const chats: Chat[] = [];
        snapshot.forEach((doc) => {
          chats.push({ id: doc.id, ...doc.data() } as Chat);
        });
        callback(chats);
      });
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  }

  // Load messages for a chat
  async loadMessages(chatId: string, callback: (messages: ChatMessage[]) => void) {
    if (!db) return;

    try {
      const messagesQuery = query(
        collection(db, `chats/${chatId}/messages`),
        orderBy('timestamp', 'asc')
      );

      return onSnapshot(messagesQuery, (snapshot) => {
        const messages: ChatMessage[] = [];
        snapshot.forEach((doc) => {
          messages.push({ id: doc.id, ...doc.data() } as ChatMessage);
        });
        callback(messages);
      });
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }

  // Load users
  async loadUsers(callback: (users: User[]) => void) {
    if (!db) return;

    try {
      const usersQuery = query(collection(db, 'employees'));
      const snapshot = await getDocs(usersQuery);
      const users: User[] = [];
      snapshot.forEach((doc) => {
        const userData = doc.data();
        users.push({
          id: doc.id,
          name: `${userData.firstName} ${userData.lastName}`,
          email: userData.email,
          avatar: userData.avatar,
          status: 'online',
          department: userData.department,
          role: userData.role
        });
      });
      callback(users);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  // Send message
  async sendMessage(
    chatId: string, 
    senderId: string, 
    senderName: string, 
    senderAvatar: string | undefined,
    content: string, 
    type: 'text' | 'image' | 'file' | 'video' | 'audio' = 'text', 
    fileUrl?: string, 
    fileName?: string, 
    fileSize?: number,
    repliedTo?: ChatMessage
  ) {
    if (!db || !content.trim()) return;

    try {
      const messageData = {
        senderId,
        senderName,
        senderAvatar,
        content,
        type,
        fileUrl,
        fileName,
        fileSize,
        timestamp: serverTimestamp(),
        readBy: [senderId],
        edited: false,
        deleted: false,
        reactions: {},
        ...(repliedTo && {
          repliedTo: {
            messageId: repliedTo.id,
            content: repliedTo.content,
            senderName: repliedTo.senderName
          }
        })
      };

      const messageRef = await addDoc(collection(db, `chats/${chatId}/messages`), messageData);

      // Update chat's last message
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: {
          content,
          senderName,
          timestamp: serverTimestamp(),
          type
        },
        updatedAt: serverTimestamp()
      });

      // Send email notifications to other participants
      await this.sendChatNotifications(chatId, senderId, content, senderName);

      return messageRef;
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  // Send chat notifications
  async sendChatNotifications(chatId: string, senderId: string, content: string, senderName: string) {
    try {
      const chatDoc = await getDocs(query(collection(db, 'chats'), where('__name__', '==', chatId)));
      if (!chatDoc.empty) {
        const chatData = chatDoc.docs[0].data() as Chat;
        const participants = chatData.participants.filter(id => id !== senderId);
        
        // Send notifications to other participants
        for (const participantId of participants) {
          await notificationService.createChatNotification(
            chatId,
            chatData.name,
            senderName,
            content,
            participantId
          );
        }

        // Get participant emails for email notifications
        const userEmails: string[] = [];
        for (const participantId of participants) {
          const userDoc = await getDocs(query(collection(db, 'employees'), where('__name__', '==', participantId)));
          if (!userDoc.empty) {
            const userData = userDoc.docs[0].data();
            userEmails.push(userData.email);
          }
        }

        // Send email notifications
        if (userEmails.length > 0) {
          await emailService.sendNotificationEmail(
            'chat_message',
            {
              chatName: chatData.name,
              senderName,
              message: content,
              timestamp: new Date().toLocaleString('no-NO')
            },
            userEmails,
            { chatId, eventType: 'chat_message' }
          );
        }
      }
    } catch (error) {
      console.error('Error sending chat notifications:', error);
    }
  }

  // Upload file
  async uploadFile(file: File): Promise<string> {
    if (!storage) throw new Error('Storage not initialized');

    const fileRef = ref(storage, `chat-files/${Date.now()}-${file.name}`);
    const snapshot = await uploadBytes(fileRef, file);
    return await getDownloadURL(snapshot.ref);
  }

  // Create new chat
  async createChat(
    name: string,
    participants: string[],
    participantNames: { [userId: string]: string },
    participantAvatars: { [userId: string]: string },
    isGroup: boolean = false,
    groupInfo?: any
  ) {
    if (!db) return;

    try {
      const chatData = {
        name,
        type: isGroup ? 'group' : 'private',
        participants,
        participantNames,
        participantAvatars,
        unreadCount: {},
        isGroup,
        groupInfo,
        settings: {
          readReceipts: true,
          notifications: true,
          archived: false,
          pinned: false,
          muted: false
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'chats'), chatData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  }

  // Mark messages as read
  async markMessagesAsRead(chatId: string, userId: string, messages: ChatMessage[]) {
    if (!db) return;

    try {
      const unreadMessages = messages.filter(
        msg => msg.senderId !== userId && !msg.readBy.includes(userId)
      );

      const batch = writeBatch(db);
      for (const message of unreadMessages) {
        const messageRef = doc(db, `chats/${chatId}/messages/${message.id}`);
        batch.update(messageRef, {
          readBy: [...message.readBy, userId]
        });
      }
      await batch.commit();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // Delete message
  async deleteMessage(chatId: string, messageId: string) {
    if (!db) return;

    try {
      await updateDoc(doc(db, `chats/${chatId}/messages/${messageId}`), {
        deleted: true,
        content: 'This message was deleted'
      });
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }

  // Edit message
  async editMessage(chatId: string, messageId: string, newContent: string) {
    if (!db) return;

    try {
      await updateDoc(doc(db, `chats/${chatId}/messages/${messageId}`), {
        content: newContent,
        edited: true,
        editedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error editing message:', error);
    }
  }

  // Add reaction
  async addReaction(chatId: string, messageId: string, userId: string, emoji: string) {
    if (!db) return;

    try {
      const messageRef = doc(db, `chats/${chatId}/messages/${messageId}`);
      const messageDoc = await getDocs(query(collection(db, `chats/${chatId}/messages`), where('__name__', '==', messageId)));
      
      if (!messageDoc.empty) {
        const messageData = messageDoc.docs[0].data() as ChatMessage;
        const reactions = { ...messageData.reactions };
        
        if (reactions[userId] === emoji) {
          delete reactions[userId];
        } else {
          reactions[userId] = emoji;
        }

        await updateDoc(messageRef, { reactions });
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  }

  // Forward message
  async forwardMessage(
    originalChatId: string,
    targetChatId: string,
    message: ChatMessage,
    senderId: string,
    senderName: string,
    senderAvatar: string | undefined
  ) {
    if (!db) return;

    try {
      const messageData = {
        senderId,
        senderName,
        senderAvatar,
        content: message.content,
        type: message.type,
        fileUrl: message.fileUrl,
        fileName: message.fileName,
        fileSize: message.fileSize,
        timestamp: serverTimestamp(),
        readBy: [senderId],
        edited: false,
        deleted: false,
        reactions: {},
        forwardedFrom: {
          messageId: message.id,
          chatId: originalChatId,
          senderName: message.senderName
        }
      };

      await addDoc(collection(db, `chats/${targetChatId}/messages`), messageData);
    } catch (error) {
      console.error('Error forwarding message:', error);
    }
  }

  // Update chat settings
  async updateChatSettings(chatId: string, settings: Partial<Chat['settings']>) {
    if (!db) return;

    try {
      await updateDoc(doc(db, 'chats', chatId), {
        settings: { ...settings },
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating chat settings:', error);
    }
  }

  // Archive chat
  async archiveChat(chatId: string, userId: string) {
    await this.updateChatSettings(chatId, { archived: true });
  }

  // Pin chat
  async pinChat(chatId: string, userId: string) {
    await this.updateChatSettings(chatId, { pinned: true });
  }

  // Mute chat
  async muteChat(chatId: string, userId: string) {
    await this.updateChatSettings(chatId, { muted: true });
  }

  // Leave group
  async leaveGroup(chatId: string, userId: string) {
    if (!db) return;

    try {
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDocs(query(collection(db, 'chats'), where('__name__', '==', chatId)));
      
      if (!chatDoc.empty) {
        const chatData = chatDoc.docs[0].data() as Chat;
        const updatedParticipants = chatData.participants.filter(id => id !== userId);
        const updatedParticipantNames = { ...chatData.participantNames };
        const updatedParticipantAvatars = { ...chatData.participantAvatars };
        
        delete updatedParticipantNames[userId];
        delete updatedParticipantAvatars[userId];

        await updateDoc(chatRef, {
          participants: updatedParticipants,
          participantNames: updatedParticipantNames,
          participantAvatars: updatedParticipantAvatars,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error leaving group:', error);
    }
  }
}

export const chatService = new ChatService();