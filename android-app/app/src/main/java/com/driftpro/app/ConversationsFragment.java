package com.driftpro.app;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.QueryDocumentSnapshot;
import java.util.ArrayList;
import java.util.List;

public class ConversationsFragment extends Fragment {
    private RecyclerView userRecyclerView;
    private UserAdapter userAdapter;
    private List<ChatUser> users = new ArrayList<>();
    private FirebaseFirestore db;
    private FirebaseAuth mAuth;
    private TextView emptyStateText;
    private View emptyStateView;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_conversations, container, false);
        
        // Initialize Firebase
        db = FirebaseFirestore.getInstance();
        mAuth = FirebaseAuth.getInstance();
        
        // Initialize views
        userRecyclerView = view.findViewById(R.id.users_recycler_view);
        emptyStateView = view.findViewById(R.id.empty_state);
        emptyStateText = view.findViewById(R.id.empty_state_text);
        FloatingActionButton fab = view.findViewById(R.id.fab_add_chat);
        
        // Setup RecyclerView
        userRecyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
        userAdapter = new UserAdapter(users, user -> {
            // Navigate to chat
            Intent intent = new Intent(getActivity(), ChatActivity.class);
            intent.putExtra("chatId", user.getId());
            intent.putExtra("userName", user.getName());
            startActivity(intent);
        });
        userRecyclerView.setAdapter(userAdapter);
        
        // Setup FAB
        fab.setOnClickListener(v -> showCreateOptions());
        
        // Load users
        loadUsers();
        
        return view;
    }

    private void loadUsers() {
        db.collection("users")
            .get()
            .addOnSuccessListener(queryDocumentSnapshots -> {
                users.clear();
                for (QueryDocumentSnapshot document : queryDocumentSnapshots) {
                    String name = document.getString("name");
                    if (name != null) {
                        ChatUser user = new ChatUser(document.getId(), name);
                        users.add(user);
                    }
                }
                
                if (users.isEmpty()) {
                    showEmptyState();
                } else {
                    hideEmptyState();
                }
                
                userAdapter.notifyDataSetChanged();
            })
            .addOnFailureListener(e -> {
                showEmptyState();
            });
    }

    private void showEmptyState() {
        emptyStateView.setVisibility(View.VISIBLE);
        userRecyclerView.setVisibility(View.GONE);
    }

    private void hideEmptyState() {
        emptyStateView.setVisibility(View.GONE);
        userRecyclerView.setVisibility(View.VISIBLE);
    }

    private void showCreateOptions() {
        // For now, just load users and show the list
        // In a full implementation, this would show a dialog with options
        loadUsers();
    }
} 