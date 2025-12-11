import SwiftUI

struct DocumentCard: View {
    let document: Document
    @State private var isPressed = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header
            HStack(spacing: 16) {
                ZStack {
                    Circle()
                        .fill(categoryColor.opacity(0.2))
                        .frame(width: 48, height: 48)
                    
                    Image(systemName: document.category.icon)
                        .font(.system(size: 20, weight: .medium))
                        .foregroundColor(categoryColor)
                }
                
                VStack(alignment: .leading, spacing: 6) {
                    Text(document.title)
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(.white)
                        .lineLimit(2)
                    
                    Text(document.category.displayName)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.white.opacity(0.7))
                }
                
                Spacer()
                
                // File type badge
                Text(document.fileType.uppercased())
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(categoryColor)
                    .cornerRadius(12)
            }
            
            // File info
            HStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Filnavn")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.white.opacity(0.6))
                    Text(document.fileName)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.white.opacity(0.8))
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    Text("Størrelse")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.white.opacity(0.6))
                    Text(formatFileSize(document.fileSize))
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.white.opacity(0.8))
                }
            }
            .padding(.top, 4)
            
            // Footer
            HStack(spacing: 16) {
                // Upload info
                VStack(alignment: .leading, spacing: 4) {
                    Text("Opplastet av")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.white.opacity(0.6))
                    Text(document.uploadedByName)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.white.opacity(0.8))
                }
                
                Spacer()
                
                // Version and date
                VStack(alignment: .trailing, spacing: 4) {
                    Text("v\(document.version)")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.white.opacity(0.6))
                    Text(document.createdAt, style: .relative)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.white.opacity(0.7))
                }
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 20)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .background(AppTheme.glassBackground(cornerRadius: 20))
                .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 4)
        )
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
        switch document.category {
        case .procedures: return .blue
        case .hms: return .green
        case .protocols: return .orange
        case .policies: return .purple
        case .forms: return .pink
        case .reports: return .red
        case .other: return .gray
        }
    }
    
    private func formatFileSize(_ bytes: Int64) -> String {
        let formatter = ByteCountFormatter()
        formatter.allowedUnits = [.useKB, .useMB, .useGB]
        formatter.countStyle = .file
        return formatter.string(fromByteCount: bytes)
    }
}

#Preview {
    DocumentCard(document: Document(
        title: "Sikkerhetsrutiner 2024",
        category: .procedures,
        fileURL: "",
        fileName: "sikkerhet.pdf",
        fileSize: 1024000,
        fileType: "pdf",
        uploadedBy: "user1",
        uploadedByName: "Ola Nordmann",
        companyId: "company1"
    ))
    .padding()
    .background(AppTheme.mainGradient.ignoresSafeArea())
} 