import SwiftUI
import FirebaseFirestore
import FirebaseAuth

// MARK: - Authentication Views
struct SignUpView: View {
    let company: Company
    @EnvironmentObject var firebaseManager: FirebaseManager
    @Environment(\.dismiss) private var dismiss
    @State private var firstName = ""
    @State private var lastName = ""
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var isLoading = false
    @State private var showError = false
    @State private var errorMessage = ""
    @State private var showSuccess = false
    @State private var animateForm = false
    
    var body: some View {
        NavigationView {
            ZStack {
                AppTheme.mainGradient.ignoresSafeArea()
                ScrollView {
                    VStack(spacing: 32) {
                        // Header
                        VStack(spacing: 20) {
                            ZStack {
                                Circle()
                                    .fill(AppTheme.accentGradient)
                                    .frame(width: 80, height: 80)
                                Image(systemName: "person.badge.plus.fill")
                                    .font(.system(size: 40, weight: .medium))
                                    .foregroundColor(.white)
                            }
                            VStack(spacing: 8) {
                                Text("Registrer ny bruker")
                                    .font(.system(size: 28, weight: .bold, design: .rounded))
                                    .foregroundColor(.white)
                                Text("Bli del av \(company.name)")
                                    .font(.system(size: 16, weight: .medium))
                                    .foregroundColor(.white.opacity(0.8))
                            }
                        }
                        .padding(.top, 40)
                        .offset(y: animateForm ? 0 : -50)
                        .opacity(animateForm ? 1 : 0)
                        .transition(.opacity.combined(with: .move(edge: .top)))
                        // Form
                        VStack(spacing: 20) {
                            HStack(spacing: 16) {
                                VStack(alignment: .leading, spacing: 8) {
                                    Text("Fornavn")
                                        .font(.system(size: 16, weight: .medium))
                                        .foregroundColor(.white)
                                    TextField("Ditt fornavn", text: $firstName)
                                        .textFieldStyle(PlainTextFieldStyle())
                                        .font(.system(size: 16, weight: .medium))
                                        .foregroundColor(.white)
                                        .autocapitalization(.words)
                                        .padding()
                                        .background(AppTheme.glassBackground(cornerRadius: 12))
                                }
                                VStack(alignment: .leading, spacing: 8) {
                                    Text("Etternavn")
                                        .font(.system(size: 16, weight: .medium))
                                        .foregroundColor(.white)
                                    TextField("Ditt etternavn", text: $lastName)
                                        .textFieldStyle(PlainTextFieldStyle())
                                        .font(.system(size: 16, weight: .medium))
                                        .foregroundColor(.white)
                                        .autocapitalization(.words)
                                        .padding()
                                        .background(AppTheme.glassBackground(cornerRadius: 12))
                                }
                            }
                            VStack(alignment: .leading, spacing: 8) {
                                Text("E-post")
                                    .font(.system(size: 16, weight: .medium))
                                    .foregroundColor(.white)
                                HStack {
                                    Image(systemName: "envelope")
                                        .foregroundColor(.white.opacity(0.7))
                                        .frame(width: 20)
                                    TextField("din.epost@bedrift.no", text: $email)
                                        .textFieldStyle(PlainTextFieldStyle())
                                        .font(.system(size: 16, weight: .medium))
                                        .foregroundColor(.white)
                                        .keyboardType(.emailAddress)
                                        .autocapitalization(.none)
                                        .disableAutocorrection(true)
                                }
                                .padding()
                                .background(AppTheme.glassBackground(cornerRadius: 12))
                            }
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Passord")
                                    .font(.system(size: 16, weight: .medium))
                                    .foregroundColor(.white)
                                HStack {
                                    Image(systemName: "lock")
                                        .foregroundColor(.white.opacity(0.7))
                                        .frame(width: 20)
                                    SecureField("Ditt passord", text: $password)
                                        .textFieldStyle(PlainTextFieldStyle())
                                        .font(.system(size: 16, weight: .medium))
                                        .foregroundColor(.white)
                                }
                                .padding()
                                .background(AppTheme.glassBackground(cornerRadius: 12))
                            }
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Bekreft passord")
                                    .font(.system(size: 16, weight: .medium))
                                    .foregroundColor(.white)
                                HStack {
                                    Image(systemName: "lock.shield")
                                        .foregroundColor(.white.opacity(0.7))
                                        .frame(width: 20)
                                    SecureField("Bekreft ditt passord", text: $confirmPassword)
                                        .textFieldStyle(PlainTextFieldStyle())
                                        .font(.system(size: 16, weight: .medium))
                                        .foregroundColor(.white)
                                }
                                .padding()
                                .background(AppTheme.glassBackground(cornerRadius: 12))
                            }
                        }
                        .offset(x: animateForm ? 0 : 300)
                        .opacity(animateForm ? 1 : 0)
                        .transition(.opacity.combined(with: .move(edge: .trailing)))
                        Button(action: register) {
                            HStack(spacing: 12) {
                                if isLoading {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                        .scaleEffect(0.8)
                                } else {
                                    Image(systemName: "person.badge.plus.fill")
                                        .font(.system(size: 20, weight: .medium))
                                }
                                Text(isLoading ? "Oppretter konto..." : "Opprett konto")
                                    .font(.system(size: 18, weight: .semibold))
                            }
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 18)
                            .background(
                                (isLoading || firstName.isEmpty || lastName.isEmpty || email.isEmpty || password.isEmpty || confirmPassword.isEmpty)
                                ? AnyView(AppTheme.glassBackground(cornerRadius: 16))
                                : AnyView(AppTheme.accentGradient)
                            )
                            .cornerRadius(16)
                            .shadow(color: .blue.opacity(0.3), radius: 8, x: 0, y: 4)
                        }
                        .disabled(isLoading || firstName.isEmpty || lastName.isEmpty || email.isEmpty || password.isEmpty || confirmPassword.isEmpty)
                        .opacity((isLoading || firstName.isEmpty || lastName.isEmpty || email.isEmpty || password.isEmpty || confirmPassword.isEmpty) ? 0.6 : 1.0)
                        .offset(y: animateForm ? 0 : 50)
                        .opacity(animateForm ? 1 : 0)
                        .transition(.opacity.combined(with: .move(edge: .bottom)))
                        Spacer(minLength: 50)
                    }
                    .padding(.horizontal, 24)
                }
            }
            .navigationTitle("")
            .navigationBarTitleDisplayMode(.inline)
            .alert("Feil", isPresented: $showError) {
                Button("OK") {}
            } message: {
                Text(errorMessage)
            }
            .alert("Bruker opprettet!", isPresented: $showSuccess) {
                Button("OK") { dismiss() }
            } message: {
                Text("Din bruker er nå registrert og venter på godkjenning fra admin.")
            }
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 0.8)) {
                animateForm = true
            }
        }
    }
    private func register() {
        guard !firstName.isEmpty, !lastName.isEmpty, !email.isEmpty, !password.isEmpty else {
            errorMessage = "Vennligst fyll ut alle felter."
            showError = true
            return
        }
        guard password == confirmPassword else {
            errorMessage = "Passordene er ikke like."
            showError = true
            return
        }
        guard password.count >= 6 else {
            errorMessage = "Passordet må være minst 6 tegn."
            showError = true
            return
        }
        isLoading = true
        let db = Firestore.firestore()
        let pendingUser: [String: Any] = [
            "firstName": firstName,
            "lastName": lastName,
            "email": email,
            "companyId": company.id ?? "",
            "status": "pending",
            "createdAt": FieldValue.serverTimestamp()
        ]
        db.collection("pendingUsers").addDocument(data: pendingUser) { error in
            isLoading = false
            if let error = error {
                errorMessage = "Kunne ikke registrere bruker: \(error.localizedDescription)"
                showError = true
            } else {
                showSuccess = true
            }
        }
    }
}

struct ForgotPasswordView: View {
    let company: Company
    @EnvironmentObject var firebaseManager: FirebaseManager
    @Environment(\.dismiss) private var dismiss
    @State private var email = ""
    @State private var isLoading = false
    @State private var showSuccess = false
    @State private var showError = false
    @State private var errorMessage = ""
    @State private var animateForm = false
    
    var body: some View {
        NavigationView {
            ZStack {
                AppTheme.mainGradient.ignoresSafeArea()
                VStack(spacing: 32) {
                    VStack(spacing: 20) {
                        ZStack {
                            Circle()
                                .fill(AppTheme.accentGradient)
                                .frame(width: 80, height: 80)
                            Image(systemName: "key.fill")
                                .font(.system(size: 40, weight: .medium))
                                .foregroundColor(.white)
                        }
                        VStack(spacing: 8) {
                            Text("Glemt passord")
                                .font(.system(size: 28, weight: .bold, design: .rounded))
                                .foregroundColor(.white)
                            Text("Vi sender deg en tilbakestillingslenke")
                                .font(.system(size: 16, weight: .medium))
                                .foregroundColor(.white.opacity(0.8))
                                .multilineTextAlignment(.center)
                        }
                    }
                    .padding(.top, 60)
                    .offset(y: animateForm ? 0 : -50)
                    .opacity(animateForm ? 1 : 0)
                    .transition(.opacity.combined(with: .move(edge: .top)))
                    VStack(alignment: .leading, spacing: 12) {
                        Text("E-post")
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(.white)
                        HStack {
                            Image(systemName: "envelope")
                                .foregroundColor(.white.opacity(0.7))
                                .frame(width: 20)
                            TextField("din.epost@bedrift.no", text: $email)
                                .textFieldStyle(PlainTextFieldStyle())
                                .font(.system(size: 16, weight: .medium))
                                .foregroundColor(.white)
                                .keyboardType(.emailAddress)
                                .autocapitalization(.none)
                                .disableAutocorrection(true)
                        }
                        .padding()
                        .background(AppTheme.glassBackground(cornerRadius: 12))
                    }
                    .offset(x: animateForm ? 0 : 300)
                    .opacity(animateForm ? 1 : 0)
                    .transition(.opacity.combined(with: .move(edge: .trailing)))
                    Button(action: sendResetLink) {
                        HStack(spacing: 12) {
                            if isLoading {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                    .scaleEffect(0.8)
                            } else {
                                Image(systemName: "paperplane.fill")
                                    .font(.system(size: 20, weight: .medium))
                            }
                            Text(isLoading ? "Sender..." : "Send tilbakestillingslenke")
                                .font(.system(size: 18, weight: .semibold))
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 18)
                        .background(
                            (isLoading || email.isEmpty)
                            ? AnyView(AppTheme.glassBackground(cornerRadius: 16))
                            : AnyView(AppTheme.accentGradient)
                        )
                        .cornerRadius(16)
                        .shadow(color: .blue.opacity(0.3), radius: 8, x: 0, y: 4)
                    }
                    .disabled(isLoading || email.isEmpty)
                    .opacity((isLoading || email.isEmpty) ? 0.6 : 1.0)
                    .offset(y: animateForm ? 0 : 50)
                    .opacity(animateForm ? 1 : 0)
                    .transition(.opacity.combined(with: .move(edge: .bottom)))
                    Spacer()
                }
                .padding(.horizontal, 24)
            }
            .navigationTitle("")
            .navigationBarTitleDisplayMode(.inline)
            .alert("Lenke sendt!", isPresented: $showSuccess) {
                Button("OK") { dismiss() }
            } message: {
                Text("Sjekk din e-post for tilbakestillingslenken.")
            }
            .alert("Feil", isPresented: $showError) {
                Button("OK") {}
            } message: {
                Text(errorMessage)
            }
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 0.8)) {
                animateForm = true
            }
        }
    }
    private func sendResetLink() {
        isLoading = true
        Auth.auth().sendPasswordReset(withEmail: email) { error in
            isLoading = false
            if let error = error {
                errorMessage = "Kunne ikke sende tilbakestillingslenke: \(error.localizedDescription)"
                showError = true
            } else {
                showSuccess = true
            }
        }
    }
}

// MARK: - Detail Views
struct DeviationDetailView: View {
    @EnvironmentObject var firebaseManager: FirebaseManager
    @Environment(\.dismiss) private var dismiss
    @State private var animateContent = false
    @State private var editableDeviation: Deviation
    @State private var isSaving = false
    @State private var isDeleting = false
    @State private var errorMessage: String?
    
    init(deviation: Deviation) {
        _editableDeviation = State(initialValue: deviation)
    }
    
    var body: some View {
        ZStack {
            AppTheme.mainGradient.ignoresSafeArea()
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Header
                    VStack(alignment: .leading, spacing: 16) {
                        HStack(spacing: 16) {
                            ZStack {
                                Circle()
                                    .fill(categoryColor.opacity(0.2))
                                    .frame(width: 60, height: 60)
                                Image(systemName: editableDeviation.category.icon)
                                    .font(.system(size: 24, weight: .medium))
                                    .foregroundColor(categoryColor)
                            }
                            VStack(alignment: .leading, spacing: 6) {
                                Text(editableDeviation.title)
                                    .font(.system(size: 24, weight: .bold))
                                    .foregroundColor(.white)
                                    .lineLimit(3)
                                Text(editableDeviation.category.displayName)
                                    .font(.system(size: 16, weight: .medium))
                                    .foregroundColor(.white.opacity(0.7))
                            }
                            Spacer()
                            Text(editableDeviation.severity.displayName)
                                .font(.system(size: 14, weight: .bold))
                                .foregroundColor(.white)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 8)
                                .background(severityColor)
                                .cornerRadius(12)
                        }
                    }
                    .padding()
                    .background(AppTheme.glassBackground(cornerRadius: 20))
                    .offset(y: animateContent ? 0 : -50)
                    .opacity(animateContent ? 1 : 0)
                    .transition(.opacity.combined(with: .move(edge: .top)))
                    // Status og endre status
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Image(systemName: "circle.fill")
                                .font(.system(size: 16, weight: .medium))
                                .foregroundColor(statusColor)
                            Text("Status")
                                .font(.system(size: 18, weight: .bold))
                                .foregroundColor(.white)
                        }
                        Picker("Status", selection: $editableDeviation.status) {
                            ForEach(DeviationStatus.allCases, id: \.self) { status in
                                Text(status.displayName).tag(status)
                            }
                        }
                        .pickerStyle(MenuPickerStyle())
                        Button(action: saveStatus) {
                            if isSaving {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            } else {
                                Text("Lagre status")
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(.white)
                                    .padding(.horizontal, 24)
                                    .padding(.vertical, 10)
                                    .background(AppTheme.accentGradient)
                                    .cornerRadius(12)
                            }
                        }
                        .disabled(isSaving)
                        if let errorMessage = errorMessage {
                            Text(errorMessage)
                                .foregroundColor(.red)
                                .font(.system(size: 15, weight: .medium))
                        }
                    }
                    .padding()
                    .background(AppTheme.glassBackground(cornerRadius: 16))
                    // Slette avvik
                    Button(action: deleteDeviation) {
                        if isDeleting {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        } else {
                            Text("Slett avvik")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(.white)
                                .padding(.horizontal, 24)
                                .padding(.vertical, 10)
                                .background(Color.red.opacity(0.8))
                                .cornerRadius(12)
                        }
                    }
                    .padding(.top, 8)
                    .disabled(isDeleting)
                    // Beskrivelse
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Image(systemName: "text.alignleft")
                                .font(.system(size: 20, weight: .medium))
                                .foregroundColor(.white.opacity(0.8))
                            Text("Beskrivelse")
                                .font(.system(size: 20, weight: .bold))
                                .foregroundColor(.white)
                        }
                        Text(editableDeviation.description)
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(.white.opacity(0.8))
                            .lineSpacing(4)
                    }
                    .padding()
                    .background(AppTheme.glassBackground(cornerRadius: 20))
                    .offset(x: animateContent ? 0 : -300)
                    .opacity(animateContent ? 1 : 0)
                    .transition(.opacity.combined(with: .move(edge: .leading)))
                    // Dato
                    HStack(spacing: 16) {
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Image(systemName: "calendar")
                                    .font(.system(size: 16, weight: .medium))
                                    .foregroundColor(.white.opacity(0.8))
                                Text("Rapportert")
                                    .font(.system(size: 18, weight: .bold))
                                    .foregroundColor(.white)
                            }
                            Text(editableDeviation.createdAt, style: .date)
                                .font(.system(size: 16, weight: .medium))
                                .foregroundColor(.white.opacity(0.8))
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding()
                        .background(AppTheme.glassBackground(cornerRadius: 16))
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 32)
            }
        }
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            withAnimation(.easeInOut(duration: 0.8)) {
                animateContent = true
            }
        }
    }
    
    private var categoryColor: Color {
        switch editableDeviation.category {
        case .safety: return .red
        case .quality: return .blue
        case .environment: return .green
        case .equipment: return .orange
        case .process: return .purple
        case .other: return .gray
        }
    }
    
    private var severityColor: Color {
        switch editableDeviation.severity {
        case .low: return .green
        case .medium: return .orange
        case .high: return .red
        case .critical: return .purple
        }
    }
    
    private var statusColor: Color {
        switch editableDeviation.status {
        case .reported: return .orange
        case .underReview: return .blue
        case .inProgress: return .yellow
        case .resolved: return .green
        case .closed: return .gray
        }
    }
    
    private func saveStatus() {
        isSaving = true
        errorMessage = nil
        Task {
            do {
                try await firebaseManager.updateDeviation(editableDeviation)
                isSaving = false
            } catch {
                errorMessage = "Kunne ikke lagre status: \(error.localizedDescription)"
                isSaving = false
            }
        }
    }
    
    private func deleteDeviation() {
        isDeleting = true
        errorMessage = nil
        guard let id = editableDeviation.id else {
            errorMessage = "Avvik mangler id. Kan ikke slettes."
            isDeleting = false
            return
        }
        Task {
            do {
                try await firebaseManager.deleteDeviation(withId: id)
                isDeleting = false
                dismiss()
            } catch {
                errorMessage = "Kunne ikke slette avvik: \(error.localizedDescription)"
                isDeleting = false
            }
        }
    }
}

struct DocumentDetailView: View {
    let document: Document
    @State private var animateContent = false
    
    var body: some View {
        ZStack {
            // Gradient bakgrunn
            AppTheme.mainGradient.ignoresSafeArea()
            
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Header
                    VStack(alignment: .leading, spacing: 16) {
                        HStack(spacing: 16) {
                            ZStack {
                                Circle()
                                    .fill(categoryColor.opacity(0.2))
                                    .frame(width: 60, height: 60)
                                Image(systemName: document.category.icon)
                                    .font(.system(size: 24, weight: .medium))
                                    .foregroundColor(categoryColor)
                            }
                            
                            VStack(alignment: .leading, spacing: 6) {
                                Text(document.title)
                                    .font(.system(size: 24, weight: .bold))
                                    .foregroundColor(.white)
                                    .lineLimit(3)
                                
                                Text(document.category.displayName)
                                    .font(.system(size: 16, weight: .medium))
                                    .foregroundColor(.white.opacity(0.7))
                            }
                            
                            Spacer()
                            
                            Text(document.fileType.uppercased())
                                .font(.system(size: 14, weight: .bold))
                                .foregroundColor(.white)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 8)
                                .background(categoryColor)
                                .cornerRadius(12)
                        }
                    }
                    .padding()
                    .background(AppTheme.glassBackground(cornerRadius: 20))
                    .offset(y: animateContent ? 0 : -50)
                    .opacity(animateContent ? 1 : 0)
                    .transition(.opacity.combined(with: .move(edge: .top)))
                    
                    // File info
                    VStack(alignment: .leading, spacing: 16) {
                        HStack {
                            Image(systemName: "doc.text")
                                .font(.system(size: 20, weight: .medium))
                                .foregroundColor(.white.opacity(0.8))
                            Text("Filinformasjon")
                                .font(.system(size: 20, weight: .bold))
                                .foregroundColor(.white)
                        }
                        
                        VStack(spacing: 12) {
                            InfoRow(label: "Filnavn", value: document.fileName)
                            InfoRow(label: "Størrelse", value: formatFileSize(document.fileSize))
                            InfoRow(label: "Versjon", value: "v\(document.version)")
                        }
                    }
                    .padding()
                    .background(AppTheme.glassBackground(cornerRadius: 20))
                    .offset(x: animateContent ? 0 : -300)
                    .opacity(animateContent ? 1 : 0)
                    .transition(.opacity.combined(with: .move(edge: .leading)))
                    
                    // Upload info
                    VStack(alignment: .leading, spacing: 16) {
                        HStack {
                            Image(systemName: "person.circle")
                                .font(.system(size: 20, weight: .medium))
                                .foregroundColor(.white.opacity(0.8))
                            Text("Opplastet av")
                                .font(.system(size: 20, weight: .bold))
                                .foregroundColor(.white)
                        }
                        
                        VStack(spacing: 12) {
                            InfoRow(label: "Bruker", value: document.uploadedByName)
                            InfoRow(label: "Dato", value: formatDate(document.createdAt))
                        }
                    }
                    .padding()
                    .background(AppTheme.glassBackground(cornerRadius: 20))
                    .offset(x: animateContent ? 0 : 300)
                    .opacity(animateContent ? 1 : 0)
                    .transition(.opacity.combined(with: .move(edge: .trailing)))
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 32)
            }
        }
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            withAnimation(.easeInOut(duration: 0.8)) {
                animateContent = true
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

struct ChatDetailView: View {
    let chat: Chat
    @State private var animateContent = false
    
    var body: some View {
        ZStack {
            // Gradient bakgrunn
            AppTheme.mainGradient.ignoresSafeArea()
            
            VStack(spacing: 32) {
                Spacer()
                
                ZStack {
                    Circle()
                        .fill(AppTheme.accentGradient)
                        .frame(width: 120, height: 120)
                        .opacity(0.3)
                    
                    Image(systemName: "message.circle")
                        .font(.system(size: 60, weight: .light))
                        .foregroundColor(.white)
                }
                .scaleEffect(animateContent ? 1.0 : 0.5)
                .opacity(animateContent ? 1.0 : 0.0)
                .transition(.opacity.combined(with: .scale))
                
                VStack(spacing: 16) {
                    Text(chat.name ?? "Privat samtale")
                        .font(.system(size: 28, weight: .bold))
                        .foregroundColor(.white)
                    
                    Text("Chat-funksjonalitet kommer snart")
                        .font(.system(size: 18, weight: .medium))
                        .foregroundColor(.white.opacity(0.8))
                        .multilineTextAlignment(.center)
                }
                .offset(y: animateContent ? 0 : 50)
                .opacity(animateContent ? 1 : 0)
                .transition(.opacity.combined(with: .move(edge: .bottom)))
                
                Spacer()
            }
            .padding(.horizontal, 32)
        }
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            withAnimation(.easeInOut(duration: 0.8)) {
                animateContent = true
            }
        }
    }
}

// MARK: - Form Views
struct NewDeviationView: View {
    @EnvironmentObject var firebaseManager: FirebaseManager
    @Environment(\.dismiss) private var dismiss
    @State private var animateContent = false
    
    // Skjema-states
    @State private var title = ""
    @State private var description = ""
    @State private var category: DeviationCategory = .safety
    @State private var severity: DeviationSeverity = .low
    @State private var location = ""
    @State private var tagsText = ""
    @State private var isSaving = false
    @State private var errorMessage: String?
    
    var body: some View {
        NavigationView {
            ZStack {
                AppTheme.mainGradient.ignoresSafeArea()
                VStack(spacing: 24) {
                    Spacer()
                    VStack(spacing: 16) {
                        Text("Rapporter avvik")
                            .font(.system(size: 28, weight: .bold))
                            .foregroundColor(.white)
                        if let errorMessage = errorMessage {
                            Text(errorMessage)
                                .foregroundColor(.red)
                                .font(.system(size: 16, weight: .medium))
                        }
                        TextField("Tittel", text: $title)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                        TextField("Beskrivelse", text: $description, axis: .vertical)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                        Picker("Kategori", selection: $category) {
                            ForEach(DeviationCategory.allCases, id: \.self) { cat in
                                Text(cat.displayName).tag(cat)
                            }
                        }
                        .pickerStyle(MenuPickerStyle())
                        Picker("Alvorlighetsgrad", selection: $severity) {
                            ForEach(DeviationSeverity.allCases, id: \.self) { sev in
                                Text(sev.displayName).tag(sev)
                            }
                        }
                        .pickerStyle(MenuPickerStyle())
                        TextField("Sted (valgfritt)", text: $location)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                        TextField("Tags (kommaseparert, valgfritt)", text: $tagsText)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                    }
                    .padding()
                    .background(AppTheme.glassBackground(cornerRadius: 20))
                    .cornerRadius(20)
                    .shadow(radius: 8)
                    Spacer()
                    Button(action: saveDeviation) {
                        if isSaving {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        } else {
                            Text("Lagre")
                                .font(.system(size: 18, weight: .semibold))
                                .foregroundColor(.white)
                                .padding(.horizontal, 32)
                                .padding(.vertical, 16)
                                .background(AppTheme.accentGradient)
                                .cornerRadius(16)
                                .shadow(color: .blue.opacity(0.3), radius: 8, x: 0, y: 4)
                        }
                    }
                    .disabled(isSaving || title.isEmpty || description.isEmpty)
                    Button("Avbryt") {
                        dismiss()
                    }
                    .font(.system(size: 16, weight: .regular))
                    .foregroundColor(.white.opacity(0.7))
                    Spacer()
                }
                .padding(.horizontal, 32)
            }
            .navigationTitle("")
            .navigationBarTitleDisplayMode(.inline)
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 0.8)) {
                animateContent = true
            }
        }
    }
    
    private func saveDeviation() {
        isSaving = true
        errorMessage = nil
        guard let user = firebaseManager.currentUser else {
            errorMessage = "Du må være innlogget for å rapportere avvik."
            isSaving = false
            return
        }
        let tags = tagsText.split(separator: ",").map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
        let deviation = Deviation(
            title: title,
            description: description,
            category: category,
            severity: severity,
            reportedBy: user.id ?? user.email,
            companyId: user.companyId,
            location: location.isEmpty ? nil : location,
            tags: tags
        )
        Task {
            do {
                _ = try await firebaseManager.createDeviation(deviation)
                isSaving = false
                dismiss()
            } catch {
                errorMessage = "Kunne ikke lagre avvik: \(error.localizedDescription)"
                isSaving = false
            }
        }
    }
}

struct DocumentUploadView: View {
    @EnvironmentObject var firebaseManager: FirebaseManager
    @Environment(\.dismiss) private var dismiss
    @State private var animateContent = false
    
    var body: some View {
        NavigationView {
            ZStack {
                // Gradient bakgrunn
                AppTheme.mainGradient.ignoresSafeArea()
                
                VStack(spacing: 32) {
                    Spacer()
                    
                    ZStack {
                        Circle()
                            .fill(AppTheme.accentGradient)
                            .frame(width: 120, height: 120)
                            .opacity(0.3)
                        
                        Image(systemName: "arrow.up.doc")
                            .font(.system(size: 60, weight: .light))
                            .foregroundColor(.white)
                    }
                    .scaleEffect(animateContent ? 1.0 : 0.5)
                    .opacity(animateContent ? 1.0 : 0.0)
                    .transition(.opacity.combined(with: .scale))
                    
                    VStack(spacing: 16) {
                        Text("Last opp dokument")
                            .font(.system(size: 28, weight: .bold))
                            .foregroundColor(.white)
                        
                        Text("Funksjonalitet kommer snart")
                            .font(.system(size: 18, weight: .medium))
                            .foregroundColor(.white.opacity(0.8))
                            .multilineTextAlignment(.center)
                    }
                    .offset(y: animateContent ? 0 : 50)
                    .opacity(animateContent ? 1 : 0)
                    .transition(.opacity.combined(with: .move(edge: .bottom)))
                    
                    Button("Lukk") {
                        dismiss()
                    }
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 32)
                    .padding(.vertical, 16)
                    .background(AppTheme.accentGradient)
                    .cornerRadius(16)
                    .shadow(color: .blue.opacity(0.3), radius: 8, x: 0, y: 4)
                    .offset(y: animateContent ? 0 : 50)
                    .opacity(animateContent ? 1 : 0)
                    .transition(.opacity.combined(with: .move(edge: .bottom)))
                    
                    Spacer()
                }
                .padding(.horizontal, 32)
            }
            .navigationTitle("")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Last opp") {
                        dismiss()
                    }
                    .foregroundColor(.white)
                }
            }
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 0.8)) {
                animateContent = true
            }
        }
    }
}

struct NewChatView: View {
    @EnvironmentObject var firebaseManager: FirebaseManager
    @Environment(\.dismiss) private var dismiss
    @State private var animateContent = false
    
    var body: some View {
        NavigationView {
            ZStack {
                // Gradient bakgrunn
                AppTheme.mainGradient.ignoresSafeArea()
                
                VStack(spacing: 32) {
                    Spacer()
                    
                    ZStack {
                        Circle()
                            .fill(AppTheme.accentGradient)
                            .frame(width: 120, height: 120)
                            .opacity(0.3)
                        
                        Image(systemName: "message.badge.plus")
                            .font(.system(size: 60, weight: .light))
                            .foregroundColor(.white)
                    }
                    .scaleEffect(animateContent ? 1.0 : 0.5)
                    .opacity(animateContent ? 1.0 : 0.0)
                    .transition(.opacity.combined(with: .scale))
                    
                    VStack(spacing: 16) {
                        Text("Ny chat")
                            .font(.system(size: 28, weight: .bold))
                            .foregroundColor(.white)
                        
                        Text("Funksjonalitet kommer snart")
                            .font(.system(size: 18, weight: .medium))
                            .foregroundColor(.white.opacity(0.8))
                            .multilineTextAlignment(.center)
                    }
                    .offset(y: animateContent ? 0 : 50)
                    .opacity(animateContent ? 1 : 0)
                    .transition(.opacity.combined(with: .move(edge: .bottom)))
                    
                    Button("Lukk") {
                        dismiss()
                    }
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 32)
                    .padding(.vertical, 16)
                    .background(AppTheme.accentGradient)
                    .cornerRadius(16)
                    .shadow(color: .blue.opacity(0.3), radius: 8, x: 0, y: 4)
                    .offset(y: animateContent ? 0 : 50)
                    .opacity(animateContent ? 1 : 0)
                    .transition(.opacity.combined(with: .move(edge: .bottom)))
                    
                    Spacer()
                }
                .padding(.horizontal, 32)
            }
            .navigationTitle("")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Opprett") {
                        dismiss()
                    }
                    .foregroundColor(.white)
                }
            }
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 0.8)) {
                animateContent = true
            }
        }
    }
}

// MARK: - Settings View
struct SettingsView: View {
    @EnvironmentObject var firebaseManager: FirebaseManager
    @Environment(\.dismiss) private var dismiss
    @State private var animateContent = false
    
    var body: some View {
        NavigationView {
            ZStack {
                // Gradient bakgrunn
                AppTheme.mainGradient.ignoresSafeArea()
                
                VStack(spacing: 32) {
                    Spacer()
                    
                    ZStack {
                        Circle()
                            .fill(AppTheme.accentGradient)
                            .frame(width: 120, height: 120)
                            .opacity(0.3)
                        
                        Image(systemName: "gearshape.fill")
                            .font(.system(size: 60, weight: .light))
                            .foregroundColor(.white)
                    }
                    .scaleEffect(animateContent ? 1.0 : 0.5)
                    .opacity(animateContent ? 1.0 : 0.0)
                    .transition(.opacity.combined(with: .scale))
                    
                    VStack(spacing: 16) {
                        Text("Innstillinger")
                            .font(.system(size: 28, weight: .bold))
                            .foregroundColor(.white)
                        
                        Text("Funksjonalitet kommer snart")
                            .font(.system(size: 18, weight: .medium))
                            .foregroundColor(.white.opacity(0.8))
                            .multilineTextAlignment(.center)
                    }
                    .offset(y: animateContent ? 0 : 50)
                    .opacity(animateContent ? 1 : 0)
                    .transition(.opacity.combined(with: .move(edge: .bottom)))
                    
                    Button("Lukk") {
                        dismiss()
                    }
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 32)
                    .padding(.vertical, 16)
                    .background(AppTheme.accentGradient)
                    .cornerRadius(16)
                    .shadow(color: .blue.opacity(0.3), radius: 8, x: 0, y: 4)
                    .offset(y: animateContent ? 0 : 50)
                    .opacity(animateContent ? 1 : 0)
                    .transition(.opacity.combined(with: .move(edge: .bottom)))
                    
                    Spacer()
                }
                .padding(.horizontal, 32)
            }
            .navigationTitle("")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Ferdig") {
                        dismiss()
                    }
                    .foregroundColor(.white)
                }
            }
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 0.8)) {
                animateContent = true
            }
        }
    }
} 

private func formatDate(_ date: Date) -> String {
    let formatter = DateFormatter()
    formatter.dateStyle = .medium
    return formatter.string(from: date)
} 