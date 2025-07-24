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

public class DocumentsFragment extends Fragment {
    private FirebaseFirestore db;
    private FirebaseAuth mAuth;
    private RecyclerView documentsRecyclerView;
    private DocumentsAdapter documentsAdapter;
    private List<Document> documents = new ArrayList<>();
    private EditText searchInput;
    private ChipGroup filterChipGroup;
    private TextView emptyStateText;
    private View emptyStateView;
    private View loadingView;
    private String selectedCategory = null;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_documents, container, false);
        
        // Initialize Firebase
        db = FirebaseFirestore.getInstance();
        mAuth = FirebaseAuth.getInstance();
        
        // Initialize views
        documentsRecyclerView = view.findViewById(R.id.documents_recycler_view);
        searchInput = view.findViewById(R.id.search_input);
        filterChipGroup = view.findViewById(R.id.filter_chip_group);
        emptyStateView = view.findViewById(R.id.empty_state);
        emptyStateText = view.findViewById(R.id.empty_state_text);
        loadingView = view.findViewById(R.id.loading_view);
        FloatingActionButton fab = view.findViewById(R.id.fab_add_document);
        
        // Setup RecyclerView
        documentsRecyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
        documentsAdapter = new DocumentsAdapter(documents, document -> {
            // TODO: Open document viewer
            // Intent intent = new Intent(getActivity(), DocumentViewerActivity.class);
            // intent.putExtra("documentId", document.getId());
            // startActivity(intent);
        });
        documentsRecyclerView.setAdapter(documentsAdapter);
        
        // Setup search
        searchInput.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                filterDocuments();
            }

            @Override
            public void afterTextChanged(Editable s) {}
        });
        
        // Setup filters
        setupFilterChips();
        
        // Setup FAB
        fab.setOnClickListener(v -> openNewDocument());
        
        // Load documents
        loadDocuments();
        
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
                filterDocuments();
            }
        });
        filterChipGroup.addView(allChip);
        
        // Add category chips
        String[] categories = {"Sikkerhet", "Prosedyre", "Rapport", "Skjema", "Annet"};
        for (String category : categories) {
            Chip chip = new Chip(getContext());
            chip.setText(category);
            chip.setCheckable(true);
            chip.setOnCheckedChangeListener((buttonView, isChecked) -> {
                if (isChecked) {
                    selectedCategory = category;
                    filterDocuments();
                }
            });
            filterChipGroup.addView(chip);
        }
    }

    private void loadDocuments() {
        showLoading(true);
        
        db.collection("documents")
            .whereEqualTo("companyId", "company1") // Replace with actual company ID
            .get()
            .addOnSuccessListener(queryDocumentSnapshots -> {
                documents.clear();
                for (QueryDocumentSnapshot document : queryDocumentSnapshots) {
                    Document doc = Document.fromMap(document.getData());
                    doc.setId(document.getId());
                    documents.add(doc);
                }
                
                showLoading(false);
                filterDocuments();
            })
            .addOnFailureListener(e -> {
                showLoading(false);
                showEmptyState("Feil ved lasting av dokumenter");
            });
    }

    private void filterDocuments() {
        if (documentsAdapter == null) return;
        
        List<Document> filtered = new ArrayList<>();
        String searchText = searchInput.getText().toString().toLowerCase();
        
        for (Document document : documents) {
            boolean matchesSearch = searchText.isEmpty() ||
                    document.getTitle().toLowerCase().contains(searchText) ||
                    document.getDescription().toLowerCase().contains(searchText);
            
            boolean matchesCategory = selectedCategory == null ||
                    document.getCategory().equals(selectedCategory);
            
            if (matchesSearch && matchesCategory) {
                filtered.add(document);
            }
        }
        
        documentsAdapter.updateDocuments(filtered);
        
        if (filtered.isEmpty()) {
            showEmptyState(searchText.isEmpty() ? "Ingen dokumenter funnet" : "Ingen dokumenter matcher søket");
        } else {
            hideEmptyState();
        }
    }

    private void showLoading(boolean show) {
        if (loadingView == null || documentsRecyclerView == null || emptyStateView == null) return;
        
        loadingView.setVisibility(show ? View.VISIBLE : View.GONE);
        documentsRecyclerView.setVisibility(show ? View.GONE : View.VISIBLE);
        emptyStateView.setVisibility(View.GONE);
    }

    private void showEmptyState(String message) {
        if (emptyStateText == null || emptyStateView == null || documentsRecyclerView == null || loadingView == null) return;
        
        emptyStateText.setText(message);
        emptyStateView.setVisibility(View.VISIBLE);
        documentsRecyclerView.setVisibility(View.GONE);
        loadingView.setVisibility(View.GONE);
    }

    private void hideEmptyState() {
        if (emptyStateView == null || documentsRecyclerView == null || loadingView == null) return;
        
        emptyStateView.setVisibility(View.GONE);
        documentsRecyclerView.setVisibility(View.VISIBLE);
        loadingView.setVisibility(View.GONE);
    }

    private void openNewDocument() {
        // TODO: Open new document upload
        // Intent intent = new Intent(getActivity(), NewDocumentActivity.class);
        // startActivity(intent);
    }
} 