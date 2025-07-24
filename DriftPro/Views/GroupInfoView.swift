import SwiftUI
import Firebase

struct GroupInfoView: View {
    let groupId: String
    let groupName: String
    @Environment(\.presentationMode) var presentationMode
    @State private var groupMembers: [GroupMember] = []
    @State private var mediaCount = 383
    @State private var starredCount = 0
    @State private var notificationsEnabled = true
    @State private var chatTheme = "Standard"
    @State private var disappearingMessages = false
    @State private var lockConversation = false
    @State private var advancedPrivacy = false
    @State private var encryptionEnabled = true
    @State private var showAddMembers = false
    @State private var showGroupLink = false
    @State private var showEditGroup = false
    @State private var showVoiceCall = false
    @State private var showSearch = false
    @State private var showMedia = false
    @State private var showStarred = false
    @State private var showNotifications = false
    @State private var showChatTheme = false
    @State private var showSaveToPhotos = false
    @State private var showGroupPermissions = false
    @State private var showCommunity = false
    @State private var showEncryptionInfo = false
    @State private var showGroupDescription = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 0) {
                    // Group Header
                    VStack(spacing: 16) {
                        // Group Avatar
                        ZStack {
                            Circle()
                                .fill(LinearGradient(
                                    gradient: Gradient(colors: [.blue, .purple]),
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ))
                                .frame(width: 100, height: 100)
                            
                            Image(systemName: "chart.bar.fill")
                                .font(.system(size: 40, weight: .medium))
                                .foregroundColor(.white)
                        }
                        
                        VStack(spacing: 4) {
                            Text(groupName)
                                .font(.title2)
                                .fontWeight(.bold)
                            
                            Text("Gruppe · \(groupMembers.count) medlemmer")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.vertical, 24)
                    
                    // Action Buttons
                    HStack(spacing: 16) {
                        ActionButton(
                            title: "Taleanrop",
                            icon: "phone.fill",
                            color: .green
                        ) {
                            showVoiceCall = true
                        }
                        
                        ActionButton(
                            title: "Legg Til",
                            icon: "person.badge.plus",
                            color: .green
                        ) {
                            showAddMembers = true
                        }
                        
                        ActionButton(
                            title: "Søk",
                            icon: "magnifyingglass",
                            color: .green
                        ) {
                            showSearch = true
                        }
                    }
                    .padding(.horizontal)
                    .padding(.bottom, 24)
                    
                    // Group Description
                    Button(action: { showGroupDescription = true }) {
                        HStack {
                            Text("Legg til gruppebeskrivelse")
                                .foregroundColor(.green)
                            Spacer()
                        }
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(12)
                    }
                    .padding(.horizontal)
                    .padding(.bottom, 24)
                    
                    // Information Sections
                    VStack(spacing: 0) {
                        GroupInfoRow(
                            title: "Medier, lenker og dokumenter",
                            icon: "photo.on.rectangle",
                            count: "\(mediaCount)",
                            action: { showMedia = true }
                        )
                        
                        GroupInfoRow(
                            title: "Stjernemerket",
                            icon: "star",
                            status: starredCount == 0 ? "Ingen" : "\(starredCount)",
                            action: { showStarred = true }
                        )
                        
                        GroupInfoRow(
                            title: "Varsler",
                            icon: "bell",
                            status: notificationsEnabled ? "Alle" : "Av",
                            action: { showNotifications = true }
                        )
                        
                        GroupInfoRow(
                            title: "Samtaletema",
                            icon: "paintpalette",
                            action: { showChatTheme = true }
                        )
                        
                        GroupInfoRow(
                            title: "Lagre i Bilder",
                            icon: "square.and.arrow.down",
                            status: chatTheme,
                            action: { showSaveToPhotos = true }
                        )
                    }
                    .background(Color(.systemBackground))
                    .cornerRadius(12)
                    .padding(.horizontal)
                    .padding(.bottom, 16)
                    
                    // Privacy and Security
                    VStack(spacing: 0) {
                        GroupInfoRow(
                            title: "Meldinger som forsvinner",
                            icon: "clock.arrow.circlepath",
                            status: disappearingMessages ? "På" : "Av",
                            action: { disappearingMessages.toggle() }
                        )
                        
                        GroupInfoRow(
                            title: "Gruppetillatelser",
                            icon: "gearshape",
                            action: { showGroupPermissions = true }
                        )
                        
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Image(systemName: "lock")
                                    .foregroundColor(.blue)
                                    .frame(width: 24)
                                
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("Lås samtale")
                                        .font(.body)
                                    
                                    Text("Lås og skjul denne samtalen på denne enheten.")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                                
                                Spacer()
                                
                                Toggle("", isOn: $lockConversation)
                                    .labelsHidden()
                            }
                        }
                        .padding()
                        .background(Color(.systemBackground))
                    }
                    .background(Color(.systemBackground))
                    .cornerRadius(12)
                    .padding(.horizontal)
                    .padding(.bottom, 16)
                    
                    // Advanced Privacy
                    VStack(spacing: 0) {
                        GroupInfoRow(
                            title: "Avansert personvern for samtaler",
                            icon: "shield",
                            status: advancedPrivacy ? "På" : "Av",
                            action: { advancedPrivacy.toggle() }
                        )
                        
                        GroupInfoRow(
                            title: "Kryptering",
                            icon: "lock.shield",
                            subtitle: "Meldinger og samtaler er ende-til-ende-krypterte. Trykk for å lære mer.",
                            action: { showEncryptionInfo = true }
                        )
                    }
                    .background(Color(.systemBackground))
                    .cornerRadius(12)
                    .padding(.horizontal)
                    .padding(.bottom, 16)
                    
                    // Community
                    VStack(spacing: 0) {
                        GroupInfoRow(
                            title: "Legg til gruppe i et fellesskap",
                            icon: "person.3",
                            subtitle: "Bring medlemmer sammen i emnebaserte grupper.",
                            action: { showCommunity = true }
                        )
                    }
                    .background(Color(.systemBackground))
                    .cornerRadius(12)
                    .padding(.horizontal)
                    .padding(.bottom, 16)
                    
                    // Members Section
                    VStack(spacing: 0) {
                        HStack {
                            Text("\(groupMembers.count) medlemmer")
                                .font(.headline)
                            
                            Spacer()
                            
                            Button(action: { showSearch = true }) {
                                Image(systemName: "magnifyingglass")
                                    .foregroundColor(.blue)
                            }
                        }
                        .padding()
                        .background(Color(.systemBackground))
                        
                        Divider()
                        
                        Button(action: { showAddMembers = true }) {
                            HStack {
                                Image(systemName: "plus.circle.fill")
                                    .foregroundColor(.green)
                                    .frame(width: 24)
                                
                                Text("Legg til medlemmer")
                                    .foregroundColor(.primary)
                                
                                Spacer()
                            }
                            .padding()
                            .background(Color(.systemBackground))
                        }
                        
                        Divider()
                        
                        Button(action: { showGroupLink = true }) {
                            HStack {
                                Image(systemName: "link")
                                    .foregroundColor(.blue)
                                    .frame(width: 24)
                                
                                Text("Inviter via gruppelenke")
                                    .foregroundColor(.primary)
                                
                                Spacer()
                            }
                            .padding()
                            .background(Color(.systemBackground))
                        }
                        
                        Divider()
                        
                        // Members List
                        ForEach(groupMembers) { member in
                            MemberRow(member: member)
                            
                            if member.id != groupMembers.last?.id {
                                Divider()
                            }
                        }
                    }
                    .background(Color(.systemBackground))
                    .cornerRadius(12)
                    .padding(.horizontal)
                    .padding(.bottom, 24)
                }
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Gruppeinfo")
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarBackButtonHidden(true)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: { presentationMode.wrappedValue.dismiss() }) {
                        Image(systemName: "chevron.left")
                            .foregroundColor(.blue)
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Rediger") {
                        showEditGroup = true
                    }
                    .foregroundColor(.blue)
                }
            }
        }
        .onAppear {
            loadGroupMembers()
        }
        .sheet(isPresented: $showAddMembers) {
            AddMembersView(groupId: groupId)
        }
        .sheet(isPresented: $showGroupLink) {
            GroupLinkView(groupId: groupId, groupName: groupName)
        }
        .sheet(isPresented: $showEditGroup) {
            EditGroupView(groupId: groupId, groupName: groupName)
        }
        .sheet(isPresented: $showVoiceCall) {
            VoiceCallView(groupId: groupId, groupName: groupName)
        }
        .sheet(isPresented: $showSearch) {
            GroupSearchView(groupId: groupId, groupName: groupName)
        }
        .sheet(isPresented: $showMedia) {
            GroupMediaView(groupId: groupId, groupName: groupName)
        }
        .sheet(isPresented: $showStarred) {
            StarredMessagesView(groupId: groupId)
        }
        .sheet(isPresented: $showNotifications) {
            NotificationSettingsView(groupId: groupId)
        }
        .sheet(isPresented: $showChatTheme) {
            ChatThemeView(groupId: groupId)
        }
        .sheet(isPresented: $showSaveToPhotos) {
            SaveToPhotosView(groupId: groupId)
        }
        .sheet(isPresented: $showGroupPermissions) {
            GroupPermissionsView(groupId: groupId)
        }
        .sheet(isPresented: $showCommunity) {
            CommunityView(groupId: groupId)
        }
        .sheet(isPresented: $showEncryptionInfo) {
            EncryptionInfoView()
        }
        .sheet(isPresented: $showGroupDescription) {
            GroupDescriptionView(groupId: groupId, groupName: groupName)
        }
    }
    
    private func loadGroupMembers() {
        // Demo data for now
        groupMembers = [
            GroupMember(id: "1", name: "Du", avatar: "person.circle.fill", status: "Busy", role: "Admin", isCurrentUser: true),
            GroupMember(id: "2", name: "Ingrid MAVI", avatar: "person.circle.fill", status: "Heisann! Jeg bruker WhatsApp.", role: "Admin", isCurrentUser: false),
            GroupMember(id: "3", name: "Mavi Kjørekontor", avatar: "person.circle.fill", status: "Tilgjengelig", role: "Admin", isCurrentUser: false),
            GroupMember(id: "4", name: "Tommy Larsen", avatar: "person.circle.fill", status: "", role: "Admin", isCurrentUser: false),
            GroupMember(id: "5", name: "Zelim Jobb", avatar: "person.circle.fill", status: "Mavi logistikk", role: "Admin", isCurrentUser: false),
            GroupMember(id: "6", name: "Abd M18", avatar: "person.circle.fill", status: "شكرا جزيلا ❤️", role: "Medlem", isCurrentUser: false)
        ]
    }
}

struct GroupMember: Identifiable {
    let id: String
    let name: String
    let avatar: String
    let status: String
    let role: String
    let isCurrentUser: Bool
}

struct ActionButton: View {
    let title: String
    let icon: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 24, weight: .medium))
                    .foregroundColor(color)
                
                Text(title)
                    .font(.caption)
                    .foregroundColor(.primary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(Color(.systemGray6))
            .cornerRadius(12)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct GroupInfoRow: View {
    let title: String
    let icon: String
    var count: String? = nil
    var status: String? = nil
    var subtitle: String? = nil
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(.blue)
                    .frame(width: 24)
                
                VStack(alignment: .leading, spacing: 2) {
                    HStack {
                        Text(title)
                            .font(.body)
                            .foregroundColor(.primary)
                        
                        Spacer()
                        
                        if let count = count {
                            Text(count)
                                .font(.body)
                                .foregroundColor(.secondary)
                        } else if let status = status {
                            Text(status)
                                .font(.body)
                                .foregroundColor(.secondary)
                        }
                        
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    if let subtitle = subtitle {
                        Text(subtitle)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.leading)
                    }
                }
            }
            .padding()
            .background(Color(.systemBackground))
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct MemberRow: View {
    let member: GroupMember
    
    var body: some View {
        HStack(spacing: 12) {
            // Avatar
            ZStack {
                Circle()
                    .fill(avatarColor)
                    .frame(width: 44, height: 44)
                
                Image(systemName: member.avatar)
                    .font(.system(size: 20, weight: .medium))
                    .foregroundColor(.white)
            }
            
            VStack(alignment: .leading, spacing: 2) {
                HStack {
                    Text(member.name)
                        .font(.body)
                        .fontWeight(.medium)
                    
                    if member.isCurrentUser {
                        Text("(Du)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                    
                    Text(member.role)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Image(systemName: "chevron.right")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                if !member.status.isEmpty {
                    Text(member.status)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
    }
    
    private var avatarColor: Color {
        let colors: [Color] = [.blue, .green, .orange, .purple, .red, .pink]
        let index = abs(member.id.hashValue) % colors.count
        return colors[index]
    }
}

// Placeholder views for all the sheet presentations
struct AddMembersView: View {
    let groupId: String
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        NavigationView {
            VStack {
                Text("Legg til medlemmer")
                    .font(.title)
                    .padding()
                
                Spacer()
            }
            .navigationTitle("Legg til medlemmer")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Ferdig") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
        }
    }
}

struct GroupLinkView: View {
    let groupId: String
    let groupName: String
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        NavigationView {
            VStack {
                Text("Gruppelenke for \(groupName)")
                    .font(.title)
                    .padding()
                
                Spacer()
            }
            .navigationTitle("Gruppelenke")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Ferdig") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
        }
    }
}

struct EditGroupView: View {
    let groupId: String
    let groupName: String
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        NavigationView {
            VStack {
                Text("Rediger \(groupName)")
                    .font(.title)
                    .padding()
                
                Spacer()
            }
            .navigationTitle("Rediger gruppe")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Ferdig") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
        }
    }
}

struct VoiceCallView: View {
    let groupId: String
    let groupName: String
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        NavigationView {
            VStack {
                Text("Taleanrop til \(groupName)")
                    .font(.title)
                    .padding()
                
                Spacer()
            }
            .navigationTitle("Taleanrop")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Ferdig") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
        }
    }
}

struct GroupSearchView: View {
    let groupId: String
    let groupName: String
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        NavigationView {
            VStack {
                Text("Søk i \(groupName)")
                    .font(.title)
                    .padding()
                
                Spacer()
            }
            .navigationTitle("Søk")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Ferdig") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
        }
    }
}

struct GroupMediaView: View {
    let groupId: String
    let groupName: String
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        NavigationView {
            VStack {
                Text("Medier i \(groupName)")
                    .font(.title)
                    .padding()
                
                Spacer()
            }
            .navigationTitle("Medier")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Ferdig") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
        }
    }
}

struct StarredMessagesView: View {
    let groupId: String
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        NavigationView {
            VStack {
                Text("Stjernemerkede meldinger")
                    .font(.title)
                    .padding()
                
                Spacer()
            }
            .navigationTitle("Stjernemerket")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Ferdig") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
        }
    }
}

struct NotificationSettingsView: View {
    let groupId: String
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        NavigationView {
            VStack {
                Text("Varslingsinnstillinger")
                    .font(.title)
                    .padding()
                
                Spacer()
            }
            .navigationTitle("Varsler")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Ferdig") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
        }
    }
}

struct ChatThemeView: View {
    let groupId: String
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        NavigationView {
            VStack {
                Text("Samtaletema")
                    .font(.title)
                    .padding()
                
                Spacer()
            }
            .navigationTitle("Samtaletema")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Ferdig") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
        }
    }
}

struct SaveToPhotosView: View {
    let groupId: String
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        NavigationView {
            VStack {
                Text("Lagre i Bilder")
                    .font(.title)
                    .padding()
                
                Spacer()
            }
            .navigationTitle("Lagre i Bilder")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Ferdig") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
        }
    }
}

struct GroupPermissionsView: View {
    let groupId: String
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        NavigationView {
            VStack {
                Text("Gruppetillatelser")
                    .font(.title)
                    .padding()
                
                Spacer()
            }
            .navigationTitle("Gruppetillatelser")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Ferdig") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
        }
    }
}

struct CommunityView: View {
    let groupId: String
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        NavigationView {
            VStack {
                Text("Legg til i fellesskap")
                    .font(.title)
                    .padding()
                
                Spacer()
            }
            .navigationTitle("Fellesskap")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Ferdig") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
        }
    }
}

struct EncryptionInfoView: View {
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        NavigationView {
            VStack {
                Text("Ende-til-ende kryptering")
                    .font(.title)
                    .padding()
                
                Spacer()
            }
            .navigationTitle("Kryptering")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Ferdig") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
        }
    }
}

struct GroupDescriptionView: View {
    let groupId: String
    let groupName: String
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        NavigationView {
            VStack {
                Text("Gruppebeskrivelse for \(groupName)")
                    .font(.title)
                    .padding()
                
                Spacer()
            }
            .navigationTitle("Gruppebeskrivelse")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Ferdig") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
        }
    }
} 