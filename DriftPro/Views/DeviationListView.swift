import SwiftUI

struct DeviationListView: View {
    @EnvironmentObject var firebaseManager: FirebaseManager
    @State private var deviations: [Deviation] = []
    @State private var isLoading = true
    @State private var searchText = ""
    @State private var selectedCategory: DeviationCategory? = nil
    @State private var selectedSeverity: DeviationSeverity? = nil
    @State private var showingNewDeviation = false
    @State private var animateList = false
    
    var filteredDeviations: [Deviation] {
        var filtered = deviations
        if !searchText.isEmpty {
            filtered = filtered.filter { deviation in
                deviation.title.localizedCaseInsensitiveContains(searchText) ||
                deviation.description.localizedCaseInsensitiveContains(searchText)
            }
        }
        if let category = selectedCategory {
            filtered = filtered.filter { $0.category == category }
        }
        if let severity = selectedSeverity {
            filtered = filtered.filter { $0.severity == severity }
        }
        return filtered
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Toppseksjon med søk og filter
                VStack(spacing: 12) {
                    HStack {
                        Text("Avvik")
                            .font(.largeTitle).bold()
                        Spacer()
                        Button(action: { showingNewDeviation = true }) {
                            Image(systemName: "plus.circle.fill")
                                .font(.system(size: 28, weight: .bold))
                                .foregroundColor(.blue)
                        }
                    }
                    .padding(.horizontal)
                    HStack(spacing: 10) {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(.gray)
                        TextField("Søk i avvik...", text: $searchText)
                            .textFieldStyle(PlainTextFieldStyle())
                            .font(.system(size: 16))
                    }
                    .padding(10)
                    .background(Color(.systemGray6))
                    .cornerRadius(12)
                    .padding(.horizontal)
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            FilterChip(title: "Alle", isSelected: selectedCategory == nil && selectedSeverity == nil) {
                                selectedCategory = nil; selectedSeverity = nil
                            }
                            ForEach(DeviationCategory.allCases, id: \.self) { category in
                                FilterChip(title: category.displayName, isSelected: selectedCategory == category) {
                                    selectedCategory = category; selectedSeverity = nil
                                }
                            }
                        }
                        .padding(.horizontal)
                    }
                }
                .padding(.top)
                .background(Color(.systemBackground))
                Divider()
                // Liste
                if isLoading {
                    Spacer()
                    ProgressView("Laster avvik...")
                        .padding()
                    Spacer()
                } else if filteredDeviations.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .font(.system(size: 48)).foregroundColor(.gray)
                        Text("Ingen avvik funnet")
                            .font(.title3).foregroundColor(.gray)
                        if searchText.isEmpty {
                            Button(action: { showingNewDeviation = true }) {
                                Label("Rapporter første avvik", systemImage: "plus.circle.fill")
                                    .font(.headline)
                                    .padding(.horizontal, 24).padding(.vertical, 12)
                                    .background(Color.blue)
                                    .foregroundColor(.white)
                                    .cornerRadius(12)
                            }
                        }
                    }
                    .padding(.top, 60)
                    Spacer()
                } else {
                    ScrollView {
                        LazyVStack(spacing: 16) {
                            ForEach(filteredDeviations) { deviation in
                                NavigationLink(destination: DeviationDetailView(deviation: deviation)) {
                                    DeviationCardFlat(deviation: deviation)
                                }
                                .buttonStyle(PlainButtonStyle())
                                .padding(.horizontal)
                            }
                        }
                        .padding(.top, 16)
                        .padding(.bottom, 32)
                    }
                }
            }
            .background(Color(.systemGroupedBackground).ignoresSafeArea())
            .navigationBarHidden(true)
        }
        .sheet(isPresented: $showingNewDeviation) {
            NewDeviationView()
                .environmentObject(firebaseManager)
        }
        .onAppear {
            loadDeviations()
        }
        .refreshable {
            await loadDeviationsAsync()
        }
    }
    
    private func loadDeviations() {
        guard let companyId = firebaseManager.currentUser?.companyId else {
            self.deviations = []
            self.isLoading = false
            return
        }
        isLoading = true
        Task {
            do {
                let fetchedDeviations = try await firebaseManager.fetchDeviations(for: companyId)
                await MainActor.run {
                    self.deviations = fetchedDeviations
                    self.isLoading = false
                }
            } catch {
                print("Feil ved henting av avvik: \(error)")
                await MainActor.run {
                    self.deviations = []
                    self.isLoading = false
                }
            }
        }
    }
    private func loadDeviationsAsync() async {
        guard let companyId = firebaseManager.currentUser?.companyId else {
            await MainActor.run {
                self.deviations = []
                self.isLoading = false
            }
            return
        }
        await MainActor.run { self.isLoading = true }
        do {
            let fetchedDeviations = try await firebaseManager.fetchDeviations(for: companyId)
            await MainActor.run {
                self.deviations = fetchedDeviations
                self.isLoading = false
            }
        } catch {
            print("Feil ved henting av avvik: \(error)")
            await MainActor.run {
                self.deviations = []
                self.isLoading = false
            }
        }
    }
}

struct FilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(isSelected ? .white : .blue)
                .padding(.horizontal, 14)
                .padding(.vertical, 7)
                .background(isSelected ? Color.blue : Color(.systemGray5))
                .cornerRadius(10)
        }
    }
}

struct DeviationCardFlat: View {
    let deviation: Deviation
    var statusColor: Color {
        deviation.status == .reported ? .orange : .green
    }
    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            ZStack {
                Circle().fill(statusColor.opacity(0.18)).frame(width: 44, height: 44)
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundColor(statusColor)
            }
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text(deviation.title)
                        .font(.headline)
                        .foregroundColor(.primary)
                    Spacer()
                    Text(deviation.status.displayName)
                        .font(.caption).bold()
                        .foregroundColor(statusColor)
                        .padding(.horizontal, 8).padding(.vertical, 4)
                        .background(statusColor.opacity(0.12))
                        .cornerRadius(8)
                }
                Text(deviation.description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
                HStack(spacing: 12) {
                    Label(deviation.category.displayName, systemImage: "tag")
                        .font(.caption2).foregroundColor(.gray)
                    Label(deviation.severity.displayName, systemImage: "bolt.fill")
                        .font(.caption2).foregroundColor(.gray)
                }
            }
        }
        .padding(14)
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: statusColor.opacity(0.07), radius: 4, x: 0, y: 2)
    }
}

#Preview {
    DeviationListView()
        .environmentObject(FirebaseManager.shared)
} 