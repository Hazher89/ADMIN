import Foundation
import FirebaseFirestore

enum ChatType: String, Codable, Equatable {
    case individual = "individual"
    case group = "group"
    case department = "department"
    case company = "company"
}

enum MessageStatus: String, Codable, Equatable {
    case sent = "sent"
    case delivered = "delivered"
    case read = "read"
    case failed = "failed"
}

enum MessageType: String, Codable, Equatable {
    case text = "text"
    case image = "image"
    case video = "video"
    case document = "document"
    case audio = "audio"
    case location = "location"
    case contact = "contact"
    case system = "system"
    case reply = "reply"
    case forward = "forward"
}

struct Chat: Identifiable, Codable, Equatable {
    var id: String?
    var name: String?
    var type: ChatType
    var participants: [String]
    var companyId: String
    var createdAt: Date
    var lastMessageAt: Date?
    var lastMessage: String?
    var lastMessageSender: String?
    var lastMessageStatus: MessageStatus?
    var unreadCount: Int
    var isActive: Bool
    var adminIds: [String]
    var avatar: String? // URL or emoji
    var isPinned: Bool
    var isMuted: Bool
    var typingUsers: [String] // User IDs who are currently typing
    
    init(name: String? = nil, type: ChatType, participants: [String], companyId: String, adminIds: [String] = [], avatar: String? = nil) {
        self.name = name
        self.type = type
        self.participants = participants
        self.companyId = companyId
        self.createdAt = Date()
        self.lastMessageAt = nil
        self.lastMessage = nil
        self.lastMessageSender = nil
        self.lastMessageStatus = nil
        self.unreadCount = 0
        self.isActive = true
        self.adminIds = adminIds
        self.avatar = avatar
        self.isPinned = false
        self.isMuted = false
        self.typingUsers = []
    }
    
    init(id: String, name: String? = nil, type: ChatType, participants: [String], companyId: String, adminIds: [String] = [], avatar: String? = nil) {
        self.id = id
        self.name = name
        self.type = type
        self.participants = participants
        self.companyId = companyId
        self.createdAt = Date()
        self.lastMessageAt = nil
        self.lastMessage = nil
        self.lastMessageSender = nil
        self.lastMessageStatus = nil
        self.unreadCount = 0
        self.isActive = true
        self.adminIds = adminIds
        self.avatar = avatar
        self.isPinned = false
        self.isMuted = false
        self.typingUsers = []
    }
    
    init(id: String, name: String? = nil, type: ChatType, participants: [String], companyId: String, createdAt: Date, lastMessageAt: Date? = nil, lastMessage: String? = nil, lastMessageSender: String? = nil, lastMessageStatus: MessageStatus? = nil, unreadCount: Int = 0, isActive: Bool = true, adminIds: [String] = [], avatar: String? = nil, isPinned: Bool = false, isMuted: Bool = false, typingUsers: [String] = []) {
        self.id = id
        self.name = name
        self.type = type
        self.participants = participants
        self.companyId = companyId
        self.createdAt = createdAt
        self.lastMessageAt = lastMessageAt
        self.lastMessage = lastMessage
        self.lastMessageSender = lastMessageSender
        self.lastMessageStatus = lastMessageStatus
        self.unreadCount = unreadCount
        self.isActive = isActive
        self.adminIds = adminIds
        self.avatar = avatar
        self.isPinned = isPinned
        self.isMuted = isMuted
        self.typingUsers = typingUsers
    }
}

struct ChatMessage: Identifiable, Codable, Equatable {
    var id: String?
    var text: String
    var senderId: String
    var senderName: String
    var chatId: String
    var companyId: String
    var createdAt: Date
    var mediaURLs: [String]
    var messageType: MessageType
    var isEdited: Bool
    var editedAt: Date?
    var replyToMessageId: String?
    var forwardedFrom: String? // Original sender ID
    var forwardedFromName: String?
    var status: MessageStatus
    var readBy: [String] // User IDs who have read the message
    var deliveredTo: [String] // User IDs who have received the message
    var location: LocationData?
    var contact: ContactData?
    var audioDuration: Double? // For audio messages
    var fileSize: Int64? // For documents
    var fileName: String? // For documents
    
    static func == (lhs: ChatMessage, rhs: ChatMessage) -> Bool {
        lhs.id == rhs.id && lhs.createdAt == rhs.createdAt
    }
    
    init(text: String, senderId: String, senderName: String, chatId: String, companyId: String, mediaURLs: [String] = [], messageType: MessageType = .text, replyToMessageId: String? = nil, forwardedFrom: String? = nil, forwardedFromName: String? = nil, location: LocationData? = nil, contact: ContactData? = nil, audioDuration: Double? = nil, fileSize: Int64? = nil, fileName: String? = nil) {
        self.text = text
        self.senderId = senderId
        self.senderName = senderName
        self.chatId = chatId
        self.companyId = companyId
        self.createdAt = Date()
        self.mediaURLs = mediaURLs
        self.messageType = messageType
        self.isEdited = false
        self.editedAt = nil
        self.replyToMessageId = replyToMessageId
        self.forwardedFrom = forwardedFrom
        self.forwardedFromName = forwardedFromName
        self.status = .sent
        self.readBy = []
        self.deliveredTo = []
        self.location = location
        self.contact = contact
        self.audioDuration = audioDuration
        self.fileSize = fileSize
        self.fileName = fileName
    }
    
    init(id: String, text: String, senderId: String, senderName: String, chatId: String, companyId: String, mediaURLs: [String] = [], messageType: MessageType = .text, replyToMessageId: String? = nil, forwardedFrom: String? = nil, forwardedFromName: String? = nil, location: LocationData? = nil, contact: ContactData? = nil, audioDuration: Double? = nil, fileSize: Int64? = nil, fileName: String? = nil) {
        self.id = id
        self.text = text
        self.senderId = senderId
        self.senderName = senderName
        self.chatId = chatId
        self.companyId = companyId
        self.createdAt = Date()
        self.mediaURLs = mediaURLs
        self.messageType = messageType
        self.isEdited = false
        self.editedAt = nil
        self.replyToMessageId = replyToMessageId
        self.forwardedFrom = forwardedFrom
        self.forwardedFromName = forwardedFromName
        self.status = .sent
        self.readBy = []
        self.deliveredTo = []
        self.location = location
        self.contact = contact
        self.audioDuration = audioDuration
        self.fileSize = fileSize
        self.fileName = fileName
    }
    
    init(id: String, text: String, senderId: String, senderName: String, chatId: String, companyId: String, createdAt: Date, mediaURLs: [String] = [], messageType: MessageType = .text, replyToMessageId: String? = nil, forwardedFrom: String? = nil, forwardedFromName: String? = nil, location: LocationData? = nil, contact: ContactData? = nil, audioDuration: Double? = nil, fileSize: Int64? = nil, fileName: String? = nil) {
        self.id = id
        self.text = text
        self.senderId = senderId
        self.senderName = senderName
        self.chatId = chatId
        self.companyId = companyId
        self.createdAt = createdAt
        self.mediaURLs = mediaURLs
        self.messageType = messageType
        self.isEdited = false
        self.editedAt = nil
        self.replyToMessageId = replyToMessageId
        self.forwardedFrom = forwardedFrom
        self.forwardedFromName = forwardedFromName
        self.status = .sent
        self.readBy = []
        self.deliveredTo = []
        self.location = location
        self.contact = contact
        self.audioDuration = audioDuration
        self.fileSize = fileSize
        self.fileName = fileName
    }
}

struct LocationData: Codable, Equatable {
    var latitude: Double
    var longitude: Double
    var address: String?
    var name: String?
}

struct ContactData: Codable, Equatable {
    var name: String
    var phone: String
    var email: String?
    var avatar: String?
}

// ChatUser model for user references in chat
struct ChatUser: Identifiable, Codable, Equatable {
    var id: String
    var name: String
    var email: String?
    var avatar: String?
    var isOnline: Bool
    var lastSeen: Date?
    var status: String? // "Available", "Busy", "Away", etc.
    var department: String?
    var role: String?
    
    init(id: String, name: String, email: String? = nil, avatar: String? = nil, isOnline: Bool = false, lastSeen: Date? = nil, status: String? = nil, department: String? = nil, role: String? = nil) {
        self.id = id
        self.name = name
        self.email = email
        self.avatar = avatar
        self.isOnline = isOnline
        self.lastSeen = lastSeen
        self.status = status
        self.department = department
        self.role = role
    }
}

// Story model for status updates
struct Story: Identifiable, Codable, Equatable {
    var id: String
    var user: ChatUser
    var image: String?
    var text: String?
    var timestamp: Date
    var expiresAt: Date
    var viewedBy: [String] // User IDs who have viewed the story
}

// ChatGroup model for group chats
struct ChatGroup: Identifiable, Codable, Equatable {
    var id: String
    var name: String
    var members: [ChatUser]
    var avatar: String // emoji eller bilde-URL
    var description: String?
    var createdBy: String
    var createdAt: Date
    var isActive: Bool
    var adminIds: [String]
}

// Typing indicator model
struct TypingIndicator: Codable, Equatable {
    var userId: String
    var userName: String
    var chatId: String
    var isTyping: Bool
    var timestamp: Date
}

// Chat notification settings
struct ChatNotificationSettings: Codable, Equatable {
    var chatId: String
    var userId: String
    var isMuted: Bool
    var muteUntil: Date?
    var showPreview: Bool
    var soundEnabled: Bool
    var vibrationEnabled: Bool
}