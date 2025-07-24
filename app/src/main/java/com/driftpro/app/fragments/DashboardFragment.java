package com.driftpro.app.fragments;

import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import com.driftpro.app.R;

public class DashboardFragment extends Fragment {

    private static final String TAG = "DriftPro_Dashboard";

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, 
                             @Nullable ViewGroup container, 
                             @Nullable Bundle savedInstanceState) {
        
        Log.d(TAG, "onCreateView started");
        
        try {
            // For testing - use simple TextView first
            TextView testView = new TextView(getContext());
            testView.setText("🎉 NATIVE DRIFTPRO ANDROID-APP VIRKER! 🎉\n\n📊 Dashboard\n👥 Brukere: 128\n⚠️ Avvik: 14\n📄 Dokumenter: 37\n📅 Skift: 9");
            testView.setTextSize(18);
            testView.setPadding(50, 100, 50, 50);
            testView.setTextAlignment(View.TEXT_ALIGNMENT_CENTER);
            
            Log.d(TAG, "TextView created successfully");
            return testView;
            
        } catch (Exception e) {
            Log.e(TAG, "Error in onCreateView: " + e.getMessage(), e);
            
            // Fallback simple view
            TextView errorView = new TextView(getContext());
            errorView.setText("⚠️ Dashboard loading error");
            errorView.setTextSize(16);
            errorView.setPadding(50, 100, 50, 50);
            return errorView;
        }
    }
} 