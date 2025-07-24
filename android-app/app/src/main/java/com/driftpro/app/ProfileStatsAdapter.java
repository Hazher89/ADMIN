package com.driftpro.app;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import java.util.List;

public class ProfileStatsAdapter extends RecyclerView.Adapter<ProfileStatsAdapter.StatViewHolder> {
    private List<ProfileFragment.StatItem> stats;

    public ProfileStatsAdapter(List<ProfileFragment.StatItem> stats) {
        this.stats = stats;
    }

    @NonNull
    @Override
    public StatViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_profile_stat, parent, false);
        return new StatViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull StatViewHolder holder, int position) {
        ProfileFragment.StatItem stat = stats.get(position);
        holder.bind(stat);
    }

    @Override
    public int getItemCount() {
        return stats.size();
    }

    static class StatViewHolder extends RecyclerView.ViewHolder {
        private ImageView icon;
        private TextView value;
        private TextView title;

        public StatViewHolder(@NonNull View itemView) {
            super(itemView);
            icon = itemView.findViewById(R.id.stat_icon);
            value = itemView.findViewById(R.id.stat_value);
            title = itemView.findViewById(R.id.stat_title);
        }

        public void bind(ProfileFragment.StatItem stat) {
            icon.setImageResource(stat.iconRes);
            icon.setColorFilter(itemView.getContext().getResources().getColor(stat.colorRes));
            value.setText(stat.value);
            title.setText(stat.title);
        }
    }
} 