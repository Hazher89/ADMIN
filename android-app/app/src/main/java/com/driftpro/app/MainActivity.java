package com.driftpro.app;

import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentTransaction;
import com.google.firebase.FirebaseApp;

public class MainActivity extends AppCompatActivity {
    private FragmentManager fragmentManager;
    private Company currentCompany;
    private MainTabFragment mainTabFragment;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Initialize Firebase
        FirebaseApp.initializeApp(this);
        
        setContentView(R.layout.activity_main);
        
        fragmentManager = getSupportFragmentManager();
        
        // Start with company selection
        if (savedInstanceState == null) {
            loadFragment(new CompanySelectionFragment());
        }
    }

    public void onCompanySelected(Company company) {
        this.currentCompany = company;
        loadFragment(new LoginFragment(company));
    }

    public void onLoginSuccess() {
        mainTabFragment = new MainTabFragment();
        loadFragment(mainTabFragment);
    }

    public void navigateToTab(int tabIndex) {
        if (mainTabFragment != null) {
            mainTabFragment.navigateToTab(tabIndex);
        }
    }

    private void loadFragment(Fragment fragment) {
        FragmentTransaction transaction = fragmentManager.beginTransaction();
        transaction.replace(R.id.fragment_container, fragment);
        transaction.commit();
    }

    public Company getCurrentCompany() {
        return currentCompany;
    }
} 