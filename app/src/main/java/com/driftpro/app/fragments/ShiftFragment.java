package com.driftpro.app.fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

public class ShiftFragment extends Fragment {

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, 
                             @Nullable ViewGroup container, 
                             @Nullable Bundle savedInstanceState) {
        TextView textView = new TextView(getContext());
        textView.setText("📅 Skiftplanlegging kommer snart!");
        textView.setTextSize(20);
        textView.setPadding(50, 200, 50, 50);
        textView.setTextAlignment(View.TEXT_ALIGNMENT_CENTER);
        return textView;
    }
} 