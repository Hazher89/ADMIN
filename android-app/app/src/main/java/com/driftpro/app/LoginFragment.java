package com.driftpro.app;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;
import androidx.fragment.app.Fragment;
import com.google.android.material.textfield.TextInputEditText;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;

public class LoginFragment extends Fragment {
    private Company company;
    private FirebaseAuth mAuth;
    private TextInputEditText emailInput;
    private TextInputEditText passwordInput;
    private TextView errorMessage;
    private Button loginButton;

    public LoginFragment(Company company) {
        this.company = company;
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_login, container, false);
        
        // Initialize Firebase Auth
        mAuth = FirebaseAuth.getInstance();
        
        // Initialize views
        TextView companyNameText = view.findViewById(R.id.company_name);
        emailInput = view.findViewById(R.id.email_input);
        passwordInput = view.findViewById(R.id.password_input);
        errorMessage = view.findViewById(R.id.error_message);
        loginButton = view.findViewById(R.id.login_button);
        
        companyNameText.setText(company.getName());
        
        loginButton.setOnClickListener(v -> performLogin());
        
        return view;
    }

    private void performLogin() {
        String email = emailInput.getText().toString().trim();
        String password = passwordInput.getText().toString().trim();
        
        // Validate input
        if (email.isEmpty()) {
            showError("Vennligst skriv inn e-post");
            return;
        }
        
        if (password.isEmpty()) {
            showError("Vennligst skriv inn passord");
            return;
        }
        
        // Show loading state
        loginButton.setEnabled(false);
        loginButton.setText("Logger inn...");
        hideError();
        
        // Perform Firebase authentication
        mAuth.signInWithEmailAndPassword(email, password)
                .addOnCompleteListener(task -> {
                    if (task.isSuccessful()) {
                        // Sign in success
                        FirebaseUser user = mAuth.getCurrentUser();
                        if (user != null) {
                            // Navigate to main app
                            if (getActivity() instanceof MainActivity) {
                                ((MainActivity) getActivity()).onLoginSuccess();
                            }
                        }
                    } else {
                        // Sign in failed
                        String errorMsg = "Innlogging mislyktes. Sjekk e-post og passord.";
                        if (task.getException() != null) {
                            String exceptionMsg = task.getException().getMessage();
                            if (exceptionMsg != null) {
                                if (exceptionMsg.contains("no user record")) {
                                    errorMsg = "Ingen bruker funnet med denne e-posten";
                                } else if (exceptionMsg.contains("password is invalid")) {
                                    errorMsg = "Feil passord";
                                } else if (exceptionMsg.contains("badly formatted")) {
                                    errorMsg = "Ugyldig e-post format";
                                }
                            }
                        }
                        showError(errorMsg);
                        
                        // Reset button state
                        loginButton.setEnabled(true);
                        loginButton.setText("Logg inn");
                    }
                });
    }

    private void showError(String message) {
        errorMessage.setText(message);
        errorMessage.setVisibility(View.VISIBLE);
    }

    private void hideError() {
        errorMessage.setVisibility(View.GONE);
    }
} 