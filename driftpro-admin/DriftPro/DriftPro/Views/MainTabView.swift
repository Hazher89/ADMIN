import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var firebaseManager: FirebaseManager
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            // Dashboard
            DashboardView()
                .tabItem {
                    Image(systemName: selectedTab == 0 ? "house.fill" : "house")
                        .renderingMode(.template)
                    Text("Oversikt")
                }
                .tag(0)
            
            // Deviations
            DeviationListView()
                .tabItem {
                    Image(systemName: selectedTab == 1 ? "exclamationmark.triangle.fill" : "exclamationmark.triangle")
                        .renderingMode(.template)
                    Text("Avvik")
                }
                .tag(1)
            
            // Documents
            DocumentListView()
                .tabItem {
                    Image(systemName: selectedTab == 3 ? "doc.text.fill" : "doc.text")
                        .renderingMode(.template)
                    Text("Dokumenter")
                }
                .tag(3)
            
            // Profile
            ProfileView()
                .tabItem {
                    Image(systemName: selectedTab == 4 ? "person.fill" : "person")
                        .renderingMode(.template)
                    Text("Profil")
                }
                .tag(4)
        }
        .accentColor(.blue)
        .onAppear {
            // Customize tab bar appearance
            let appearance = UITabBarAppearance()
            appearance.configureWithTransparentBackground()
            appearance.backgroundEffect = UIBlurEffect(style: .systemUltraThinMaterial)
            appearance.backgroundColor = UIColor.clear
            appearance.shadowImage = nil
            appearance.shadowColor = .clear
            UITabBar.appearance().standardAppearance = appearance
            UITabBar.appearance().scrollEdgeAppearance = appearance
        }
    }
}

#Preview {
    MainTabView()
        .environmentObject(FirebaseManager.shared)
} 