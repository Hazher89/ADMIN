import SwiftUI
import Firebase
import PhotosUI

struct ChatView: View {
    @State private var messages: [ChatMessage] = []
    @State private var newMessage = ""
    @State private var loading = true
    @State private var isTyping = false
    @State private var showAttachmentOptions = false
    @State private var showReplyTo: ChatMessage? = nil
    @State private var selectedPhotos: [PhotosPickerItem] = []
    @State private var showingImagePicker = false
    @State private var showingDocumentPicker = false
    @State private var showingLocationPicker = false
    @State private var showingContactPicker = false
    
    let userId: String = "user1"
    let chatId: String = "user1_admin"
    let senderName: String = "Demo Bruker"
    let companyId: String = "company1"
    let otherUserName: String = "Admin"
    
    var body: some View {
        ZStack {
            Color(.systemGroupedBackground)
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Chat Header
                ChatHeaderView(
                    userName: otherUserName,
                    isOnline: true,
                    lastSeen: Date(),
                    onBack: { /* Handle back */ },
                    onMore: { showAttachmentOptions = true }
                )
                
                // Messages
                if loading {
                    ProgressView("Laster meldinger...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    ScrollViewReader { proxy in
                        ChatMessagesList(
                            messages: messages,
                            userId: userId,
                            onReply: { message in
                                showReplyTo = message
                            },
                            onLongPress: { message in
                                showMessageOptions(message)
                            }
                        )
                        .onChange(of: messages) { old, new in
                            if let lastId = messages.last?.id {
                                withAnimation(.easeInOut(duration: 0.3)) {
                                    proxy.scrollTo(lastId, anchor: .bottom)
                                }
                            }
                        }
                    }
                }
                
                // Typing indicator
                if isTyping {
                    TypingIndicatorView(userName: otherUserName)
                }
                
                // Reply preview
                if let replyTo = showReplyTo {
                    ReplyPreviewView(
                        messageId: replyTo.id ?? "",
                        messageText: replyTo.text,
                        onCancel: { showReplyTo = nil }
                    )
                }
                
                // Message input
                MessageInputView(
                    text: $newMessage,
                    onSend: sendMessage,
                    onAttachment: { showAttachmentOptions = true },
                    onCamera: { /* Handle camera */ },
                    onMicrophone: { /* Handle voice message */ },
                    isReplyMode: showReplyTo != nil
                )
            }
        }
        .onAppear(perform: setupChat)
        .actionSheet(isPresented: $showAttachmentOptions) {
            ActionSheet(
                title: Text("Velg vedlegg"),
                buttons: [
                    .default(Text("📷 Kamera")) { /* Handle camera */ },
                    .default(Text("🖼️ Bilde")) { showingImagePicker = true },
                    .default(Text("📄 Dokument")) { showingDocumentPicker = true },
                    .default(Text("📍 Plassering")) { showingLocationPicker = true },
                    .default(Text("👤 Kontakt")) { showingContactPicker = true },
                    .cancel()
                ]
            )
        }
        .photosPicker(isPresented: $showingImagePicker, selection: $selectedPhotos, matching: .images)
        .onChange(of: selectedPhotos) { old, new in
            handleSelectedPhotos(new)
        }
    }
    
    func setupChat() {
        loading = true
        listenForMessages()
        listenForTyping()
        markChatAsRead()
    }
    
    func listenForMessages() {
        let db = Firestore.firestore()
        db.collection("chats").document(chatId).collection("messages")
            .order(by: "createdAt")
            .addSnapshotListener { snap, err in
                loading = false
                if let docs = snap?.documents {
                    self.messages = docs.map { doc in
                        let d = doc.data()
                        return ChatMessage(
                            id: doc.documentID,
                            text: d["text"] as? String ?? "",
                            senderId: d["senderId"] as? String ?? "",
                            senderName: d["senderName"] as? String ?? "",
                            chatId: d["chatId"] as? String ?? "",
                            companyId: d["companyId"] as? String ?? "",
                            createdAt: (d["createdAt"] as? Timestamp)?.dateValue() ?? Date(),
                            mediaURLs: d["mediaURLs"] as? [String] ?? [],
                            messageType: MessageType(rawValue: d["messageType"] as? String ?? "text") ?? .text,
                            replyToMessageId: d["replyToMessageId"] as? String
                        )
                    }
                }
            }
    }
    
    func listenForTyping() {
        let db = Firestore.firestore()
        db.collection("chats").document(chatId).collection("typing")
            .addSnapshotListener { snap, err in
                if let docs = snap?.documents {
                    let typingUsers = docs.filter { doc in
                        let data = doc.data()
                        return data["isTyping"] as? Bool == true && 
                               data["userId"] as? String != userId
                    }
                    isTyping = !typingUsers.isEmpty
                }
            }
    }
    
    func sendMessage() {
        guard !newMessage.trimmingCharacters(in: .whitespaces).isEmpty else { return }
        
        let db = Firestore.firestore()
        let messageData: [String: Any] = [
            "senderId": userId,
            "senderName": senderName,
            "chatId": chatId,
            "companyId": companyId,
            "text": newMessage,
            "createdAt": Date(),
            "mediaURLs": [],
            "messageType": "text",
            "status": "sent",
            "replyToMessageId": showReplyTo?.id as Any,
            "readBy": [],
            "deliveredTo": []
        ]
        
        db.collection("chats").document(chatId).collection("messages")
            .addDocument(data: messageData) { err in
                if err == nil {
                    newMessage = ""
                    showReplyTo = nil
                    updateLastMessage(newMessage)
                }
            }
    }
    
    func updateLastMessage(_ text: String) {
        let db = Firestore.firestore()
        db.collection("chats").document(chatId).updateData([
            "lastMessage": text,
            "lastMessageAt": Date(),
            "lastMessageSender": senderName,
            "lastMessageStatus": "sent"
        ])
    }
    
    func markChatAsRead() {
        let db = Firestore.firestore()
        // Mark all messages as read by current user
        db.collection("chats").document(chatId).collection("messages")
            .whereField("senderId", isNotEqualTo: userId)
            .getDocuments { snap, err in
                if let docs = snap?.documents {
                    for doc in docs {
                        doc.reference.updateData([
                            "readBy": FieldValue.arrayUnion([userId])
                        ])
                    }
                }
            }
    }
    
    func handleSelectedPhotos(_ items: [PhotosPickerItem]) {
        // Handle photo selection and upload
        for item in items {
            item.loadTransferable(type: Data.self) { result in
                switch result {
                case .success(let data):
                    if let image = UIImage(data: data ?? Data()) {
                        // Upload image and send message
                        uploadImageAndSend(image)
                    }
                case .failure(let error):
                    print("Error loading image: \(error)")
                }
            }
        }
    }
    
    func uploadImageAndSend(_ image: UIImage) {
        // Simulate image upload and send message
        let db = Firestore.firestore()
        let messageData: [String: Any] = [
            "senderId": userId,
            "senderName": senderName,
            "chatId": chatId,
            "companyId": companyId,
            "text": "📷 Bilde",
            "createdAt": Date(),
            "mediaURLs": ["image_url_placeholder"],
            "messageType": "image",
            "status": "sent"
        ]
        
        db.collection("chats").document(chatId).collection("messages")
            .addDocument(data: messageData)
    }
    
    func showMessageOptions(_ message: ChatMessage) {
        // Show message options (reply, forward, copy, delete)
    }
}

// MARK: - Supporting Views

struct ChatHeaderView: View {
    let userName: String
    let isOnline: Bool
    let lastSeen: Date
    let onBack: () -> Void
    let onMore: () -> Void
    
    var body: some View {
        HStack(spacing: 12) {
            Button(action: onBack) {
                Image(systemName: "chevron.left")
                    .font(.title2)
                    .foregroundColor(.blue)
            }
            
            // Avatar
            Circle()
                .fill(Color.blue)
                .frame(width: 40, height: 40)
                .overlay(
                    Text(userName.prefix(1).uppercased())
                        .font(.title3)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                )
            
            VStack(alignment: .leading, spacing: 2) {
                Text(userName)
                    .font(.headline)
                    .fontWeight(.semibold)
                
                HStack(spacing: 4) {
                    Circle()
                        .fill(isOnline ? Color.green : Color.gray)
                        .frame(width: 8, height: 8)
                    
                    Text(isOnline ? "Online" : "Sist sett \(lastSeen, formatter: timeFormatter)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            Button(action: onMore) {
                Image(systemName: "ellipsis")
                    .font(.title2)
                    .foregroundColor(.blue)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .shadow(color: .black.opacity(0.1), radius: 1, x: 0, y: 1)
    }
}

struct TypingIndicatorView: View {
    let userName: String
    
    var body: some View {
        HStack(spacing: 8) {
            Text("\(userName) skriver...")
                .font(.caption)
                .foregroundColor(.secondary)
            
            HStack(spacing: 4) {
                ForEach(0..<3) { index in
                    Circle()
                        .fill(Color.gray)
                        .frame(width: 6, height: 6)
                        .scaleEffect(1.0)
                        .animation(
                            Animation.easeInOut(duration: 0.6)
                                .repeatForever()
                                .delay(Double(index) * 0.2),
                            value: index
                        )
                }
            }
            
            Spacer()
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(Color(.systemBackground))
    }
}

struct ReplyPreviewView: View {
    let messageId: String
    let messageText: String
    let onCancel: () -> Void
    
    var body: some View {
        HStack(spacing: 12) {
            Rectangle()
                .fill(Color.blue)
                .frame(width: 4)
            
            VStack(alignment: .leading, spacing: 4) {
                Text("Svar til melding")
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.blue)
                
                Text(messageText)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
            }
            
            Spacer()
            
            Button(action: onCancel) {
                Image(systemName: "xmark.circle.fill")
                    .foregroundColor(.gray)
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(Color(.systemGray6))
    }
}

struct MessageInputView: View {
    @Binding var text: String
    let onSend: () -> Void
    let onAttachment: () -> Void
    let onCamera: () -> Void
    let onMicrophone: () -> Void
    let isReplyMode: Bool
    
    var body: some View {
        HStack(spacing: 12) {
            // Attachment button
            Button(action: onAttachment) {
                Image(systemName: "plus")
                    .font(.title2)
                    .foregroundColor(.blue)
            }
            
            // Camera button
            Button(action: onCamera) {
                Image(systemName: "camera")
                    .font(.title2)
                    .foregroundColor(.blue)
            }
            
            // Text input
            TextField("Skriv en melding...", text: $text)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .disabled(isReplyMode)
            
            // Send/Microphone button
            Button(action: text.isEmpty ? onMicrophone : onSend) {
                Image(systemName: text.isEmpty ? "mic.fill" : "paperplane.fill")
                    .font(.title2)
                    .foregroundColor(.white)
                    .frame(width: 40, height: 40)
                    .background(text.isEmpty ? Color.gray : Color.blue)
                    .clipShape(Circle())
            }
            .disabled(text.trimmingCharacters(in: .whitespaces).isEmpty && !isReplyMode)
        }
        .padding()
        .background(Color(.systemBackground))
        .shadow(color: .black.opacity(0.1), radius: 1, x: 0, y: -1)
    }
}

struct ChatMessagesList: View {
    let messages: [ChatMessage]
    let userId: String
    let onReply: (ChatMessage) -> Void
    let onLongPress: (ChatMessage) -> Void
    
    var body: some View {
        ScrollView {
            LazyVStack(spacing: 8) {
                ForEach(messages) { message in
                    ChatBubble(
                        message: message,
                        isMe: message.senderId == userId,
                        onReply: { onReply(message) },
                        onLongPress: { onLongPress(message) }
                    )
                }
            }
            .padding()
        }
    }
}

struct ChatBubble: View {
    let message: ChatMessage
    let isMe: Bool
    let onReply: () -> Void
    let onLongPress: () -> Void
    
    var body: some View {
        HStack {
            if isMe { Spacer() }
            
            VStack(alignment: isMe ? .trailing : .leading, spacing: 4) {
                // Reply preview if exists
                if let replyToId = message.replyToMessageId {
                    ReplyPreviewInBubble(replyToId: replyToId)
                }
                
                // Message content
                VStack(alignment: isMe ? .trailing : .leading, spacing: 2) {
                    Text(message.text)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(isMe ? Color.blue : Color(.systemGray5))
                        .foregroundColor(isMe ? .white : .primary)
                        .cornerRadius(16)
                    
                    // Message status and time
                    HStack(spacing: 4) {
                        Text("\(message.createdAt, formatter: timeFormatter)")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                        
                        if isMe {
                            MessageStatusView(status: message.status)
                        }
                    }
                }
            }
            
            if !isMe { Spacer() }
        }
        .onLongPressGesture {
            onLongPress()
        }
        .id(message.id)
    }
}

struct ReplyPreviewInBubble: View {
    let replyToId: String
    
    var body: some View {
        HStack(spacing: 8) {
            Rectangle()
                .fill(Color.blue)
                .frame(width: 2)
            
            VStack(alignment: .leading, spacing: 2) {
                Text("Svar")
                    .font(.caption2)
                    .fontWeight(.medium)
                    .foregroundColor(.blue)
                
                Text("Original melding...")
                    .font(.caption2)
                    .foregroundColor(.secondary)
                    .lineLimit(1)
            }
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(Color(.systemGray6))
        .cornerRadius(8)
    }
}

struct MessageStatusView: View {
    let status: MessageStatus
    
    var body: some View {
        HStack(spacing: 2) {
            switch status {
            case .sent:
                Image(systemName: "checkmark")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            case .delivered:
                Image(systemName: "checkmark")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            case .read:
                Image(systemName: "checkmark")
                    .font(.caption2)
                    .foregroundColor(.blue)
            case .failed:
                Image(systemName: "exclamationmark")
                    .font(.caption2)
                    .foregroundColor(.red)
            }
        }
    }
}

private let timeFormatter: DateFormatter = {
    let df = DateFormatter()
    df.timeStyle = .short
    return df
}() 