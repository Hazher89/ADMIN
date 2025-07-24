package com.driftpro.app;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.google.android.material.card.MaterialCardView;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.DocumentSnapshot;
import java.util.ArrayList;
import java.util.List;

public class ProfileFragment extends Fragment {
    private FirebaseFirestore db;
    private FirebaseAuth mAuth;
    private RecyclerView statsRecyclerView;
    private RecyclerView menuRecyclerView;
    private ProfileStatsAdapter statsAdapter;
    private MenuAdapter menuAdapter;
    private TextView userName;
    private TextView userEmail;
    private TextView userRole;
    private TextView userDepartment;
    private TextView companyName;
    private TextView companyAddress;
    private TextView companyPhone;
    private TextView companyEmail;
    private TextView companyWebsite;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_profile, container, false);
        
        // Initialize Firebase
        db = FirebaseFirestore.getInstance();
        mAuth = FirebaseAuth.getInstance();
        
        // Initialize views
        initializeViews(view);
        setupRecyclerViews();
        loadUserData();
        loadCompanyData();
        
        return view;
    }

    private void initializeViews(View view) {
        // User info views
        userName = view.findViewById(R.id.user_name);
        userEmail = view.findViewById(R.id.user_email);
        userRole = view.findViewById(R.id.user_role);
        userDepartment = view.findViewById(R.id.user_department);
        
        // Company info views
        companyName = view.findViewById(R.id.company_name);
        companyAddress = view.findViewById(R.id.company_address);
        companyPhone = view.findViewById(R.id.company_phone);
        companyEmail = view.findViewById(R.id.company_email);
        companyWebsite = view.findViewById(R.id.company_website);
        
        // RecyclerViews
        statsRecyclerView = view.findViewById(R.id.stats_recycler_view);
        menuRecyclerView = view.findViewById(R.id.menu_recycler_view);
    }

    private void setupRecyclerViews() {
        // Setup stats
        statsRecyclerView.setLayoutManager(new GridLayoutManager(getContext(), 3));
        List<StatItem> stats = new ArrayList<>();
        stats.add(new StatItem("Rapporterte avvik", "12", R.drawable.ic_warning, R.color.orange));
        stats.add(new StatItem("Opplastede dokumenter", "8", R.drawable.ic_document, R.color.blue));
        stats.add(new StatItem("Dager siden oppstart", "45", R.drawable.ic_calendar, R.color.green));
        
        statsAdapter = new ProfileStatsAdapter(stats);
        statsRecyclerView.setAdapter(statsAdapter);
        
        // Setup menu items
        menuRecyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
        List<MenuItem> menuItems = new ArrayList<>();
        menuItems.add(new MenuItem("Min aktivitet", R.drawable.ic_chart_line, R.color.blue, v -> openMyActivity()));
        menuItems.add(new MenuItem("Mine avvik", R.drawable.ic_warning, R.color.orange, v -> openMyDeviations()));
        menuItems.add(new MenuItem("Mine dokumenter", R.drawable.ic_document, R.color.green, v -> openMyDocuments()));
        menuItems.add(new MenuItem("Bursdagskalender", R.drawable.ic_calendar, R.color.pink, v -> openBirthdayCalendar()));
        menuItems.add(new MenuItem("Hjelp og støtte", R.drawable.ic_question_circle, R.color.purple, v -> openHelp()));
        
        menuAdapter = new MenuAdapter(menuItems);
        menuRecyclerView.setAdapter(menuAdapter);
    }

    private void loadUserData() {
        if (mAuth.getCurrentUser() != null) {
            String userId = mAuth.getCurrentUser().getUid();
            
            db.collection("users").document(userId).get()
                .addOnSuccessListener(documentSnapshot -> {
                    if (documentSnapshot.exists()) {
                        String name = documentSnapshot.getString("name");
                        String email = documentSnapshot.getString("email");
                        String role = documentSnapshot.getString("role");
                        String department = documentSnapshot.getString("department");
                        
                        userName.setText(name);
                        userEmail.setText(email);
                        userRole.setText(role);
                        if (department != null && !department.isEmpty()) {
                            userDepartment.setVisibility(View.VISIBLE);
                            userDepartment.setText(department);
                        } else {
                            userDepartment.setVisibility(View.GONE);
                        }
                    }
                });
        }
    }

    private void loadCompanyData() {
        // Load company data from Firestore
        db.collection("companies").document("company1").get() // Replace with actual company ID
            .addOnSuccessListener(documentSnapshot -> {
                if (documentSnapshot.exists()) {
                    companyName.setText(documentSnapshot.getString("name"));
                    
                    String address = documentSnapshot.getString("address");
                    if (address != null && !address.isEmpty()) {
                        companyAddress.setVisibility(View.VISIBLE);
                        companyAddress.setText(address);
                    } else {
                        companyAddress.setVisibility(View.GONE);
                    }
                    
                    String phone = documentSnapshot.getString("phoneNumber");
                    if (phone != null && !phone.isEmpty()) {
                        companyPhone.setVisibility(View.VISIBLE);
                        companyPhone.setText(phone);
                    } else {
                        companyPhone.setVisibility(View.GONE);
                    }
                    
                    String email = documentSnapshot.getString("email");
                    if (email != null && !email.isEmpty()) {
                        companyEmail.setVisibility(View.VISIBLE);
                        companyEmail.setText(email);
                    } else {
                        companyEmail.setVisibility(View.GONE);
                    }
                    
                    String website = documentSnapshot.getString("website");
                    if (website != null && !website.isEmpty()) {
                        companyWebsite.setVisibility(View.VISIBLE);
                        companyWebsite.setText(website);
                    } else {
                        companyWebsite.setVisibility(View.GONE);
                    }
                }
            });
    }

    private void openMyActivity() {
        // TODO: Navigate to my activity
    }

    private void openMyDeviations() {
        // TODO: Navigate to my deviations
    }

    private void openMyDocuments() {
        // TODO: Navigate to my documents
    }

    private void openBirthdayCalendar() {
        // TODO: Navigate to birthday calendar
    }

    private void openHelp() {
        // TODO: Navigate to help
    }

    // Data classes
    public static class StatItem {
        public String title;
        public String value;
        public int iconRes;
        public int colorRes;

        public StatItem(String title, String value, int iconRes, int colorRes) {
            this.title = title;
            this.value = value;
            this.iconRes = iconRes;
            this.colorRes = colorRes;
        }
    }

    public static class MenuItem {
        public String title;
        public int iconRes;
        public int colorRes;
        public View.OnClickListener onClickListener;

        public MenuItem(String title, int iconRes, int colorRes, View.OnClickListener onClickListener) {
            this.title = title;
            this.iconRes = iconRes;
            this.colorRes = colorRes;
            this.onClickListener = onClickListener;
        }
    }
} 