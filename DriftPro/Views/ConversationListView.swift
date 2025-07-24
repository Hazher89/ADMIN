import SwiftUI
import FirebaseFirestore

struct ConversationListView: View {
    @State private var showCreateOptions = false
    @State private var showUserSelection = false
    @State private var showCreateGroup = false
    @State private var users: [ChatUser] = []
    @State private var conversations: [Chat] = []
    @State private var isLoadingUsers = false
    @State private var selectedChatId: String?
    @State private var showChatView = false
    @State private var searchText = ""
    
    var body: some View {
        NavigationView {
            ZStack {
                Color(.systemGroupedBackground)
                    .ignoresSafeArea()
                
                VStack {
                    if conversations.isEmpty && users.isEmpty {
                        // Empty state
                        VStack(spacing: 24) {
                            Spacer()
                            
                            Image(systemName: "message.circle")
                                .font(.system(size: 80))
                                .foregroundColor(.gray)
                            
                            VStack(spacing: 8) {
                                Text("Ingen samtaler ennå")
                                    .font(.title2)
                                    .fontWeight(.semibold)
                                    .foregroundColor(.primary)
                                
                                Text("Start en samtale med en kollega eller opprett en gruppe")
                                    .font(.body)
                                    .foregroundColor(.secondary)
                                    .multilineTextAlignment(.center)
                            }
                            
                            Button(action: {
                                loadUsers()
                                showCreateOptions = true
                            }) {
                                Text("Start samtale")
                                    .font(.headline)
                                    .foregroundColor(.white)
                                    .padding()
                                    .background(Color.blue)
                                    .cornerRadius(12)
                            }
                            
                            Spacer()
                        }
                        .padding()
                    } else {
                        // Conversations and users list
                        List {
                            // Recent conversations
                            if !conversations.isEmpty {
                                Section(header: Text("Siste samtaler")) {
                                    ForEach(conversations) { conversation in
                                        ConversationRowView(conversation: conversation) {
                                            selectedChatId = conversation.id
                                            showChatView = true
                                        }
                                    }
                                }
                            }
                            
                            // Available users
                            if !users.isEmpty {
                                Section(header: Text("Tilgjengelige brukere")) {
                                    ForEach(filteredUsers) { user in
                                        UserRowView(user: user) {
                                            selectedChatId = user.id
                                            showChatView = true
                                        }
                                    }
                                }
                            }
                        }
                        .listStyle(PlainListStyle())
                        .searchable(text: $searchText, prompt: "Søk etter brukere")
                    }
                }
            }
            .navigationTitle("Chat")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        loadUsers()
                        showCreateOptions = true
                    }) {
                        Image(systemName: "plus")
                            .font(.title2)
                            .fontWeight(.medium)
                    }
                }
            }
            .actionSheet(isPresented: $showCreateOptions) {
                ActionSheet(
                    title: Text("Start ny samtale"),
                    message: Text("Velg hva du vil gjøre"),
                    buttons: [
                        .default(Text("Velg person")) {
                            showUserSelection = true
                        },
                        .default(Text("Opprett gruppe")) {
                            showCreateGroup = true
                        },
                        .cancel()
                    ]
                )
            }
            .sheet(isPresented: $showUserSelection) {
                UserSelectionView(
                    users: users,
                    isLoading: isLoadingUsers,
                    onUserSelected: { user in
                        selectedChatId = user.id
                        showChatView = true
                        showUserSelection = false
                    }
                )
            }
            .sheet(isPresented: $showCreateGroup) {
                CreateGroupView(
                    users: users,
                    isLoading: isLoadingUsers,
                    onGroupCreated: { groupId in
                        selectedChatId = groupId
                        showChatView = true
                        showCreateGroup = false
                    }
                )
            }
            .fullScreenCover(isPresented: $showChatView) {
                if let chatId = selectedChatId {
                    ChatView()
                }
            }
        }
        .onAppear {
            loadUsers()
            loadConversations()
        }
    }
    
    var filteredUsers: [ChatUser] {
        if searchText.isEmpty {
            return users
        } else {
            return users.filter { user in
                user.name.localizedCaseInsensitiveContains(searchText) ||
                (user.email?.localizedCaseInsensitiveContains(searchText) ?? false)
            }
        }
    }
    
    func loadUsers() {
        isLoadingUsers = true
        let db = Firestore.firestore()
        
        db.collection("users").getDocuments { snapshot, error in
            DispatchQueue.main.async {
                isLoadingUsers = false
                if let documents = snapshot?.documents {
                    self.users = documents.compactMap { doc in
                        let data = doc.data()
                        guard let name = data["name"] as? String else { return nil }
                        
                        return ChatUser(
                            id: doc.documentID,
                            name: name,
                            email: data["email"] as? String,
                            avatar: data["avatar"] as? String,
                            isOnline: data["isOnline"] as? Bool ?? false,
                            lastSeen: (data["lastSeen"] as? Timestamp)?.dateValue(),
                            status: data["status"] as? String,
                            department: data["department"] as? String,
                            role: data["role"] as? String
                        )
                    }
                }
            }
        }
    }
    
    func loadConversations() {
        let db = Firestore.firestore()
        
        db.collection("chats")
            .whereField("participants", arrayContains: "currentUserId") // Replace with actual user ID
            .order(by: "lastMessageAt", descending: true)
            .getDocuments { snapshot, error in
                DispatchQueue.main.async {
                    if let documents = snapshot?.documents {
                        self.conversations = documents.compactMap { doc in
                            let data = doc.data()
                            guard let typeString = data["type"] as? String,
                                  let type = ChatType(rawValue: typeString),
                                  let participants = data["participants"] as? [String],
                                  let companyId = data["companyId"] as? String else { return nil }
                            
                            return Chat(
                                id: doc.documentID,
                                name: data["name"] as? String,
                                type: type,
                                participants: participants,
                                companyId: companyId,
                                createdAt: (data["createdAt"] as? Timestamp)?.dateValue() ?? Date(),
                                lastMessageAt: (data["lastMessageAt"] as? Timestamp)?.dateValue(),
                                lastMessage: data["lastMessage"] as? String,
                                lastMessageSender: data["lastMessageSender"] as? String,
                                lastMessageStatus: MessageStatus(rawValue: data["lastMessageStatus"] as? String ?? "sent"),
                                unreadCount: data["unreadCount"] as? Int ?? 0,
                                isActive: data["isActive"] as? Bool ?? true,
                                adminIds: data["adminIds"] as? [String] ?? [],
                                avatar: data["avatar"] as? String,
                                isPinned: data["isPinned"] as? Bool ?? false,
                                isMuted: data["isMuted"] as? Bool ?? false,
                                typingUsers: data["typingUsers"] as? [String] ?? []
                            )
                        }
                    }
                }
            }
    }
}

struct ConversationRowView: View {
    let conversation: Chat
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                // Avatar
                if let avatar = conversation.avatar {
                    Text(avatar)
                        .font(.title2)
                        .frame(width: 50, height: 50)
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .clipShape(Circle())
                } else {
                    Circle()
                        .fill(Color.blue)
                        .frame(width: 50, height: 50)
                        .overlay(
                            Text(conversation.name?.prefix(1).uppercased() ?? "C")
                                .font(.title2)
                                .fontWeight(.semibold)
                                .foregroundColor(.white)
                        )
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(conversation.name ?? "Samtale")
                            .font(.body)
                            .fontWeight(.medium)
                            .foregroundColor(.primary)
                        
                        Spacer()
                        
                        if conversation.isPinned {
                            Image(systemName: "pin.fill")
                                .font(.caption)
                                .foregroundColor(.orange)
                        }
                        
                        if conversation.unreadCount > 0 {
                            Text("\(conversation.unreadCount)")
                                .font(.caption)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                                .frame(width: 20, height: 20)
                                .background(Color.red)
                                .clipShape(Circle())
                        }
                    }
                    
                    if let lastMessage = conversation.lastMessage {
                        Text(lastMessage)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                    }
                    
                    HStack {
                        if let lastMessageAt = conversation.lastMessageAt {
                            Text(lastMessageAt, style: .relative)
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                        
                        Spacer()
                        
                        if !conversation.typingUsers.isEmpty {
                            Text("Skriver...")
                                .font(.caption2)
                                .foregroundColor(.blue)
                        }
                    }
                }
            }
            .padding(.vertical, 4)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct UserRowView: View {
    let user: ChatUser
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                // Avatar
                if let avatar = user.avatar {
                    AsyncImage(url: URL(string: avatar)) { image in
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    } placeholder: {
                        Circle()
                            .fill(Color.blue)
                            .overlay(
                                Text(user.name.prefix(1).uppercased())
                                    .font(.title2)
                                    .fontWeight(.semibold)
                                    .foregroundColor(.white)
                            )
                    }
                    .frame(width: 50, height: 50)
                    .clipShape(Circle())
                } else {
                    Circle()
                        .fill(Color.blue)
                        .frame(width: 50, height: 50)
                        .overlay(
                            Text(user.name.prefix(1).uppercased())
                                .font(.title2)
                                .fontWeight(.semibold)
                                .foregroundColor(.white)
                        )
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(user.name)
                            .font(.body)
                            .fontWeight(.medium)
                            .foregroundColor(.primary)
                        
                        Spacer()
                        
                        // Online indicator
                        Circle()
                            .fill(user.isOnline ? Color.green : Color.gray)
                            .frame(width: 12, height: 12)
                    }
                    
                    if let status = user.status {
                        Text(status)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    } else if let lastSeen = user.lastSeen {
                        Text("Sist sett \(lastSeen, style: .relative)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    if let department = user.department {
                        Text(department)
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding(.vertical, 4)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct UserSelectionView: View {
    let users: [ChatUser]
    let isLoading: Bool
    let onUserSelected: (ChatUser) -> Void
    @Environment(\.presentationMode) var presentationMode
    @State private var searchText = ""
    
    var filteredUsers: [ChatUser] {
        if searchText.isEmpty {
            return users
        } else {
            return users.filter { user in
                user.name.localizedCaseInsensitiveContains(searchText) ||
                (user.email?.localizedCaseInsensitiveContains(searchText) ?? false)
            }
        }
    }
    
    var body: some View {
        NavigationView {
            VStack {
                if isLoading {
                    ProgressView("Laster brukere...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    List {
                        ForEach(filteredUsers) { user in
                            UserRowView(user: user) {
                                onUserSelected(user)
                            }
                        }
                    }
                    .listStyle(PlainListStyle())
                    .searchable(text: $searchText, prompt: "Søk etter brukere")
                }
            }
            .navigationTitle("Velg person")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Avbryt") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
        }
    }
}

struct CreateGroupView: View {
    let users: [ChatUser]
    let isLoading: Bool
    let onGroupCreated: (String) -> Void
    @Environment(\.presentationMode) var presentationMode
    @State private var groupName = ""
    @State private var selectedUsers: Set<String> = []
    @State private var searchText = ""
    @State private var isCreating = false
    
    var filteredUsers: [ChatUser] {
        if searchText.isEmpty {
            return users
        } else {
            return users.filter { user in
                user.name.localizedCaseInsensitiveContains(searchText)
            }
        }
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Group name input
                VStack(alignment: .leading, spacing: 8) {
                    Text("Gruppenavn")
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    TextField("Skriv gruppenavn", text: $groupName)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                }
                .padding()
                
                Divider()
                
                // Selected users
                if !selectedUsers.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Valgte medlemmer")
                            .font(.headline)
                            .foregroundColor(.primary)
                            .padding(.horizontal)
                        
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(users.filter { selectedUsers.contains($0.id) }) { user in
                                    HStack(spacing: 6) {
                                        Text(user.name)
                                            .font(.caption)
                                            .foregroundColor(.white)
                                        
                                        Button(action: {
                                            selectedUsers.remove(user.id)
                                        }) {
                                            Image(systemName: "xmark.circle.fill")
                                                .font(.caption)
                                                .foregroundColor(.white)
                                        }
                                    }
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(Color.blue)
                                    .cornerRadius(12)
                                }
                            }
                            .padding(.horizontal)
                        }
                    }
                    .padding(.vertical, 8)
                    
                    Divider()
                }
                
                // User selection
                VStack(alignment: .leading, spacing: 8) {
                    Text("Velg medlemmer")
                        .font(.headline)
                        .foregroundColor(.primary)
                        .padding(.horizontal)
                    
                    if isLoading {
                        ProgressView("Laster brukere...")
                            .frame(maxWidth: .infinity)
                            .padding()
                    } else {
                        List {
                            ForEach(filteredUsers) { user in
                                Button(action: {
                                    if selectedUsers.contains(user.id) {
                                        selectedUsers.remove(user.id)
                                    } else {
                                        selectedUsers.insert(user.id)
                                    }
                                }) {
                                    HStack(spacing: 12) {
                                        UserRowView(user: user) {
                                            // Handle user selection
                                        }
                                        
                                        Spacer()
                                        
                                        if selectedUsers.contains(user.id) {
                                            Image(systemName: "checkmark.circle.fill")
                                                .foregroundColor(.blue)
                                                .font(.title2)
                                        }
                                    }
                                    .padding(.vertical, 4)
                                }
                                .buttonStyle(PlainButtonStyle())
                            }
                        }
                        .listStyle(PlainListStyle())
                        .searchable(text: $searchText, prompt: "Søk etter brukere")
                    }
                }
            }
            .navigationTitle("Opprett gruppe")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Avbryt") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Opprett") {
                        createGroup()
                    }
                    .disabled(groupName.isEmpty || selectedUsers.isEmpty || isCreating)
                }
            }
        }
    }
    
    func createGroup() {
        guard !groupName.isEmpty && !selectedUsers.isEmpty else { return }
        
        isCreating = true
        let db = Firestore.firestore()
        
        let groupData: [String: Any] = [
            "name": groupName,
            "type": ChatType.group.rawValue,
            "participants": Array(selectedUsers),
            "companyId": "company1", // Replace with actual company ID
            "createdAt": FieldValue.serverTimestamp(),
            "createdBy": "currentUserId", // Replace with actual current user ID
            "adminIds": ["currentUserId"],
            "isActive": true,
            "isPinned": false,
            "isMuted": false,
            "typingUsers": []
        ]
        
        db.collection("chats").addDocument(data: groupData) { error in
            DispatchQueue.main.async {
                isCreating = false
                if error == nil {
                    onGroupCreated("")
                }
            }
        }
    }
} 