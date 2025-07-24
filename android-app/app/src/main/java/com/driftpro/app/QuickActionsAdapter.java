package com.driftpro.app;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import java.util.List;

public class QuickActionsAdapter extends RecyclerView.Adapter<QuickActionsAdapter.QuickActionViewHolder> {
    private List<DashboardFragment.QuickAction> actions;

    public QuickActionsAdapter(List<DashboardFragment.QuickAction> actions) {
        this.actions = actions;
    }

    @NonNull
    @Override
    public QuickActionViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_quick_action, parent, false);
        return new QuickActionViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull QuickActionViewHolder holder, int position) {
        DashboardFragment.QuickAction action = actions.get(position);
        holder.bind(action);
    }

    @Override
    public int getItemCount() {
        return actions.size();
    }

    static class QuickActionViewHolder extends RecyclerView.ViewHolder {
        private ImageView icon;
        private TextView title;

        public QuickActionViewHolder(@NonNull View itemView) {
            super(itemView);
            icon = itemView.findViewById(R.id.action_icon);
            title = itemView.findViewById(R.id.action_title);
        }

        public void bind(DashboardFragment.QuickAction action) {
            icon.setImageResource(action.iconRes);
            icon.setColorFilter(itemView.getContext().getResources().getColor(action.colorRes));
            title.setText(action.title);
            
            itemView.setOnClickListener(action.onClickListener);
        }
    }
} 