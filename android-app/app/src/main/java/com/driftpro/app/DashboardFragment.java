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
import java.util.ArrayList;
import java.util.List;

public class DashboardFragment extends Fragment {
    private FirebaseFirestore db;
    private FirebaseAuth mAuth;
    private RecyclerView statsRecyclerView;
    private RecyclerView quickActionsRecyclerView;
    private RecyclerView activityRecyclerView;
    private StatsAdapter statsAdapter;
    private QuickActionsAdapter quickActionsAdapter;
    private ActivityAdapter activityAdapter;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_dashboard_new, container, false);
        
        // Initialize Firebase
        db = FirebaseFirestore.getInstance();
        mAuth = FirebaseAuth.getInstance();
        
        // Initialize views
        statsRecyclerView = view.findViewById(R.id.stats_recycler_view);
        quickActionsRecyclerView = view.findViewById(R.id.quick_actions_recycler_view);
        activityRecyclerView = view.findViewById(R.id.activity_recycler_view);
        
        // Setup RecyclerViews
        setupStatsRecyclerView();
        setupQuickActionsRecyclerView();
        setupActivityRecyclerView();
        
        // Load data
        loadDashboardData();
        
        return view;
    }

    private void setupStatsRecyclerView() {
        statsRecyclerView.setLayoutManager(new GridLayoutManager(getContext(), 2));
        List<StatCard> stats = new ArrayList<>();
        stats.add(new StatCard("Brukere", "128", R.drawable.ic_person_group, R.color.blue));
        stats.add(new StatCard("Avvik", "14", R.drawable.ic_warning, R.color.orange));
        stats.add(new StatCard("Dokumenter", "37", R.drawable.ic_document, R.color.teal));
        stats.add(new StatCard("Skift", "9", R.drawable.ic_calendar, R.color.green));
        
        statsAdapter = new StatsAdapter(stats);
        statsRecyclerView.setAdapter(statsAdapter);
    }

    private void setupQuickActionsRecyclerView() {
        quickActionsRecyclerView.setLayoutManager(new GridLayoutManager(getContext(), 3));
        List<QuickAction> actions = new ArrayList<>();
        actions.add(new QuickAction("Ny avvik", R.drawable.ic_warning, R.color.orange, v -> openNewDeviation()));
        actions.add(new QuickAction("Nytt dokument", R.drawable.ic_document, R.color.teal, v -> openNewDocument()));
        actions.add(new QuickAction("Nytt skift", R.drawable.ic_calendar, R.color.green, v -> openNewShift()));
        actions.add(new QuickAction("Chat", R.drawable.ic_chat_bubble, R.color.blue, v -> openChat()));
        actions.add(new QuickAction("Profil", R.drawable.ic_profile, R.color.purple, v -> openProfile()));
        
        quickActionsAdapter = new QuickActionsAdapter(actions);
        quickActionsRecyclerView.setAdapter(quickActionsAdapter);
    }

    private void setupActivityRecyclerView() {
        activityRecyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
        List<ActivityItem> activities = new ArrayList<>();
        activities.add(new ActivityItem("Nytt avvik rapportert", "Avvik #1234 - 2 min siden", R.drawable.ic_warning, R.color.orange));
        activities.add(new ActivityItem("Skift opprettet", "Dagvakt - 1 time siden", R.drawable.ic_calendar, R.color.green));
        activities.add(new ActivityItem("Dokument lastet opp", "Sikkerhetsrutine.pdf - 3 timer siden", R.drawable.ic_document, R.color.teal));
        
        activityAdapter = new ActivityAdapter(activities);
        activityRecyclerView.setAdapter(activityAdapter);
    }

    private void loadDashboardData() {
        // Load real data from Firestore here
        // For now using mock data
    }

    private void openNewDeviation() {
        // TODO: Open new deviation form
    }

    private void openNewDocument() {
        // TODO: Open new document form
    }

    private void openNewShift() {
        // TODO: Open new shift form
    }

    private void openChat() {
        // Navigate to chat
        if (getActivity() instanceof MainActivity) {
            ((MainActivity) getActivity()).navigateToTab(1); // Chat tab
        }
    }

    private void openProfile() {
        // Navigate to profile
        if (getActivity() instanceof MainActivity) {
            ((MainActivity) getActivity()).navigateToTab(4); // Profile tab
        }
    }

    // Data classes
    public static class StatCard {
        public String title;
        public String value;
        public int iconRes;
        public int colorRes;

        public StatCard(String title, String value, int iconRes, int colorRes) {
            this.title = title;
            this.value = value;
            this.iconRes = iconRes;
            this.colorRes = colorRes;
        }
    }

    public static class QuickAction {
        public String title;
        public int iconRes;
        public int colorRes;
        public View.OnClickListener onClickListener;

        public QuickAction(String title, int iconRes, int colorRes, View.OnClickListener onClickListener) {
            this.title = title;
            this.iconRes = iconRes;
            this.colorRes = colorRes;
            this.onClickListener = onClickListener;
        }
    }

    public static class ActivityItem {
        public String title;
        public String subtitle;
        public int iconRes;
        public int colorRes;

        public ActivityItem(String title, String subtitle, int iconRes, int colorRes) {
            this.title = title;
            this.subtitle = subtitle;
            this.iconRes = iconRes;
            this.colorRes = colorRes;
        }
    }
} 