package com.driftpro.app;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import java.util.List;

public class ActivityAdapter extends RecyclerView.Adapter<ActivityAdapter.ActivityViewHolder> {
    private List<DashboardFragment.ActivityItem> activities;

    public ActivityAdapter(List<DashboardFragment.ActivityItem> activities) {
        this.activities = activities;
    }

    @NonNull
    @Override
    public ActivityViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_activity, parent, false);
        return new ActivityViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ActivityViewHolder holder, int position) {
        DashboardFragment.ActivityItem activity = activities.get(position);
        holder.bind(activity);
    }

    @Override
    public int getItemCount() {
        return activities.size();
    }

    static class ActivityViewHolder extends RecyclerView.ViewHolder {
        private ImageView icon;
        private TextView title;
        private TextView subtitle;

        public ActivityViewHolder(@NonNull View itemView) {
            super(itemView);
            icon = itemView.findViewById(R.id.activity_icon);
            title = itemView.findViewById(R.id.activity_title);
            subtitle = itemView.findViewById(R.id.activity_subtitle);
        }

        public void bind(DashboardFragment.ActivityItem activity) {
            icon.setImageResource(activity.iconRes);
            icon.setColorFilter(itemView.getContext().getResources().getColor(activity.colorRes));
            title.setText(activity.title);
            subtitle.setText(activity.subtitle);
        }
    }
} 