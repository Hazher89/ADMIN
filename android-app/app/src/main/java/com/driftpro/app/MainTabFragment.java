package com.driftpro.app;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentTransaction;
import com.google.android.material.bottomnavigation.BottomNavigationView;

public class MainTabFragment extends Fragment {
    private BottomNavigationView bottomNavigationView;
    private FragmentManager fragmentManager;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_main_tab, container, false);
        
        bottomNavigationView = view.findViewById(R.id.bottom_navigation);
        fragmentManager = getChildFragmentManager();
        
        // Set default fragment
        if (savedInstanceState == null) {
            loadFragment(new DashboardFragment());
        }

        // Set up bottom navigation
        bottomNavigationView.setOnItemSelectedListener(item -> {
            Fragment fragment = null;
            
            if (item.getItemId() == R.id.nav_dashboard) {
                fragment = new DashboardFragment();
            } else if (item.getItemId() == R.id.nav_conversations) {
                fragment = new ConversationsFragment();
            } else if (item.getItemId() == R.id.nav_deviations) {
                fragment = new DeviationsFragment();
            } else if (item.getItemId() == R.id.nav_documents) {
                fragment = new DocumentsFragment();
            } else if (item.getItemId() == R.id.nav_profile) {
                fragment = new ProfileFragment();
            }

            if (fragment != null) {
                loadFragment(fragment);
                return true;
            }
            return false;
        });
        
        return view;
    }

    public void navigateToTab(int tabIndex) {
        Fragment fragment = null;
        
        switch (tabIndex) {
            case 0:
                fragment = new DashboardFragment();
                bottomNavigationView.setSelectedItemId(R.id.nav_dashboard);
                break;
            case 1:
                fragment = new ConversationsFragment();
                bottomNavigationView.setSelectedItemId(R.id.nav_conversations);
                break;
            case 2:
                fragment = new DeviationsFragment();
                bottomNavigationView.setSelectedItemId(R.id.nav_deviations);
                break;
            case 3:
                fragment = new DocumentsFragment();
                bottomNavigationView.setSelectedItemId(R.id.nav_documents);
                break;
            case 4:
                fragment = new ProfileFragment();
                bottomNavigationView.setSelectedItemId(R.id.nav_profile);
                break;
        }

        if (fragment != null) {
            loadFragment(fragment);
        }
    }

    private void loadFragment(Fragment fragment) {
        FragmentTransaction transaction = fragmentManager.beginTransaction();
        transaction.replace(R.id.tab_fragment_container, fragment);
        transaction.commit();
    }
} 