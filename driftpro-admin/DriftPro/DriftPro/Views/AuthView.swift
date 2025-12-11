import SwiftUI
import FirebaseAuth

struct AuthView: View {
    enum AuthMode {
        case login, signup, forgotPassword
    }
    let company: Company
    @EnvironmentObject var firebaseManager: FirebaseManager
    @State private var mode: AuthMode = .login

    // Login states
    @State private var email = ""
    @State private var password = ""
    @State private var loginError = ""
    @State private var isLoading = false

    // Signup states
    @State private var firstName = ""
    @State private var lastName = ""
    @State private var signupEmail = ""
    @State private var signupPassword = ""
    @State private var confirmPassword = ""
    @State private var signupError = ""
    @State private var signupSuccess = false

    // Forgot password states
    @State private var forgotEmail = ""
    @State private var forgotError = ""
    @State private var forgotSuccess = false

    var body: some View {
        ZStack {
            AppTheme.mainGradient.ignoresSafeArea()
            VStack(spacing: 24) {
                Text(company.name)
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
                    .shadow(radius: 8)
                    .padding(.top, 40)

                // Mode switcher
                HStack(spacing: 16) {
                    Button(action: { mode = .login }) {
                        Text("Logg inn")
                            .fontWeight(mode == .login ? .bold : .regular)
                            .foregroundColor(mode == .login ? .white : .white.opacity(0.7))
                    }
                    Button(action: { mode = .signup }) {
                        Text("Opprett bruker")
                            .fontWeight(mode == .signup ? .bold : .regular)
                            .foregroundColor(mode == .signup ? .white : .white.opacity(0.7))
                    }
                    Button(action: { mode = .forgotPassword }) {
                        Text("Glemt passord")
                            .fontWeight(mode == .forgotPassword ? .bold : .regular)
                            .foregroundColor(mode == .forgotPassword ? .white : .white.opacity(0.7))
                    }
                }
                .padding(.bottom, 8)

                // Content
                Group {
                    switch mode {
                    case .login:
                        loginSection
                    case .signup:
                        signupSection
                    case .forgotPassword:
                        forgotSection
                    }
                }
                .padding()
                .background(AppTheme.glassBackground(cornerRadius: 18))
                .cornerRadius(18)
                .shadow(radius: 10)
                .padding(.horizontal)

                Spacer()
            }
        }
    }

    // MARK: - Login
    var loginSection: some View {
        VStack(spacing: 16) {
            TextField("E-post", text: $email)
                .textFieldStyle(PlainTextFieldStyle())
                .autocapitalization(.none)
                .keyboardType(.emailAddress)
                .padding()
                .background(AppTheme.glassBackground(cornerRadius: 12))
                .foregroundColor(.white)
            SecureField("Passord", text: $password)
                .textFieldStyle(PlainTextFieldStyle())
                .padding()
                .background(AppTheme.glassBackground(cornerRadius: 12))
                .foregroundColor(.white)
            if !loginError.isEmpty {
                Text(loginError)
                    .foregroundColor(.red)
            }
            Button(action: login) {
                HStack {
                    if isLoading { ProgressView().progressViewStyle(CircularProgressViewStyle(tint: .white)) }
                    Text(isLoading ? "Logger inn..." : "Logg inn")
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding()
                .background(AppTheme.accentGradient)
                .cornerRadius(12)
            }
            .disabled(isLoading)
        }
    }

    // MARK: - Signup
    var signupSection: some View {
        VStack(spacing: 16) {
            HStack(spacing: 12) {
                TextField("Fornavn", text: $firstName)
                    .textFieldStyle(PlainTextFieldStyle())
                    .autocapitalization(.words)
                    .padding()
                    .background(AppTheme.glassBackground(cornerRadius: 12))
                    .foregroundColor(.white)
                TextField("Etternavn", text: $lastName)
                    .textFieldStyle(PlainTextFieldStyle())
                    .autocapitalization(.words)
                    .padding()
                    .background(AppTheme.glassBackground(cornerRadius: 12))
                    .foregroundColor(.white)
            }
            TextField("E-post", text: $signupEmail)
                .textFieldStyle(PlainTextFieldStyle())
                .autocapitalization(.none)
                .keyboardType(.emailAddress)
                .padding()
                .background(AppTheme.glassBackground(cornerRadius: 12))
                .foregroundColor(.white)
            SecureField("Passord", text: $signupPassword)
                .textFieldStyle(PlainTextFieldStyle())
                .padding()
                .background(AppTheme.glassBackground(cornerRadius: 12))
                .foregroundColor(.white)
            SecureField("Bekreft passord", text: $confirmPassword)
                .textFieldStyle(PlainTextFieldStyle())
                .padding()
                .background(AppTheme.glassBackground(cornerRadius: 12))
                .foregroundColor(.white)
            if !signupError.isEmpty {
                Text(signupError)
                    .foregroundColor(.red)
            }
            if signupSuccess {
                Text("Bruker opprettet! Du kan logge inn.")
                    .foregroundColor(.green)
            }
            Button(action: signup) {
                HStack {
                    if isLoading { ProgressView().progressViewStyle(CircularProgressViewStyle(tint: .white)) }
                    Text(isLoading ? "Oppretter konto..." : "Opprett konto")
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding()
                .background(AppTheme.accentGradient)
                .cornerRadius(12)
            }
            .disabled(isLoading)
        }
    }

    // MARK: - Forgot Password
    var forgotSection: some View {
        VStack(spacing: 16) {
            TextField("E-post", text: $forgotEmail)
                .textFieldStyle(PlainTextFieldStyle())
                .autocapitalization(.none)
                .keyboardType(.emailAddress)
                .padding()
                .background(AppTheme.glassBackground(cornerRadius: 12))
                .foregroundColor(.white)
            if !forgotError.isEmpty {
                Text(forgotError)
                    .foregroundColor(.red)
            }
            if forgotSuccess {
                Text("Lenke sendt! Sjekk din e-post.")
                    .foregroundColor(.green)
            }
            Button(action: forgotPassword) {
                HStack {
                    if isLoading { ProgressView().progressViewStyle(CircularProgressViewStyle(tint: .white)) }
                    Text(isLoading ? "Sender..." : "Send tilbakestillingslenke")
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding()
                .background(AppTheme.accentGradient)
                .cornerRadius(12)
            }
            .disabled(isLoading)
        }
    }

    // MARK: - Actions
    func login() {
        isLoading = true
        loginError = ""
        Task {
            do {
                try await firebaseManager.signIn(email: email, password: password)
                // Success: håndter evt. navigasjon
            } catch let error as NSError {
                if let code = AuthErrorCode(rawValue: error.code) {
                    switch code.code {
                    case .wrongPassword, .userNotFound:
                        loginError = "Feil e-post eller passord."
                    case .invalidEmail:
                        loginError = "Ugyldig e-postadresse."
                    default:
                        loginError = "Innlogging feilet. Prøv igjen."
                    }
                } else {
                    loginError = "Innlogging feilet. Prøv igjen."
                }
            }
            isLoading = false
        }
    }
    func signup() {
        isLoading = true
        signupError = ""
        signupSuccess = false
        guard signupPassword == confirmPassword else {
            signupError = "Passordene er ikke like."
            isLoading = false
            return
        }
        Task {
            do {
                try await firebaseManager.signUp(
                    email: signupEmail,
                    password: signupPassword,
                    firstName: firstName,
                    lastName: lastName,
                    companyId: company.id ?? ""
                )
                signupSuccess = true
            } catch {
                signupError = "Kunne ikke opprette bruker. Sjekk e-post og prøv igjen."
            }
            isLoading = false
        }
    }
    func forgotPassword() {
        isLoading = true
        forgotError = ""
        forgotSuccess = false
        Task {
            do {
                try await firebaseManager.resetPassword(email: forgotEmail)
                forgotSuccess = true
            } catch {
                forgotError = "Kunne ikke sende e-post. Sjekk adressen."
            }
            isLoading = false
        }
    }
} 
