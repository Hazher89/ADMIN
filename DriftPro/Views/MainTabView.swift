import SwiftUI

struct MainTabView: View {
    @State private var animateGradient = false
    var body: some View {
        ZStack {
            AnimatedBackground()
            DashboardView()
        }
        .ignoresSafeArea()
    }
}

struct AnimatedBackground: View {
    @State private var animate = false
    var body: some View {
        LinearGradient(gradient: Gradient(colors: [Color.purple, Color.blue, Color.black, Color.pink]), startPoint: animate ? .topLeading : .bottomTrailing, endPoint: animate ? .bottomTrailing : .topLeading)
            .animation(Animation.linear(duration: 12).repeatForever(autoreverses: true), value: animate)
            .onAppear { animate.toggle() }
            .blur(radius: 60)
            .opacity(0.85)
    }
} 