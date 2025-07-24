package com.driftpro.app;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import java.util.List;

public class DeviationsAdapter extends RecyclerView.Adapter<DeviationsAdapter.DeviationViewHolder> {
    private List<Deviation> deviations;
    private OnDeviationClickListener listener;

    public interface OnDeviationClickListener {
        void onDeviationClick(Deviation deviation);
    }

    public DeviationsAdapter(List<Deviation> deviations, OnDeviationClickListener listener) {
        this.deviations = deviations;
        this.listener = listener;
    }

    @NonNull
    @Override
    public DeviationViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_deviation, parent, false);
        return new DeviationViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull DeviationViewHolder holder, int position) {
        Deviation deviation = deviations.get(position);
        holder.bind(deviation);
    }

    @Override
    public int getItemCount() {
        return deviations.size();
    }

    public void updateDeviations(List<Deviation> newDeviations) {
        this.deviations = newDeviations;
        notifyDataSetChanged();
    }

    class DeviationViewHolder extends RecyclerView.ViewHolder {
        private ImageView statusIcon;
        private TextView title;
        private TextView description;
        private TextView status;
        private TextView category;
        private TextView severity;

        public DeviationViewHolder(@NonNull View itemView) {
            super(itemView);
            statusIcon = itemView.findViewById(R.id.deviation_status_icon);
            title = itemView.findViewById(R.id.deviation_title);
            description = itemView.findViewById(R.id.deviation_description);
            status = itemView.findViewById(R.id.deviation_status);
            category = itemView.findViewById(R.id.deviation_category);
            severity = itemView.findViewById(R.id.deviation_severity);

            itemView.setOnClickListener(v -> {
                int position = getAdapterPosition();
                if (position != RecyclerView.NO_POSITION && listener != null) {
                    listener.onDeviationClick(deviations.get(position));
                }
            });
        }

        public void bind(Deviation deviation) {
            title.setText(deviation.getTitle());
            description.setText(deviation.getDescription());
            status.setText(deviation.getStatusDisplayName());
            category.setText(deviation.getCategoryDisplayName());
            severity.setText(deviation.getSeverityDisplayName());

            // Set status icon and color
            if ("reported".equals(deviation.getStatus())) {
                statusIcon.setImageResource(R.drawable.ic_warning);
                statusIcon.setColorFilter(itemView.getContext().getResources().getColor(R.color.orange));
                status.setBackgroundResource(R.drawable.status_reported_background);
            } else {
                statusIcon.setImageResource(R.drawable.ic_check_circle);
                statusIcon.setColorFilter(itemView.getContext().getResources().getColor(R.color.green));
                status.setBackgroundResource(R.drawable.status_resolved_background);
            }
        }
    }
} 