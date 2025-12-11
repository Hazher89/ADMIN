import SwiftUI

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
                // Gradient bakgrunn
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
                            // Name fields
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
                            
                            // Email field
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
                            
                            // Password fields
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
                        
                        // Register button
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
                Text("Din bruker er nå registrert. Du kan logge inn.")
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
        Task {
            do {
                try await firebaseManager.signUp(
                    email: email,
                    password: password,
                    firstName: firstName,
                    lastName: lastName,
                    companyId: company.id ?? ""
                )
                // Logg inn brukeren automatisk etter registrering
                try await firebaseManager.signIn(email: email, password: password)
                isLoading = false
                dismiss() // Lukk skjemaet, brukeren er nå innlogget
            } catch {
                isLoading = false
                errorMessage = "Kunne ikke opprette eller logge inn bruker. Sjekk e-post og prøv igjen."
                showError = true
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
    @State private var animateForm = false
    
    var body: some View {
        NavigationView {
            ZStack {
                // Gradient bakgrunn
                AppTheme.mainGradient.ignoresSafeArea()
                
                VStack(spacing: 32) {
                    // Header
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
                    
                    // Email field
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
                    
                    // Send button
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
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 0.8)) {
                animateForm = true
            }
        }
    }
    
    private func sendResetLink() {
        isLoading = true
        // TODO: Implement password reset
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            isLoading = false
            showSuccess = true
        }
    }
}

// MARK: - Detail Views
struct DeviationDetailView: View {
    let deviation: Deviation
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
                                Image(systemName: deviation.category.icon)
                                    .font(.system(size: 24, weight: .medium))
                                    .foregroundColor(categoryColor)
                            }
                            
                            VStack(alignment: .leading, spacing: 6) {
                                Text(deviation.title)
                                    .font(.system(size: 24, weight: .bold))
                                    .foregroundColor(.white)
                                    .lineLimit(3)
                                
                                Text(deviation.category.displayName)
                                    .font(.system(size: 16, weight: .medium))
                                    .foregroundColor(.white.opacity(0.7))
                            }
                            
                            Spacer()
                            
                            Text(deviation.severity.displayName)
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
                    
                    // Description
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Image(systemName: "text.alignleft")
                                .font(.system(size: 20, weight: .medium))
                                .foregroundColor(.white.opacity(0.8))
                            Text("Beskrivelse")
                                .font(.system(size: 20, weight: .bold))
                                .foregroundColor(.white)
                        }
                        
                        Text(deviation.description)
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(.white.opacity(0.8))
                            .lineSpacing(4)
                    }
                    .padding()
                    .background(AppTheme.glassBackground(cornerRadius: 20))
                    .offset(x: animateContent ? 0 : -300)
                    .opacity(animateContent ? 1 : 0)
                    .transition(.opacity.combined(with: .move(edge: .leading)))
                    
                    // Status and Date
                    HStack(spacing: 16) {
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Image(systemName: "circle.fill")
                                    .font(.system(size: 16, weight: .medium))
                                    .foregroundColor(statusColor)
                                Text("Status")
                                    .font(.system(size: 18, weight: .bold))
                                    .foregroundColor(.white)
                            }
                            
                            Text(deviation.status.displayName)
                                .font(.system(size: 16, weight: .medium))
                                .foregroundColor(.white.opacity(0.8))
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding()
                        .background(AppTheme.glassBackground(cornerRadius: 16))
                        
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Image(systemName: "calendar")
                                    .font(.system(size: 16, weight: .medium))
                                    .foregroundColor(.white.opacity(0.8))
                                Text("Rapportert")
                                    .font(.system(size: 18, weight: .bold))
                                    .foregroundColor(.white)
                            }
                            
                            Text(deviation.createdAt, style: .date)
                                .font(.system(size: 16, weight: .medium))
                                .foregroundColor(.white.opacity(0.8))
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding()
                        .background(AppTheme.glassBackground(cornerRadius: 16))
                    }
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
                        
                        Image(systemName: "exclamationmark.triangle")
                            .font(.system(size: 60, weight: .light))
                            .foregroundColor(.white)
                    }
                    .scaleEffect(animateContent ? 1.0 : 0.5)
                    .opacity(animateContent ? 1.0 : 0.0)
                    .transition(.opacity.combined(with: .scale))
                    
                    VStack(spacing: 16) {
                        Text("Rapporter avvik")
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
                    Button("Lagre") {
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