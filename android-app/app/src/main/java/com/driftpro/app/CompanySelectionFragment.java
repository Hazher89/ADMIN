package com.driftpro.app;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.QueryDocumentSnapshot;
import java.util.ArrayList;
import java.util.List;

public class CompanySelectionFragment extends Fragment {
    private EditText searchEditText;
    private RecyclerView companiesRecyclerView;
    private TextView statusText;
    private LinearLayout loadingLayout;
    private CompanyAdapter companyAdapter;
    private List<Company> companies = new ArrayList<>();
    private boolean isLoading = false;
    private boolean hasSearched = false;
    private FirebaseFirestore db;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_company_selection, container, false);
        
        // Initialize Firestore
        db = FirebaseFirestore.getInstance();
        
        searchEditText = view.findViewById(R.id.search_edit_text);
        companiesRecyclerView = view.findViewById(R.id.companies_recycler);
        statusText = view.findViewById(R.id.status_text);
        loadingLayout = view.findViewById(R.id.loading_layout);
        ImageButton searchButton = view.findViewById(R.id.search_button);
        
        // Setup RecyclerView
        companyAdapter = new CompanyAdapter(companies, company -> {
            if (getActivity() instanceof MainActivity) {
                ((MainActivity) getActivity()).onCompanySelected(company);
            }
        });
        companiesRecyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
        companiesRecyclerView.setAdapter(companyAdapter);
        
        // Setup search
        searchButton.setOnClickListener(v -> searchCompanies());
        
        return view;
    }

    private void searchCompanies() {
        String searchText = searchEditText.getText().toString().trim();
        if (searchText.isEmpty()) return;
        
        isLoading = true;
        hasSearched = false;
        companies.clear();
        companyAdapter.notifyDataSetChanged();
        updateUI();
        
        // Query Firestore for companies
        db.collection("companies")
            .get()
            .addOnSuccessListener(queryDocumentSnapshots -> {
                companies.clear();
                for (QueryDocumentSnapshot document : queryDocumentSnapshots) {
                    String name = document.getString("name");
                    if (name != null && name.toLowerCase().contains(searchText.toLowerCase())) {
                        Company company = new Company(
                            document.getId(),
                            name,
                            document.getString("logoURL"),
                            document.getString("primaryColor"),
                            document.getString("secondaryColor"),
                            document.getString("address"),
                            document.getString("phoneNumber"),
                            document.getString("email"),
                            document.getString("website"),
                            document.getString("description"),
                            document.getString("adminUserId")
                        );
                        companies.add(company);
                    }
                }
                
                isLoading = false;
                hasSearched = true;
                updateUI();
            })
            .addOnFailureListener(e -> {
                isLoading = false;
                hasSearched = true;
                updateUI();
                // Handle error
            });
    }

    private void updateUI() {
        if (isLoading) {
            loadingLayout.setVisibility(View.VISIBLE);
            companiesRecyclerView.setVisibility(View.GONE);
            statusText.setVisibility(View.GONE);
        } else if (hasSearched && companies.isEmpty()) {
            loadingLayout.setVisibility(View.GONE);
            companiesRecyclerView.setVisibility(View.GONE);
            statusText.setVisibility(View.VISIBLE);
            statusText.setText("Ingen bedrifter funnet");
        } else if (!companies.isEmpty()) {
            loadingLayout.setVisibility(View.GONE);
            companiesRecyclerView.setVisibility(View.VISIBLE);
            statusText.setVisibility(View.GONE);
            companyAdapter.notifyDataSetChanged();
        }
    }
} 