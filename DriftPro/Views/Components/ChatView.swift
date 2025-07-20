import SwiftUI
import Firebase

struct ChatView: View {
    @State private var messages: [ChatMessage] = []
    @State private var newMessage = ""
    @State private var loading = true
    // Fjern userId/chatId fra init, bruk mock
    let userId: String = "user1"
    let chatId: String = "user1_admin"
    let senderName: String = "Demo Bruker"
    let companyId: String = "company1"
    var body: some View {
        ZStack {
            LinearGradient(gradient: Gradient(colors: [Color.purple.opacity(0.3), Color.blue.opacity(0.3)]), startPoint: .topLeading, endPoint: .bottomTrailing)
                .ignoresSafeArea()
            VStack(spacing: 0) {
                HStack {
                    Text("Chat")
                        .font(.largeTitle).fontWeight(.bold)
                        .foregroundColor(.white)
                    Spacer()
                }.padding()
                if loading {
                    ProgressView("Laster meldinger...")
                } else {
                    ScrollViewReader { proxy in
                        ChatMessagesList(messages: messages, userId: userId)
                            .onChange(of: messages) { old, new in
                                if let lastId = messages.last?.id {
                                    withAnimation { proxy.scrollTo(lastId, anchor: .bottom) }
                                }
                            }
                    }
                }
                HStack {
                    TextField("Skriv en melding...", text: $newMessage)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                    Button(action: sendMessage) {
                        Image(systemName: "paperplane.fill").font(.title2)
                    }.disabled(newMessage.trimmingCharacters(in: .whitespaces).isEmpty)
                }
                .padding().background(BlurView(style: .systemMaterial))
            }
        }
        .onAppear(perform: listenForMessages)
    }
    func listenForMessages() {
        loading = true
        let db = Firestore.firestore()
        db.collection("chats").document(chatId).collection("messages").order(by: "createdAt").addSnapshotListener { snap, err in
            loading = false
            if let docs = snap?.documents {
                self.messages = docs.map { doc in
                    let d = doc.data()
                    guard let text = d["text"] as? String,
                          let senderId = d["senderId"] as? String,
                          let senderName = d["senderName"] as? String,
                          let chatId = d["chatId"] as? String,
                          let companyId = d["companyId"] as? String else {
                        print("[ChatView] Mangler data i melding: \(doc.documentID)");
                        return ChatMessage(text: "", senderId: "", senderName: "", chatId: "", companyId: "")
                    }
                    return ChatMessage(text: text, senderId: senderId, senderName: senderName, chatId: chatId, companyId: companyId, mediaURLs: d["mediaURLs"] as? [String] ?? [], messageType: .text, replyToMessageId: d["replyToMessageId"] as? String)
                }
            }
        }
    }
    func sendMessage() {
        let db = Firestore.firestore()
        db.collection("chats").document(chatId).collection("messages").addDocument(data: [
            "senderId": userId,
            "senderName": senderName,
            "chatId": chatId,
            "companyId": companyId,
            "text": newMessage,
            "createdAt": Date(),
            "mediaURLs": [],
            "messageType": "text"
        ]) { err in
            if err == nil {
                newMessage = ""
            }
        }
    }
}

struct ChatBubble: View {
    let message: ChatMessage
    let isMe: Bool
    var body: some View {
        HStack {
            if isMe { Spacer() }
            VStack(alignment: .leading, spacing: 4) {
                Text(message.text)
                    .padding(10)
                    .background(isMe ? Color.blue.opacity(0.8) : Color.gray.opacity(0.3))
                    .foregroundColor(isMe ? .white : .black)
                    .cornerRadius(16)
                Text("\(message.createdAt, formatter: timeFormatter)")
                    .font(.caption2).foregroundColor(.gray)
            }
            if !isMe { Spacer() }
        }
        .padding(isMe ? .leading : .trailing, 40)
        .id(message.id)
    }
}

private let timeFormatter: DateFormatter = {
    let df = DateFormatter()
    df.timeStyle = .short
    df.dateStyle = .short
    return df
}()

struct ChatMessagesList: View {
    let messages: [ChatMessage]
    let userId: String
    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                ForEach(messages) { msg in
                    ChatBubble(message: msg, isMe: msg.senderId == userId)
                }
            }.padding()
        }
    }
} 