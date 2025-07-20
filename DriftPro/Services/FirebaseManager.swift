import Foundation
import FirebaseCore
import FirebaseAuth
import FirebaseFirestore
import FirebaseStorage
import Combine

class FirebaseManager: ObservableObject {
    static let shared = FirebaseManager()
    
    let auth = Auth.auth()
    let db = Firestore.firestore()
    let storage = Storage.storage()
    
    @Published var currentUser: User?
    @Published var currentCompany: Company?
    @Published var isAuthenticated = false
    @Published var isLoading = false
    
    private var cancellables = Set<AnyCancellable>()
    
    private init() {
        // Logg ut bruker ved appstart for å tvinge ny innlogging
        do {
            try auth.signOut()
        } catch {
            print("[FirebaseManager] Feil ved signOut: \(error)")
        }
        setupAuthStateListener()
    }
    
    private func setupAuthStateListener() {
        _ = auth.addStateDidChangeListener { [weak self] _, user in
            DispatchQueue.main.async {
                if let user = user {
                    print("[FirebaseManager] Auth endret, henter bruker med id: \(user.uid)")
                    self?.fetchUserData(userId: user.uid)
                } else {
                    print("[FirebaseManager] Ingen bruker innlogget")
                    self?.currentUser = nil
                    self?.currentCompany = nil
                    self?.isAuthenticated = false
                }
            }
        }
    }
    
    func fetchUserData(userId: String) {
        isLoading = true
        db.collection("users").document(userId).getDocument { [weak self] document, error in
            DispatchQueue.main.async {
                self?.isLoading = false
                if let document = document, document.exists {
                    do {
                        let user = try document.data(as: User.self)
                        self?.currentUser = user
                        self?.fetchCompanyData(companyId: user.companyId)
                        self?.isAuthenticated = true
                    } catch {
                        print("Error decoding user: \(error)")
                    }
                }
            }
        }
    }
    
    func fetchCompanyData(companyId: String) {
        db.collection("companies").document(companyId).getDocument { [weak self] document, error in
            DispatchQueue.main.async {
                if let document = document, document.exists {
                    do {
                        let company = try document.data(as: Company.self)
                        self?.currentCompany = company
                    } catch {
                        print("Error decoding company: \(error)")
                    }
                }
            }
        }
    }
    
    func signIn(email: String, password: String) async throws {
        await MainActor.run { self.isLoading = true }
        defer { Task { @MainActor in self.isLoading = false } }
        _ = try await auth.signIn(withEmail: email, password: password)
        await MainActor.run { self.isAuthenticated = true }
        // User data will be fetched by the auth state listener
    }
    
    func signUp(email: String, password: String, firstName: String, lastName: String, companyId: String, role: UserRole = .employee) async throws {
        await MainActor.run { self.isLoading = true }
        defer { Task { @MainActor in self.isLoading = false } }
        let _ = try await auth.createUser(withEmail: email, password: password)
        let user = User(
            email: email,
            firstName: firstName,
            lastName: lastName,
            role: role,
            companyId: companyId
        )
        try await db.collection("users").document(auth.currentUser?.uid ?? UUID().uuidString).setData(from: user)
        await MainActor.run { self.isAuthenticated = true }
    }
    
    func signOut() throws {
        try auth.signOut()
    }
    
    func resetPassword(email: String) async throws {
        try await auth.sendPasswordReset(withEmail: email)
    }
    
    func uploadFile(data: Data, path: String) async throws -> String {
        let storageRef = storage.reference().child(path)
        let metadata = StorageMetadata()
        metadata.contentType = "application/octet-stream"
        
        _ = try await storageRef.putDataAsync(data, metadata: metadata)
        let downloadURL = try await storageRef.downloadURL()
        return downloadURL.absoluteString
    }
    
    func deleteFile(path: String) async throws {
        let storageRef = storage.reference().child(path)
        try await storageRef.delete()
    }
    
    // MARK: - Deviation (Avvik) Firestore-funksjoner
    
    /// Oppretter et nytt avvik i Firestore og returnerer dokument-ID ved suksess
    func createDeviation(_ deviation: Deviation) async throws -> String {
        var ref: DocumentReference? = nil
        do {
            ref = try await db.collection("deviations").addDocument(from: deviation)
            return ref?.documentID ?? ""
        } catch {
            print("[FirebaseManager] Feil ved opprettelse av avvik: \(error)")
            throw error
        }
    }
    
    /// Henter alle avvik for et gitt selskap (companyId) fra Firestore
    func fetchDeviations(for companyId: String) async throws -> [Deviation] {
        do {
            let snapshot = try await db.collection("deviations").whereField("companyId", isEqualTo: companyId).getDocuments()
            let deviations = snapshot.documents.compactMap { document in
                try? document.data(as: Deviation.self)
            }
            return deviations
        } catch {
            print("[FirebaseManager] Feil ved henting av avvik: \(error)")
            throw error
        }
    }
    
    /// Oppdaterer et eksisterende avvik i Firestore
    func updateDeviation(_ deviation: Deviation) async throws {
        guard let id = deviation.id else {
            throw NSError(domain: "Deviation", code: 0, userInfo: [NSLocalizedDescriptionKey: "Avvik mangler id"])
        }
        do {
            try await db.collection("deviations").document(id).setData(from: deviation, merge: true)
        } catch {
            print("[FirebaseManager] Feil ved oppdatering av avvik: \(error)")
            throw error
        }
    }
    
    /// Sletter et avvik fra Firestore
    func deleteDeviation(withId id: String) async throws {
        do {
            try await db.collection("deviations").document(id).delete()
        } catch {
            print("[FirebaseManager] Feil ved sletting av avvik: \(error)")
            throw error
        }
    }
} 