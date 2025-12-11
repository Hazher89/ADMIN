import SwiftUI
import Firebase
import Combine

struct ProfileView: View {
    @EnvironmentObject var firebaseManager: FirebaseManager
    @State private var showingLogoutAlert = false
    @State private var showingSettings = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Profile header
                    profileHeaderSection
                    
                    // Quick stats
                    quickStatsSection
                    
                    // Menu items
                    menuItemsSection
                    
                    // Company info
                    companyInfoSection
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 20)
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Profil")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Innstillinger") {
                        showingSettings = true
                    }
                    .font(.system(size: 16, weight: .medium))
                }
            }
        }
        .alert("Logg ut", isPresented: $showingLogoutAlert) {
            Button("Avbryt", role: .cancel) { }
            Button("Logg ut", role: .destructive) {
                logout()
            }
        } message: {
            Text("Er du sikker på at du vil logge ut?")
        }
        .sheet(isPresented: $showingSettings) {
            SettingsView()
                .environmentObject(firebaseManager)
        }
    }
    
    private var profileHeaderSection: some View {
        VStack(spacing: 20) {
            if let user = firebaseManager.currentUser {
                // Profile image
                ZStack {
                    Circle()
                        .fill(LinearGradient(
                            gradient: Gradient(colors: [.blue, .purple]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ))
                        .frame(width: 100, height: 100)
                    
                    Text(user.initials)
                        .font(.system(size: 36, weight: .bold))
                        .foregroundColor(.white)
                }
                
                // User info
                VStack(spacing: 8) {
                    Text(user.fullName)
                        .font(.system(size: 24, weight: .bold))
                        .foregroundColor(.primary)
                    
                    Text(user.email)
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(.secondary)
                    
                    HStack(spacing: 16) {
                        Label(user.role.displayName, systemImage: "person.badge.key")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.blue)
                        
                        if let department = user.department {
                            Label(department, systemImage: "building.2")
                                .font(.system(size: 14, weight: .medium))
                                .foregroundColor(.green)
                        }
                    }
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.secondarySystemBackground))
                .shadow(color: Color.primary.opacity(0.08), radius: 12, x: 0, y: 4)
        )
    }
    
    private var quickStatsSection: some View {
        LazyVGrid(columns: [
            GridItem(.flexible()),
            GridItem(.flexible()),
            GridItem(.flexible())
        ], spacing: 12) {
            StatItem(title: "Rapporterte avvik", value: "12", icon: "exclamationmark.triangle.fill", color: .orange)
            StatItem(title: "Opplastede dokumenter", value: "8", icon: "doc.text.fill", color: .blue)
            StatItem(title: "Dager siden oppstart", value: "45", icon: "calendar", color: .green)
        }
    }
    
    private var menuItemsSection: some View {
        VStack(spacing: 0) {
            MenuRow(
                title: "Min aktivitet",
                icon: "chart.line.uptrend.xyaxis",
                color: .blue
            ) {
                // TODO: Navigate to activity
            }
            
            Divider()
                .padding(.leading, 56)
            
            MenuRow(
                title: "Mine avvik",
                icon: "exclamationmark.triangle",
                color: .orange
            ) {
                // TODO: Navigate to my deviations
            }
            
            Divider()
                .padding(.leading, 56)
            
            MenuRow(
                title: "Mine dokumenter",
                icon: "doc.text",
                color: .green
            ) {
                // TODO: Navigate to my documents
            }
            
            Divider()
                .padding(.leading, 56)
            
            MenuRow(
                title: "Bursdagskalender",
                icon: "calendar",
                color: .pink
            ) {
                // TODO: Navigate to birthday calendar
            }
            
            Divider()
                .padding(.leading, 56)
            
            MenuRow(
                title: "Hjelp og støtte",
                icon: "questionmark.circle",
                color: .purple
            ) {
                // TODO: Navigate to help
            }
        }
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.secondarySystemBackground))
                .shadow(color: Color.primary.opacity(0.08), radius: 12, x: 0, y: 4)
        )
    }
    
    private var companyInfoSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            if let company = firebaseManager.currentCompany {
                HStack {
                    Image(systemName: "building.2.fill")
                        .font(.system(size: 20, weight: .medium))
                        .foregroundColor(.blue)
                    
                    Text("Bedriftsinformasjon")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(.primary)
                    
                    Spacer()
                }
                
                VStack(alignment: .leading, spacing: 12) {
                    InfoRow(label: "Bedrift", value: company.name)
                    
                    if let address = company.address {
                        InfoRow(label: "Adresse", value: address)
                    }
                    
                    if let phone = company.phoneNumber {
                        InfoRow(label: "Telefon", value: phone)
                    }
                    
                    if let email = company.email {
                        InfoRow(label: "E-post", value: email)
                    }
                    
                    if let website = company.website {
                        InfoRow(label: "Nettside", value: website)
                    }
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.secondarySystemBackground))
                .shadow(color: Color.primary.opacity(0.08), radius: 12, x: 0, y: 4)
        )
    }
    
    private func logout() {
        do {
            try firebaseManager.signOut()
        } catch {
            print("Error signing out: \(error)")
        }
    }
}

struct StatItem: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 20, weight: .medium))
                .foregroundColor(color)
            
            Text(value)
                .font(.system(size: 18, weight: .bold))
                .foregroundColor(.primary)
            
            Text(title)
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(.secondarySystemBackground))
                .shadow(color: Color.primary.opacity(0.05), radius: 5, x: 0, y: 2)
        )
    }
}

struct MenuRow: View {
    let title: String
    let icon: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 16) {
                Image(systemName: icon)
                    .font(.system(size: 20, weight: .medium))
                    .foregroundColor(color)
                    .frame(width: 24)
                
                Text(title)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(.primary)
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.secondary)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 16)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

#Preview {
    ProfileView()
        .environmentObject(FirebaseManager.shared)
} 