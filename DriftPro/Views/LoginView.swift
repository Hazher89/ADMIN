import SwiftUI

struct LoginView: View {
    let company: Company
    @EnvironmentObject var firebaseManager: FirebaseManager
    @Environment(\.dismiss) private var dismiss
    
    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var showError = false
    @State private var errorMessage = ""
    @State private var showSignUp = false
    @State private var showForgotPassword = false
    
    var body: some View {
        ZStack {
            // Gradient bakgrunn
            LinearGradient(
                gradient: Gradient(colors: [Color.purple.opacity(0.8), Color.blue.opacity(0.7), Color.black]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            ScrollView {
                VStack(spacing: 32) {
                    // Header
                    VStack(spacing: 20) {
                        // Company logo
                        ZStack {
                            Circle()
                                .fill(LinearGradient(
                                    gradient: Gradient(colors: [.blue, .purple]),
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ))
                                .frame(width: 80, height: 80)
                            Image(systemName: "building.2.fill")
                                .font(.system(size: 40, weight: .medium))
                                .foregroundColor(.white)
                        }
                        VStack(spacing: 8) {
                            Text("Velkommen til")
                                .font(.system(size: 18, weight: .medium))
                                .foregroundColor(.white.opacity(0.8))
                            Text(company.name)
                                .font(.system(size: 24, weight: .bold, design: .rounded))
                                .foregroundColor(.white)
                                .multilineTextAlignment(.center)
                        }
                    }
                    .padding(.top, 60)
                    .padding(.horizontal, 20)

                    // Login form
                    VStack(spacing: 20) {
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
                                    .keyboardType(.emailAddress)
                                    .autocapitalization(.none)
                                    .disableAutocorrection(true)
                                    .foregroundColor(.white)
                                    .accentColor(.white)
                            }
                            .padding()
                            .background(Color.white.opacity(0.15))
                            .cornerRadius(12)
                        }
                        // Password field
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
                                    .foregroundColor(.white)
                                    .accentColor(.white)
                            }
                            .padding()
                            .background(Color.white.opacity(0.15))
                            .cornerRadius(12)
                        }
                        // Forgot password
                        HStack {
                            Spacer()
                            Button("Glemt passord?") {
                                showForgotPassword = true
                            }
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.white.opacity(0.8))
                        }
                        // Login button
                        Button(action: signIn) {
                            HStack {
                                if isLoading {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                        .scaleEffect(0.8)
                                } else {
                                    Text("Logg inn")
                                        .font(.system(size: 18, weight: .semibold))
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .frame(height: 50)
                            .background(
                                LinearGradient(
                                    gradient: Gradient(colors: [.blue, .purple]),
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .foregroundColor(.white)
                            .cornerRadius(12)
                            .shadow(color: .blue.opacity(0.3), radius: 8, x: 0, y: 4)
                        }
                        .disabled(isLoading || email.isEmpty || password.isEmpty)
                        .opacity((isLoading || email.isEmpty || password.isEmpty) ? 0.6 : 1.0)
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 20)

                    Spacer(minLength: 50)
                }
            }
        }
        .alert("Feil", isPresented: $showError) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
    }
    
    private func signIn() {
        isLoading = true
        
        Task {
            do {
                try await firebaseManager.signIn(email: email, password: password)
                dismiss()
            } catch {
                await MainActor.run {
                    errorMessage = "Kunne ikke logge inn. Sjekk e-post og passord."
                    showError = true
                    isLoading = false
                }
            }
        }
    }
}

#Preview {
    LoginView(company: Company(name: "Test Company", adminUserId: "admin"))
        .environmentObject(FirebaseManager.shared)
} 