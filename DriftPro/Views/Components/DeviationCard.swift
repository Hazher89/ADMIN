import SwiftUI

struct DeviationCard: View {
    let deviation: Deviation
    @State private var isPressed = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header
            HStack(spacing: 16) {
                ZStack {
                    Circle()
                        .fill(categoryColor.opacity(0.18))
                        .frame(width: 48, height: 48)
                    
                    Image(systemName: deviation.category.icon)
                        .font(.system(size: 20, weight: .medium))
                        .foregroundColor(categoryColor)
                }
                
                VStack(alignment: .leading, spacing: 6) {
                    Text(deviation.title)
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(.primary)
                        .lineLimit(2)
                    
                    Text(deviation.category.displayName)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(.primary)
                }
                
                Spacer()
                
                // Severity badge
                Text(deviation.severity.displayName)
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(severityColor)
                    .cornerRadius(12)
            }
            
            // Description
            if !deviation.description.isEmpty {
                Text(deviation.description)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(.primary)
                    .lineLimit(3)
                    .padding(.top, 4)
            }
            
            // Footer
            HStack(spacing: 16) {
                // Status
                HStack(spacing: 8) {
                    Circle()
                        .fill(statusColor)
                        .frame(width: 10, height: 10)
                    
                    Text(deviation.status.displayName)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                // Date
                Text(deviation.createdAt, style: .relative)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.secondary)
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 20)
        .background(
            AppTheme.cardGradient
                .clipShape(RoundedRectangle(cornerRadius: 20))
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(Color.primary.opacity(0.08), lineWidth: 1.5)
                )
        )
        .shadow(color: Color.primary.opacity(0.08), radius: 10, x: 0, y: 6)
        .scaleEffect(isPressed ? 0.98 : 1.0)
        .animation(.easeInOut(duration: 0.1), value: isPressed)
        .onTapGesture {
            withAnimation(.easeInOut(duration: 0.1)) {
                isPressed = true
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                withAnimation(.easeInOut(duration: 0.1)) {
                    isPressed = false
                }
            }
        }
    }
    
    private var categoryColor: Color {
        switch deviation.category {
        case .safety: return .red
        case .quality: return .blue
        case .environment: return .green
        case .equipment: return .orange
        case .process: return .purple
        case .other: return .gray
        }
    }
    
    private var severityColor: Color {
        switch deviation.severity {
        case .low: return .green
        case .medium: return .orange
        case .high: return .red
        case .critical: return .purple
        }
    }
    
    private var statusColor: Color {
        switch deviation.status {
        case .reported: return .orange
        case .underReview: return .blue
        case .inProgress: return .yellow
        case .resolved: return .green
        case .closed: return .gray
        }
    }
}

#Preview {
    DeviationCard(deviation: Deviation(
        title: "Sikkerhetsbrudd i bygg A",
        description: "Dør låst ikke ordentlig og kunne åpnes uten nøkkel",
        category: .safety,
        severity: .high,
        reportedBy: "user1",
        companyId: "company1"
    ))
    .padding()
    .background(AppTheme.mainGradient.ignoresSafeArea())
} 