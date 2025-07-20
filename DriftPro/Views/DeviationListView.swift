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
            ZStack {
                // Gradient bakgrunn
                AppTheme.mainGradient.ignoresSafeArea()
                
                VStack(spacing: 0) {
                    // Hero/velkomstseksjon
                    VStack(spacing: 16) {
                        HStack(spacing: 16) {
                            ZStack {
                                Circle()
                                    .fill(AppTheme.accentGradient)
                                    .frame(width: 56, height: 56)
                                Image(systemName: "exclamationmark.triangle.fill")
                                    .font(.system(size: 28, weight: .bold))
                                    .foregroundColor(.white)
                            }
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Avvik & Rapportering")
                                    .font(.system(size: 20, weight: .medium))
                                    .foregroundColor(.white.opacity(0.9))
                                Text("Spor og håndter avvik systematisk")
                                    .font(.system(size: 14, weight: .medium))
                                    .foregroundColor(.white.opacity(0.7))
                            }
                            Spacer()
                        }
                        .padding(.horizontal, 20)
                        .padding(.top, 16)
                        .transition(.opacity.combined(with: .move(edge: .top)))
                        
                        // Search and filter bar
                        searchAndFilterSection
                    }
                    
                    // Deviations list
                    if isLoading {
                        Spacer()
                        VStack(spacing: 20) {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .scaleEffect(1.3)
                            
                            Text("Laster avvik...")
                                .font(.system(size: 18, weight: .medium))
                                .foregroundColor(.white.opacity(0.8))
                        }
                        .transition(.opacity.combined(with: .scale))
                        Spacer()
                    } else if filteredDeviations.isEmpty {
                        emptyStateView
                    } else {
                        deviationsList
                    }
                }
            }
            .navigationTitle("")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingNewDeviation = true }) {
                        Image(systemName: "plus.circle.fill")
                            .font(.system(size: 24, weight: .medium))
                            .foregroundColor(.white)
                    }
                }
            }
        }
        .sheet(isPresented: $showingNewDeviation) {
            NewDeviationView()
                .environmentObject(firebaseManager)
        }
        .onAppear {
            loadDeviations()
            withAnimation(.easeInOut(duration: 0.8)) {
                animateList = true
            }
        }
        .refreshable {
            await loadDeviationsAsync()
        }
    }
    
    private var searchAndFilterSection: some View {
        VStack(spacing: 16) {
            // Search bar
            HStack(spacing: 12) {
                Image(systemName: "magnifyingglass")
                    .font(.system(size: 18, weight: .medium))
                    .foregroundColor(.white.opacity(0.8))
                
                TextField("Søk i avvik...", text: $searchText)
                    .textFieldStyle(PlainTextFieldStyle())
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(.white)
                    .accentColor(.white)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 16)
            .background(AppTheme.glassBackground(cornerRadius: 16))
            .padding(.horizontal, 20)
            .transition(.opacity.combined(with: .move(edge: .top)))
            
            // Filter chips
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    FilterChip(
                        title: "Alle",
                        isSelected: selectedCategory == nil && selectedSeverity == nil
                    ) {
                        selectedCategory = nil
                        selectedSeverity = nil
                    }
                    
                    ForEach(DeviationCategory.allCases, id: \.self) { category in
                        FilterChip(
                            title: category.displayName,
                            isSelected: selectedCategory == category
                        ) {
                            selectedCategory = category
                            selectedSeverity = nil
                        }
                    }
                }
                .padding(.horizontal, 20)
            }
            .transition(.opacity.combined(with: .move(edge: .top)))
        }
    }
    
    private var deviationsList: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                ForEach(Array(filteredDeviations.enumerated()), id: \.element.id) { index, deviation in
                    NavigationLink(destination: DeviationDetailView(deviation: deviation)) {
                        DeviationCard(deviation: deviation)
                            .background(AppTheme.glassBackground(cornerRadius: 20))
                    }
                    .buttonStyle(PlainButtonStyle())
                    .padding(.horizontal, 20)
                    .offset(x: animateList ? 0 : 300)
                    .opacity(animateList ? 1 : 0)
                    .animation(.easeOut(duration: 0.6).delay(Double(index) * 0.1), value: animateList)
                }
            }
            .padding(.top, 20)
            .padding(.bottom, 32)
        }
    }
    
    private var emptyStateView: some View {
        VStack(spacing: 24) {
            Spacer()
            
            ZStack {
                Circle()
                    .fill(AppTheme.accentGradient)
                    .frame(width: 120, height: 120)
                    .opacity(0.3)
                
                Image(systemName: "exclamationmark.triangle")
                    .font(.system(size: 60, weight: .light))
                    .foregroundColor(.white)
            }
            .transition(.opacity.combined(with: .scale))
            
            VStack(spacing: 12) {
                Text(searchText.isEmpty ? "Ingen avvik funnet" : "Ingen resultater")
                    .font(.system(size: 24, weight: .bold))
                    .foregroundColor(.white)
                
                Text(searchText.isEmpty ? "Det er ingen rapporterte avvik for øyeblikket" : "Prøv å endre søkekriteriene")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(.white.opacity(0.8))
                    .multilineTextAlignment(.center)
            }
            
            if searchText.isEmpty {
                Button(action: { showingNewDeviation = true }) {
                    HStack(spacing: 12) {
                        Image(systemName: "plus.circle.fill")
                            .font(.system(size: 20, weight: .medium))
                        Text("Rapporter første avvik")
                            .font(.system(size: 18, weight: .semibold))
                    }
                    .foregroundColor(.white)
                    .padding(.horizontal, 32)
                    .padding(.vertical, 16)
                    .background(AppTheme.accentGradient)
                    .cornerRadius(16)
                    .shadow(color: .blue.opacity(0.3), radius: 8, x: 0, y: 4)
                }
                .transition(.opacity.combined(with: .move(edge: .bottom)))
            }
            
            Spacer()
        }
        .padding(.horizontal, 32)
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
                .foregroundColor(isSelected ? .white : .white.opacity(0.8))
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(
                    isSelected ? AnyShapeStyle(AppTheme.accentGradient) : AnyShapeStyle(Color.clear)
                )
                .cornerRadius(12)
        }
    }
}

#Preview {
    DeviationListView()
        .environmentObject(FirebaseManager.shared)
} 