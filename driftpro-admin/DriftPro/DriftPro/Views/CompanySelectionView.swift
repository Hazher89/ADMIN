import SwiftUI
import FirebaseFirestore
import FirebaseCore
import FirebaseAuth

struct CompanySelectionView: View {
    @EnvironmentObject var firebaseManager: FirebaseManager
    @State private var companies: [Company] = []
    @State private var searchText = ""
    @State private var isLoading = false
    @State private var selectedCompany: Company? = nil
    @State private var showLogin = false
    @State private var hasSearched = false
    @State private var showAuth = false
    @State private var selectedCompanyId: String? = nil

    var filteredCompanies: [Company] {
        if searchText.isEmpty {
            return []
        } else {
            let allCompanies = companies
            let search = searchText.folding(options: .diacriticInsensitive, locale: .current).lowercased()
            var result: [Company] = []
            for company in allCompanies {
                let name = company.name.folding(options: .diacriticInsensitive, locale: .current).lowercased()
                if name.contains(search) {
                    result.append(company)
                }
            }
            return result
        }
    }

    private func authDestination(for company: Company) -> some View {
        if let selected = companies.first(where: { $0.id == company.id }) {
            return AnyView(AuthView(company: selected).environmentObject(firebaseManager))
        } else {
            return AnyView(EmptyView())
        }
    }

    var body: some View {
        NavigationView {
            ZStack {
                // Eksklusiv gradientbakgrunn
                LinearGradient(
                    gradient: Gradient(colors: [Color.blue.opacity(0.8), Color.purple.opacity(0.7), Color.black]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()

                VStack(spacing: 32) {
                    VStack(spacing: 8) {
                        Text("Velg din bedrift")
                            .font(.system(size: 36, weight: .bold, design: .rounded))
                            .foregroundColor(.white)
                            .shadow(radius: 10)
                        Text("Søk og velg for å fortsette")
                            .font(.headline)
                            .foregroundColor(.white.opacity(0.7))
                    }
                    .padding(.top, 60)

                    HStack {
                        TextField("Søk etter bedrift...", text: $searchText, onEditingChanged: { _ in }, onCommit: {
                            searchCompanies()
                        })
                        .padding()
                        .background(BlurView(style: .systemMaterialDark))
                        .cornerRadius(14)
                        .foregroundColor(.white)
                        .accentColor(.white)
                        .overlay(
                            HStack {
                                Spacer()
                                Button(action: { searchCompanies() }) {
                                    Image(systemName: "magnifyingglass")
                                        .foregroundColor(.white)
                                }
                                .padding(.trailing, 12)
                            }
                        )
                        .padding(.horizontal)
                    }

                    if isLoading {
                        ProgressView("Laster bedrifter...")
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            .foregroundColor(.white)
                            .padding()
                    } else if hasSearched && filteredCompanies.isEmpty {
                        Text("Ingen bedrifter funnet")
                            .foregroundColor(.white.opacity(0.7))
                            .font(.title3)
                            .padding()
                    } else if !filteredCompanies.isEmpty {
                        ScrollView {
                            VStack(spacing: 18) {
                                ForEach(filteredCompanies) { company in
                                    NavigationLink(
                                        destination: authDestination(for: company),
                                        tag: company.id ?? "",
                                        selection: $selectedCompanyId
                                    ) {
                                        CompanyRow(company: company)
                                            .onTapGesture { selectedCompanyId = company.id }
                                    }
                                    .buttonStyle(PlainButtonStyle())
                                }
                            }
                            .padding(.horizontal)
                        }
                        .frame(maxHeight: 350)
                    }

                    Spacer()
                }
            }
            // Flytt NavigationLink hit, inni NavigationView/ZStack
            NavigationLink(
                destination: Group {
                    if let company = selectedCompany {
                        AuthView(company: company)
                            .environmentObject(firebaseManager)
                    }
                },
                isActive: $showAuth
            ) {
                EmptyView()
            }
            .hidden()
        }
        .navigationBarHidden(true)
    }

    func searchCompanies() {
        guard !searchText.isEmpty else { return }
        DispatchQueue.main.async {
            self.isLoading = true
            self.hasSearched = false
            self.companies = []
        }
        let db = Firestore.firestore()
        db.collection("companies").getDocuments { snapshot, error in
            DispatchQueue.main.async {
                self.isLoading = false
                self.hasSearched = true
                if let documents = snapshot?.documents {
                    self.companies = documents.compactMap { doc in
                        let data = doc.data()
                        guard let name = data["name"] as? String else { return nil }
                        return Company(id: doc.documentID, name: name, logoURL: nil, primaryColor: "#007AFF", secondaryColor: "#5856D6", address: nil, phoneNumber: nil, email: nil, website: nil, description: nil, adminUserId: "")
                    }
                }
            }
        }
    }
}

struct LoginOrRegisterView: View {
    let company: Company
    @State private var showSignUp = false
    @State private var showForgotPassword = false

    var body: some View {
        ZStack {
            LinearGradient(
                gradient: Gradient(colors: [Color.purple.opacity(0.8), Color.blue.opacity(0.7), Color.black]),
                startPoint: .topTrailing,
                endPoint: .bottomLeading
            )
            .ignoresSafeArea()
            VStack(spacing: 32) {
                VStack(spacing: 8) {
                    Text("Du har valgt:")
                        .font(.headline)
                        .foregroundColor(.white.opacity(0.8))
                    Text(company.name)
                        .font(.system(size: 28, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                        .shadow(radius: 8)
                }
                .padding(.top, 40)
                .padding(.bottom, 8)
                .transition(.opacity)

                // LoginView med glass-effekt
                VStack {
                    LoginView(company: company)
                        .background(BlurView(style: .systemMaterialDark))
                        .cornerRadius(18)
                        .shadow(radius: 10)
                }
                .padding(.horizontal)
                .transition(.move(edge: .bottom))

                HStack(spacing: 24) {
                    Button(action: { showSignUp = true }) {
                        Text("Opprett bruker")
                            .font(.headline)
                            .foregroundColor(.white)
                            .padding(.vertical, 10)
                            .padding(.horizontal, 24)
                            .background(LinearGradient(gradient: Gradient(colors: [.blue, .purple]), startPoint: .leading, endPoint: .trailing))
                            .cornerRadius(12)
                            .shadow(radius: 6)
                    }
                    Button(action: { showForgotPassword = true }) {
                        Text("Glemt passord?")
                            .font(.subheadline)
                            .foregroundColor(.white.opacity(0.8))
                    }
                }
                .padding(.top, 8)
                .transition(.opacity)

                Spacer()
            }
            .padding()
            .sheet(isPresented: $showSignUp) {
                SignUpView(company: company)
            }
            .sheet(isPresented: $showForgotPassword) {
                ForgotPasswordView(company: company)
            }
        }
    }
}

struct CompanyRow: View {
    let company: Company
    var body: some View {
        HStack(spacing: 18) {
            ZStack {
                Circle()
                    .fill(LinearGradient(gradient: Gradient(colors: [.blue, .purple]), startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(width: 48, height: 48)
                Image(systemName: "building.2.fill")
                    .font(.system(size: 24, weight: .medium))
                    .foregroundColor(.white)
            }
            Text(company.name)
                .font(.title3)
                .fontWeight(.semibold)
                .foregroundColor(.white)
            Spacer()
            Image(systemName: "chevron.right")
                .foregroundColor(.white.opacity(0.7))
        }
        .padding()
        .background(BlurView(style: .systemMaterialDark))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.15), radius: 8, x: 0, y: 4)
    }
} 