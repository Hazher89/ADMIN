import SwiftUI

struct MainTabView: View {
    @State private var selectedTab = 0
    @State private var showMorePanel = false
    var body: some View {
        TabView(selection: $selectedTab) {
            DashboardView()
                .tabItem {
                    Image(systemName: "house.fill")
                    Text("Dashboard")
                }.tag(0)
            ConversationListView()
                .tabItem {
                    Image(systemName: "bubble.left.and.bubble.right.fill")
                    Text("Samtaler")
                }.tag(1)
            DeviationListView()
                .tabItem {
                    Image(systemName: "exclamationmark.triangle.fill")
                    Text("Avvik")
                }.tag(2)
            ShiftPlanView()
                .tabItem {
                    Image(systemName: "calendar")
                    Text("Skiftplan")
                }.tag(3)
            AbsenceView()
                .tabItem {
                    Image(systemName: "figure.walk")
                    Text("Fravær & Ferie")
                }.tag(4)
            ClockInOutView()
                .tabItem {
                    Image(systemName: "clock.arrow.circlepath")
                    Text("Stemple inn")
                }.tag(5)
            MorePanelView(show: $showMorePanel)
                .tabItem {
                    Image(systemName: "ellipsis.circle")
                    Text("Mer")
                }.tag(6)
        }
        .accentColor(.blue)
        .sheet(isPresented: $showMorePanel) {
            MorePanelSheet()
        }
    }
}

struct MorePanelView: View {
    @Binding var show: Bool
    var body: some View {
        Button(action: { show = true }) {
            VStack {
                Image(systemName: "ellipsis.circle")
                    .font(.system(size: 28))
                Text("Mer")
            }
        }
    }
}

struct MorePanelSheet: View {
    var body: some View {
        NavigationView {
            List {
                NavigationLink(destination: DocumentListView()) {
                    Label("Dokumenter", systemImage: "doc.text.fill")
                }
                NavigationLink(destination: ProfileView()) {
                    Label("Profil", systemImage: "person.crop.circle")
                }
                // Legg til flere valg her om ønskelig
            }
            .navigationTitle("Flere valg")
        }
    }
}

#Preview {
    MainTabView()
} 