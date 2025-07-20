import SwiftUI

struct LoadingView: View {
    @State private var isAnimating = false
    
    var body: some View {
        ZStack {
            // Background gradient
            AppTheme.mainGradient.ignoresSafeArea()
            
            // Glass overlay
            AppTheme.glassBackground(cornerRadius: 0)
                .ignoresSafeArea()
            
            VStack(spacing: 32) {
                // Logo
                VStack(spacing: 20) {
                    ZStack {
                        Circle()
                            .fill(AppTheme.accentGradient)
                            .frame(width: 120, height: 120)
                            .opacity(0.3)
                            .scaleEffect(isAnimating ? 1.1 : 1.0)
                            .animation(.easeInOut(duration: 2.0).repeatForever(autoreverses: true), value: isAnimating)
                        
                        Image(systemName: "building.2.fill")
                            .font(.system(size: 60, weight: .light))
                            .foregroundColor(.white)
                            .scaleEffect(isAnimating ? 1.1 : 1.0)
                            .animation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true), value: isAnimating)
                    }
                    
                    Text("DriftPro")
                        .font(.system(size: 36, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                        .opacity(isAnimating ? 0.8 : 1.0)
                        .animation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true), value: isAnimating)
                }
                
                // Loading indicator
                VStack(spacing: 20) {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        .scaleEffect(1.4)
                    
                    Text("Laster...")
                        .font(.system(size: 18, weight: .medium))
                        .foregroundColor(.white.opacity(0.9))
                }
            }
        }
        .onAppear {
            isAnimating = true
        }
    }
}

#Preview {
    LoadingView()
} 