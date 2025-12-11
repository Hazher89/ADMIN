import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var firebaseManager: FirebaseManager
    @State private var recentDeviations: [Deviation] = []
    @State private var recentDocuments: [Document] = []
    @State private var unreadMessages = 0
    @State private var isLoading = true
    
    // Legg til @State for å styre sheets/navigation
    @State private var showDeviationList = false
    @State private var showDocumentList = false
    @State private var showMessage = false
    @State private var showRisk = false
    @State private var showControl = false
    @State private var showCalendar = false
    @State private var showNewDeviation = false
    @State private var showDocumentUpload = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Hero/velkomstseksjon
                    heroSection
                        .padding(.top, 24)
                        .padding(.bottom, 8)
                        .transition(.opacity.combined(with: .move(edge: .top)))
                    // Header with company info
                    headerSection
                        .padding(.vertical, 8)
                        .transition(.opacity.combined(with: .move(edge: .top)))
                    // Quick stats
                    statsSection
                        .padding(.vertical, 8)
                        .background(AppTheme.glassBackground(cornerRadius: 20))
                        .transition(.opacity.combined(with: .move(edge: .leading)))
                    // Quick actions
                    quickActionsSection
                        .padding(.vertical, 8)
                        .background(AppTheme.glassBackground(cornerRadius: 20))
                        .transition(.opacity.combined(with: .move(edge: .trailing)))
                    // Recent deviations
                    recentDeviationsSection
                        .padding(.vertical, 8)
                        .background(AppTheme.glassBackground(cornerRadius: 20))
                        .transition(.opacity.combined(with: .move(edge: .bottom)))
                    // Recent documents
                    recentDocumentsSection
                        .padding(.vertical, 8)
                        .background(AppTheme.glassBackground(cornerRadius: 20))
                        .transition(.opacity.combined(with: .move(edge: .bottom)))
                    // Birthday calendar
                    birthdaySection
                        .padding(.vertical, 8)
                        .background(AppTheme.glassBackground(cornerRadius: 20))
                        .transition(.opacity.combined(with: .move(edge: .bottom)))
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 32)
            }
            .background(AppTheme.mainGradient.ignoresSafeArea())
            .navigationTitle("")
            .navigationBarTitleDisplayMode(.inline)
            .refreshable {
                await loadDashboardData()
            }
        }
        .onAppear {
            Task {
                await loadDashboardData()
            }
        }
    }
    
    private var heroSection: some View {
        HStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(AppTheme.accentGradient)
                    .frame(width: 64, height: 64)
                Image(systemName: "person.crop.circle.fill")
                    .font(.system(size: 36, weight: .bold))
                    .foregroundColor(.white)
            }
            VStack(alignment: .leading, spacing: 4) {
                Text("God morgen, ")
                    .font(.system(size: 18, weight: .medium))
                    .foregroundColor(.white.opacity(0.8))
                Text(firebaseManager.currentUser?.firstName ?? "Bruker")
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
            }
            Spacer()
        }
        .padding(.horizontal, 8)
    }
    
    private var headerSection: some View {
        VStack(spacing: 12) {
            if firebaseManager.currentCompany != nil {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Velkommen tilbake!")
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(Color.secondary)
                        
                        if let user = firebaseManager.currentUser {
                            Text(user.firstName)
                                .font(.system(size: 24, weight: .bold))
                                .foregroundColor(Color.primary)
                        }
                    }
                    
                    Spacer()
                    
                    // Company logo
                    ZStack {
                        Circle()
                            .fill(LinearGradient(
                                gradient: Gradient(colors: [.blue, .purple]),
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ))
                            .frame(width: 50, height: 50)
                        
                        Image(systemName: "building.2.fill")
                            .font(.system(size: 24, weight: .medium))
                            .foregroundColor(.white)
                    }
                }
                .padding()
                .background(Color(.secondarySystemBackground))
                .cornerRadius(16)
                .shadow(color: Color.primary.opacity(0.05), radius: 8, x: 0, y: 2)
            }
        }
    }
    
    private var statsSection: some View {
        LazyVGrid(columns: [
            GridItem(.flexible()),
            GridItem(.flexible())
        ], spacing: 12) {
            StatCard(
                title: "Åpne avvik",
                value: "\(recentDeviations.filter { $0.status == .reported || $0.status == .underReview }.count)",
                icon: "exclamationmark.triangle.fill",
                color: .orange
            )
            
            StatCard(
                title: "Nye meldinger",
                value: "\(unreadMessages)",
                icon: "message.fill",
                color: .blue
            )
            
            StatCard(
                title: "Dokumenter",
                value: "\(recentDocuments.count)",
                icon: "doc.text.fill",
                color: .green
            )
            
            StatCard(
                title: "Aktive brukere",
                value: "24",
                icon: "person.2.fill",
                color: .purple
            )
        }
    }
    
    private var quickActionsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Hurtigvalg")
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(.primary)
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 16) {
                QuickActionButton(
                    title: "Rapporter avvik",
                    icon: "plus.circle.fill",
                    color: .red
                ) { showNewDeviation = true }
                
                QuickActionButton(
                    title: "Last opp dokument",
                    icon: "arrow.up.doc.fill",
                    color: .blue
                ) { showDocumentUpload = true }
                
                QuickActionButton(
                    title: "Ny melding",
                    icon: "message.fill",
                    color: .green
                ) { showMessage = true }
                
                QuickActionButton(
                    title: "Risikoanalyse",
                    icon: "chart.bar.fill",
                    color: .orange
                ) { showRisk = true }
                
                QuickActionButton(
                    title: "Internkontroll",
                    icon: "checklist.fill",
                    color: .purple
                ) { showControl = true }
                
                QuickActionButton(
                    title: "Kalender",
                    icon: "calendar.fill",
                    color: .pink
                ) { showCalendar = true }
            }
        }
        // Sheets for actions
        .sheet(isPresented: $showNewDeviation) {
            NewDeviationView().environmentObject(firebaseManager)
        }
        .sheet(isPresented: $showDocumentUpload) {
            DocumentUploadView().environmentObject(firebaseManager)
        }
        .sheet(isPresented: $showMessage) {
            VStack {
                Text("Meldingsfunksjon kommer snart!")
                    .font(.title2)
                    .padding()
                Button("Lukk") { showMessage = false }
            }
            .presentationDetents([.medium])
        }
        .sheet(isPresented: $showRisk) {
            VStack {
                Text("Risikoanalyse kommer snart!")
                    .font(.title2)
                    .padding()
                Button("Lukk") { showRisk = false }
            }
            .presentationDetents([.medium])
        }
        .sheet(isPresented: $showControl) {
            VStack {
                Text("Internkontroll kommer snart!")
                    .font(.title2)
                    .padding()
                Button("Lukk") { showControl = false }
            }
            .presentationDetents([.medium])
        }
        .sheet(isPresented: $showCalendar) {
            VStack {
                Text("Kalender kommer snart!")
                    .font(.title2)
                    .padding()
                Button("Lukk") { showCalendar = false }
            }
            .presentationDetents([.medium])
        }
    }
    
    private var recentDeviationsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Nylige avvik")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(.primary)
                
                Spacer()
                
                Button("Se alle") {
                    // TODO: Navigate to all deviations
                }
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(.blue)
            }
            
            if recentDeviations.isEmpty {
                EmptyStateView(
                    icon: "exclamationmark.triangle",
                    title: "Ingen avvik",
                    message: "Det er ingen rapporterte avvik for øyeblikket"
                )
            } else {
                ForEach(recentDeviations.prefix(3)) { deviation in
                    DeviationCard(deviation: deviation)
                }
            }
        }
    }
    
    private var recentDocumentsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Nylige dokumenter")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(.primary)
                
                Spacer()
                
                Button("Se alle") {
                    // TODO: Navigate to all documents
                }
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(.blue)
            }
            
            if recentDocuments.isEmpty {
                EmptyStateView(
                    icon: "doc.text",
                    title: "Ingen dokumenter",
                    message: "Det er ingen nylig opplastede dokumenter"
                )
            } else {
                ForEach(recentDocuments.prefix(3)) { document in
                    DocumentCard(document: document)
                }
            }
        }
    }
    
    private var birthdaySection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Bursdager denne måneden")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(.primary)
                
                Spacer()
                
                Button("Se kalender") {
                    // TODO: Navigate to birthday calendar
                }
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(.blue)
            }
            
            // TODO: Show birthday list
            Text("Ingen bursdager denne måneden")
                .font(.system(size: 16, weight: .medium))
                .foregroundColor(.secondary)
                .frame(maxWidth: .infinity, alignment: .center)
                .padding()
                .background(Color(.secondarySystemBackground))
                .cornerRadius(12)
        }
    }
    
    private func loadDashboardData() async {
        isLoading = true
        
        // Simuler lasting av data
        try? await Task.sleep(nanoseconds: 1_000_000_000) // 1 sekund
        
        // Sett mock/testdata for avvik
        recentDeviations = [
            Deviation(title: "Sikkerhetsbrudd i bygg A", description: "Dør låst ikke ordentlig", category: .safety, severity: .high, reportedBy: "user1", companyId: "company1"),
            Deviation(title: "Kvalitetsproblem produkt X", description: "Farge avvik fra standard", category: .quality, severity: .medium, reportedBy: "user2", companyId: "company1"),
            Deviation(title: "Avvik i prosess", description: "Maskin stoppet uventet", category: .process, severity: .low, reportedBy: "user3", companyId: "company1")
        ]
        
        recentDocuments = [
            Document(title: "Sikkerhetsrutiner 2024", category: .procedures, fileURL: "", fileName: "sikkerhet.pdf", fileSize: 1024000, fileType: "pdf", uploadedBy: "user1", uploadedByName: "Ola Nordmann", companyId: "company1"),
            Document(title: "HMS-rapport Q1", category: .hms, fileURL: "", fileName: "hms_q1.pdf", fileSize: 2048000, fileType: "pdf", uploadedBy: "user2", uploadedByName: "Kari Hansen", companyId: "company1")
        ]
        
        unreadMessages = 5
        
        isLoading = false
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .font(.system(size: 20, weight: .medium))
                    .foregroundColor(color)
                Spacer()
            }
            VStack(alignment: .leading, spacing: 4) {
                Text(value)
                    .font(.system(size: 24, weight: .bold))
                    .foregroundColor(.primary)
                Text(title)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(16)
        .shadow(color: Color.primary.opacity(0.05), radius: 8, x: 0, y: 2)
    }
}

struct QuickActionButton: View {
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
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.primary)
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 80)
            .background(Color(.secondarySystemBackground))
            .cornerRadius(12)
            .shadow(color: Color.primary.opacity(0.05), radius: 5, x: 0, y: 2)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct EmptyStateView: View {
    let icon: String
    let title: String
    let message: String
    
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 40))
                .foregroundColor(.secondary)
            
            Text(title)
                .font(.system(size: 18, weight: .medium))
                .foregroundColor(.primary)
            
            Text(message)
                .font(.system(size: 14))
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }
}

#Preview {
    DashboardView()
        .environmentObject(FirebaseManager.shared)
} 