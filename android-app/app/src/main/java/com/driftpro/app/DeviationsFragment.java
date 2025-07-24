package com.driftpro.app;

import android.content.Intent;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.TextView;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.google.android.material.chip.Chip;
import com.google.android.material.chip.ChipGroup;
import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.QueryDocumentSnapshot;
import java.util.ArrayList;
import java.util.List;

public class DeviationsFragment extends Fragment {
    private FirebaseFirestore db;
    private FirebaseAuth mAuth;
    private RecyclerView deviationsRecyclerView;
    private DeviationsAdapter deviationsAdapter;
    private List<Deviation> deviations = new ArrayList<>();
    private EditText searchInput;
    private ChipGroup filterChipGroup;
    private TextView emptyStateText;
    private View emptyStateView;
    private View loadingView;
    private String selectedCategory = null;
    private String selectedSeverity = null;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_deviations, container, false);
        
        // Initialize Firebase
        db = FirebaseFirestore.getInstance();
        mAuth = FirebaseAuth.getInstance();
        
        // Initialize views
        deviationsRecyclerView = view.findViewById(R.id.deviations_recycler_view);
        searchInput = view.findViewById(R.id.search_input);
        filterChipGroup = view.findViewById(R.id.filter_chip_group);
        emptyStateView = view.findViewById(R.id.empty_state);
        emptyStateText = view.findViewById(R.id.empty_state_text);
        loadingView = view.findViewById(R.id.loading_view);
        FloatingActionButton fab = view.findViewById(R.id.fab_add_deviation);
        
        // Setup RecyclerView
        deviationsRecyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
        deviationsAdapter = new DeviationsAdapter(deviations, deviation -> {
            // TODO: Navigate to deviation detail
            // Intent intent = new Intent(getActivity(), DeviationDetailActivity.class);
            // intent.putExtra("deviationId", deviation.getId());
            // startActivity(intent);
        });
        deviationsRecyclerView.setAdapter(deviationsAdapter);
        
        // Setup search
        searchInput.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                filterDeviations();
            }

            @Override
            public void afterTextChanged(Editable s) {}
        });
        
        // Setup filters
        setupFilterChips();
        
        // Setup FAB
        fab.setOnClickListener(v -> openNewDeviation());
        
        // Load deviations
        loadDeviations();
        
        return view;
    }

    private void setupFilterChips() {
        if (getContext() == null || filterChipGroup == null) return;
        
        // Add "Alle" chip
        Chip allChip = new Chip(getContext());
        allChip.setText("Alle");
        allChip.setCheckable(true);
        allChip.setChecked(true);
        allChip.setOnCheckedChangeListener((buttonView, isChecked) -> {
            if (isChecked) {
                selectedCategory = null;
                selectedSeverity = null;
                filterDeviations();
            }
        });
        filterChipGroup.addView(allChip);
        
        // Add category chips
        String[] categories = {"Sikkerhet", "Kvalitet", "Miljø", "Utstyr", "Prosess", "Annet"};
        for (String category : categories) {
            Chip chip = new Chip(getContext());
            chip.setText(category);
            chip.setCheckable(true);
            chip.setOnCheckedChangeListener((buttonView, isChecked) -> {
                if (isChecked) {
                    selectedCategory = category;
                    selectedSeverity = null;
                    filterDeviations();
                }
            });
            filterChipGroup.addView(chip);
        }
    }

    private void loadDeviations() {
        showLoading(true);
        
        db.collection("deviations")
            .whereEqualTo("companyId", "company1") // Replace with actual company ID
            .get()
            .addOnSuccessListener(queryDocumentSnapshots -> {
                deviations.clear();
                for (QueryDocumentSnapshot document : queryDocumentSnapshots) {
                    Deviation deviation = Deviation.fromMap(document.getData());
                    deviation.setId(document.getId());
                    deviations.add(deviation);
                }
                
                showLoading(false);
                filterDeviations();
            })
            .addOnFailureListener(e -> {
                showLoading(false);
                showEmptyState("Feil ved lasting av avvik");
            });
    }

    private void filterDeviations() {
        if (deviationsAdapter == null) return;
        
        List<Deviation> filtered = new ArrayList<>();
        String searchText = searchInput.getText().toString().toLowerCase();
        
        for (Deviation deviation : deviations) {
            boolean matchesSearch = searchText.isEmpty() ||
                    deviation.getTitle().toLowerCase().contains(searchText) ||
                    deviation.getDescription().toLowerCase().contains(searchText);
            
            boolean matchesCategory = selectedCategory == null ||
                    deviation.getCategory().equals(selectedCategory);
            
            boolean matchesSeverity = selectedSeverity == null ||
                    deviation.getSeverity().equals(selectedSeverity);
            
            if (matchesSearch && matchesCategory && matchesSeverity) {
                filtered.add(deviation);
            }
        }
        
        deviationsAdapter.updateDeviations(filtered);
        
        if (filtered.isEmpty()) {
            showEmptyState(searchText.isEmpty() ? "Ingen avvik funnet" : "Ingen avvik matcher søket");
        } else {
            hideEmptyState();
        }
    }

    private void showLoading(boolean show) {
        if (loadingView == null || deviationsRecyclerView == null || emptyStateView == null) return;
        
        loadingView.setVisibility(show ? View.VISIBLE : View.GONE);
        deviationsRecyclerView.setVisibility(show ? View.GONE : View.VISIBLE);
        emptyStateView.setVisibility(View.GONE);
    }

    private void showEmptyState(String message) {
        if (emptyStateText == null || emptyStateView == null || deviationsRecyclerView == null || loadingView == null) return;
        
        emptyStateText.setText(message);
        emptyStateView.setVisibility(View.VISIBLE);
        deviationsRecyclerView.setVisibility(View.GONE);
        loadingView.setVisibility(View.GONE);
    }

    private void hideEmptyState() {
        if (emptyStateView == null || deviationsRecyclerView == null || loadingView == null) return;
        
        emptyStateView.setVisibility(View.GONE);
        deviationsRecyclerView.setVisibility(View.VISIBLE);
        loadingView.setVisibility(View.GONE);
    }

    private void openNewDeviation() {
        // TODO: Open new deviation form
        // Intent intent = new Intent(getActivity(), NewDeviationActivity.class);
        // startActivity(intent);
    }
} 