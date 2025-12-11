import Foundation
import FirebaseFirestore

enum ChatType: String, Codable {
    case individual = "individual"
    case group = "group"
    case department = "department"
    case company = "company"
}

struct Chat: Identifiable, Codable {
    var id: String?
    let name: String?
    let type: ChatType
    let participants: [String]
    let companyId: String
    let createdAt: Date
    let lastMessageAt: Date?
    let lastMessage: String?
    let lastMessageSender: String?
    let isActive: Bool
    let adminIds: [String]
    
    init(name: String? = nil, type: ChatType, participants: [String], companyId: String, adminIds: [String] = []) {
        self.name = name
        self.type = type
        self.participants = participants
        self.companyId = companyId
        self.createdAt = Date()
        self.lastMessageAt = nil
        self.lastMessage = nil
        self.lastMessageSender = nil
        self.isActive = true
        self.adminIds = adminIds
    }
}

struct ChatMessage: Identifiable, Codable {
    var id: String?
    let text: String
    let senderId: String
    let senderName: String
    let chatId: String
    let companyId: String
    let createdAt: Date
    let mediaURLs: [String]
    let messageType: MessageType
    let isEdited: Bool
    let editedAt: Date?
    let replyToMessageId: String?
    
    init(text: String, senderId: String, senderName: String, chatId: String, companyId: String, mediaURLs: [String] = [], messageType: MessageType = .text, replyToMessageId: String? = nil) {
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
    }
}

enum MessageType: String, Codable {
    case text = "text"
    case image = "image"
    case video = "video"
    case document = "document"
    case audio = "audio"
    case system = "system"
} 