import SwiftUI
import Firebase

@MainActor
class DashboardViewModel: ObservableObject {
    @Published var newShifts: Int = 0
    func listenForNewShifts(userId: String) {
        let db = Firestore.firestore()
        db.collection("shifts").whereField("employeeId", isEqualTo: userId).whereField("status", isEqualTo: "ny").addSnapshotListener { snap, err in
            if let docs = snap?.documents {
                Task { @MainActor in self.newShifts = docs.count }
            }
        }
    }
}

struct DashboardView: View {
    var onNavigate: ((AppDestination) -> Void)? = nil
    let features: [(icon: String, color: [Color], destination: AppDestination, tooltip: String)] = [
        ("calendar.badge.clock", [Color.blue, Color.cyan], .shiftplan, "Skiftplan"),
        ("figure.walk", [Color.orange, Color.yellow], .absence, "Fravær"),
        ("doc.text", [Color.green, Color.teal], .absence, "Dokumenter"),
        ("person.crop.circle", [Color.purple, Color.indigo], .settings, "Profil"),
        ("bubble.left.and.bubble.right", [Color.pink, Color.red], .chat, "Chat"),
        ("gearshape", [Color.gray, Color.black], .settings, "Innstillinger")
    ]
    @State private var selectedIndex: Int? = nil
    @State private var showTooltip: Int? = nil
    @Namespace private var animation
    @GestureState private var dragOffset: CGSize = .zero
    @State private var contentOffset: CGSize = .zero
    @GestureState private var magnifyBy: CGFloat = 1.0
    @State private var scale: CGFloat = 1.0
    @State private var shouldCenter: Bool = false
    @StateObject private var viewModel = DashboardViewModel()
    let userId = "user1" // TODO: Hent fra auth
    var body: some View {
        ZStack {
            AnimatedBackground()
            if let idx = selectedIndex {
                FeatureModuleView(
                    feature: features[idx],
                    onBack: { withAnimation(.spring(response: 0.5, dampingFraction: 0.85)) { selectedIndex = nil } },
                    onNavigate: onNavigate
                )
                .transition(.scale.combined(with: .opacity))
            } else {
                GeometryReader { geo in
                    ZStack {
                        HoneycombMenu(
                            features: features,
                            selectedIndex: $selectedIndex,
                            showTooltip: $showTooltip,
                            contentOffset: $contentOffset,
                            dragOffset: dragOffset,
                            geo: geo,
                            scale: scale * magnifyBy,
                            newShifts: viewModel.newShifts
                        )
                    }
                    .frame(width: geo.size.width, height: geo.size.height)
                    .scaleEffect(scale * magnifyBy)
                    .offset(x: contentOffset.width + dragOffset.width, y: contentOffset.height + dragOffset.height)
                    .gesture(
                        SimultaneousGesture(
                            DragGesture(minimumDistance: 0.5, coordinateSpace: .local)
                                .updating($dragOffset) { value, state, _ in
                                    state = value.translation
                                }
                                .onEnded { value in
                                    let maxX = geo.size.width * 0.4
                                    let maxY = geo.size.height * 0.4
                                    var newX = contentOffset.width + value.translation.width
                                    var newY = contentOffset.height + value.translation.height
                                    // Hvis for langt ut, sentrer
                                    if abs(newX) > maxX { newX = 0 }
                                    if abs(newY) > maxY { newY = 0 }
                                    withAnimation(.spring(response: 0.7, dampingFraction: 0.85)) {
                                        contentOffset.width = newX
                                        contentOffset.height = newY
                                    }
                                },
                            MagnificationGesture()
                                .updating($magnifyBy) { value, state, _ in
                                    state = value
                                }
                                .onEnded { value in
                                    withAnimation(.spring(response: 0.5, dampingFraction: 0.85)) {
                                        scale *= value
                                        if scale < 0.7 { scale = 0.7 }
                                        if scale > 2.2 { scale = 2.2 }
                                    }
                                }
                        )
                    )
                    .animation(.interactiveSpring(response: 0.5, dampingFraction: 0.85), value: dragOffset)
                    .animation(.interactiveSpring(response: 0.5, dampingFraction: 0.85), value: scale)
                }
                .animation(.spring(response: 0.5, dampingFraction: 0.8), value: selectedIndex)
                .onAppear { viewModel.listenForNewShifts(userId: userId) }
            }
        }
    }
}

struct HoneycombMenu: View {
    let features: [(icon: String, color: [Color], destination: AppDestination, tooltip: String)]
    @Binding var selectedIndex: Int?
    @Binding var showTooltip: Int?
    @Binding var contentOffset: CGSize
    var dragOffset: CGSize
    let geo: GeometryProxy
    var scale: CGFloat
    var newShifts: Int
    let iconSize: CGFloat = 80
    let spacing: CGFloat = 18
    var body: some View {
        let cols = Int(ceil(sqrt(Double(features.count))))
        let rows = Int(ceil(Double(features.count) / Double(cols)))
        let gridWidth = CGFloat(cols) * (iconSize + spacing) - spacing
        let gridHeight = CGFloat(rows) * (iconSize * 0.95 + spacing) - spacing
        let baseX = geo.size.width/2 - gridWidth/2
        let baseY = geo.size.height/2 - gridHeight/2
        ForEach(0..<features.count, id: \ .self) { idx in
            let row = idx / cols
            let col = idx % cols
            let x = baseX + CGFloat(col) * (iconSize + spacing) + iconSize/2
            let y = baseY + CGFloat(row) * (iconSize * 0.95 + spacing) + iconSize/2
            ZStack {
                Button(action: {
                    withAnimation(.spring(response: 0.5, dampingFraction: 0.85)) { selectedIndex = idx }
                }) {
                    ZStack {
                        Circle()
                            .fill(LinearGradient(gradient: Gradient(colors: features[idx].color), startPoint: .topLeading, endPoint: .bottomTrailing))
                            .frame(width: iconSize, height: iconSize)
                            .shadow(color: features[idx].color.first!.opacity(0.3), radius: 12, x: 0, y: 6)
                            .overlay(
                                Circle()
                                    .strokeBorder(Color.white.opacity(0.18), lineWidth: 3)
                                    .blur(radius: 1)
                            )
                            .scaleEffect(showTooltip == idx ? 1.12 : 1.0)
                            .opacity(selectedIndex == nil ? 1 : 0.7)
                            .animation(.easeInOut(duration: 0.3).repeatForever(autoreverses: true), value: showTooltip == idx)
                        Image(systemName: features[idx].icon)
                            .font(.system(size: 36, weight: .bold))
                            .foregroundColor(.white)
                            .shadow(radius: 6)
                            .scaleEffect(showTooltip == idx ? 1.15 : 1.0)
                        if idx == 0 && newShifts > 0 {
                            // Badge for nye skift
                            ZStack {
                                Circle().fill(Color.red).frame(width: 24, height: 24)
                                Text("\(newShifts)")
                                    .font(.caption2.bold())
                                    .foregroundColor(.white)
                            }
                            .offset(x: 28, y: -28)
                            .transition(.scale)
                        }
                    }
                }
                .simultaneousGesture(
                    LongPressGesture(minimumDuration: 0.5)
                        .onEnded { _ in showTooltip = idx }
                )
                .onChange(of: showTooltip) { newValue in
                    if newValue != idx { showTooltip = nil }
                }
                VStack(spacing: 4) {
                    Spacer().frame(height: iconSize/2 + 8)
                    Text(features[idx].tooltip)
                        .font(.caption.bold())
                        .foregroundColor(.white)
                        .shadow(radius: 2)
                        .opacity(0.95)
                }
                .offset(y: iconSize/2 + 8)
            }
            .position(x: x, y: y)
            .animation(.spring(response: 0.7, dampingFraction: 0.8), value: dragOffset)
        }
    }
}

struct FeatureModuleView: View {
    let feature: (icon: String, color: [Color], destination: AppDestination, tooltip: String)
    var onBack: () -> Void
    var onNavigate: ((AppDestination) -> Void)?
    var body: some View {
        ZStack(alignment: .topLeading) {
            Color(.systemBackground).ignoresSafeArea()
            VStack(spacing: 0) {
                HStack {
                    Spacer()
                }
                .frame(height: 0)
                HStack {
                    Button(action: onBack) {
                        Image(systemName: "chevron.left")
                            .font(.title2)
                            .foregroundColor(.primary)
                            .padding(.top, 12)
                            .padding(.leading, 20)
                            .padding(.bottom, 8)
                    }
                    Spacer()
                }
                .padding(.top, 44) // Rett under statusbar/klokke
                .background(Color(.systemBackground).opacity(0.95))
                .zIndex(1)
                Text(feature.tooltip)
                    .font(.largeTitle).bold()
                    .padding(.bottom, 16)
                // Naviger til riktig modul
                switch feature.destination {
                case .shiftplan:
                    ShiftPlanView()
                case .absence:
                    AbsenceView()
                case .chat:
                    ChatView()
                case .settings:
                    ProfileView()
                default:
                    Text("Modul ikke implementert")
                }
                Spacer()
            }
        }
    }
}

// BlurView for glassmorphism
import UIKit
struct BlurView: UIViewRepresentable {
    var style: UIBlurEffect.Style
    func makeUIView(context: Context) -> UIVisualEffectView {
        UIVisualEffectView(effect: UIBlurEffect(style: style))
    }
    func updateUIView(_ uiView: UIVisualEffectView, context: Context) {}
}

// Mock Shift
struct Shift: Identifiable {
    var id: String
    var type: String
    var time: String
    var date: String
    var resource: String
    var comment: String
    var status: String
    var accepted: Bool
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