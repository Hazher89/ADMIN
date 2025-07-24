import SwiftUI
import Firebase

struct DashboardView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                Text("Dashboard")
                    .font(.largeTitle).bold()
                    .padding(.top, 8)
                // Nøkkeltall
                HStack(spacing: 16) {
                    StatCard(title: "Brukere", value: "128", icon: "person.3.fill", color: .blue)
                    StatCard(title: "Avvik", value: "14", icon: "exclamationmark.triangle.fill", color: .orange)
                }
                HStack(spacing: 16) {
                    StatCard(title: "Dokumenter", value: "37", icon: "doc.text.fill", color: .teal)
                    StatCard(title: "Skift", value: "9", icon: "calendar", color: .green)
                }
                // Raske handlinger
                Text("Raske handlinger")
                    .font(.title2).bold()
                    .padding(.top, 8)
                HStack(spacing: 16) {
                    QuickActionButton(title: "Ny avvik", icon: "plus.circle.fill", color: .orange) {}
                    QuickActionButton(title: "Nytt dokument", icon: "plus.circle.fill", color: .teal) {}
                    QuickActionButton(title: "Nytt skift", icon: "plus.circle.fill", color: .green) {}
                }
                HStack(spacing: 16) {
                    QuickActionButton(title: "Chat", icon: "bubble.left.and.bubble.right.fill", color: .blue) {}
                    QuickActionButton(title: "Profil", icon: "person.crop.circle", color: .purple) {}
                }
                // Varsler eller siste aktivitet (placeholder)
                Text("Siste aktivitet")
                    .font(.title2).bold()
                    .padding(.top, 8)
                VStack(spacing: 12) {
                    ActivityRow(icon: "exclamationmark.triangle.fill", color: .orange, title: "Nytt avvik rapportert", subtitle: "Avvik #1234 - 2 min siden")
                    ActivityRow(icon: "calendar", color: .green, title: "Skift opprettet", subtitle: "Dagvakt - 1 time siden")
                    ActivityRow(icon: "doc.text.fill", color: .teal, title: "Dokument lastet opp", subtitle: "Sikkerhetsrutine.pdf - 3 timer siden")
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .font(.system(size: 24, weight: .bold))
                    .foregroundColor(color)
                Spacer()
            }
            Text(value)
                .font(.system(size: 28, weight: .bold))
                .foregroundColor(.primary)
            Text(title)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(16)
        .shadow(color: color.opacity(0.08), radius: 8, x: 0, y: 2)
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
                    .font(.system(size: 24, weight: .bold))
                    .foregroundColor(color)
                Text(title)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(.primary)
            }
            .frame(width: 100, height: 80)
            .background(Color(.secondarySystemBackground))
            .cornerRadius(14)
            .shadow(color: color.opacity(0.07), radius: 4, x: 0, y: 2)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct ActivityRow: View {
    let icon: String
    let color: Color
    let title: String
    let subtitle: String
    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: icon)
                .font(.system(size: 22, weight: .bold))
                .foregroundColor(color)
                .frame(width: 36, height: 36)
                .background(color.opacity(0.12))
                .clipShape(Circle())
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 15, weight: .semibold))
                Text(subtitle)
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
            }
            Spacer()
        }
        .padding(10)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }
}

#Preview {
    DashboardView()
} 