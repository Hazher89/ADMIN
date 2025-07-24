package com.driftpro.app;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import java.util.List;

public class UserAdapter extends RecyclerView.Adapter<UserAdapter.UserViewHolder> {
    private List<ChatUser> users;
    private OnUserClickListener listener;

    public interface OnUserClickListener {
        void onUserClick(ChatUser user);
    }

    public UserAdapter(List<ChatUser> users, OnUserClickListener listener) {
        this.users = users;
        this.listener = listener;
    }

    @NonNull
    @Override
    public UserViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_user, parent, false);
        return new UserViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull UserViewHolder holder, int position) {
        ChatUser user = users.get(position);
        holder.bind(user);
    }

    @Override
    public int getItemCount() {
        return users.size();
    }

    class UserViewHolder extends RecyclerView.ViewHolder {
        private TextView userName;
        private TextView userStatus;
        private View avatar;

        public UserViewHolder(@NonNull View itemView) {
            super(itemView);
            userName = itemView.findViewById(R.id.user_name);
            userStatus = itemView.findViewById(R.id.user_status);
            avatar = itemView.findViewById(R.id.user_avatar);

            itemView.setOnClickListener(v -> {
                int position = getAdapterPosition();
                if (position != RecyclerView.NO_POSITION && listener != null) {
                    listener.onUserClick(users.get(position));
                }
            });
        }

        public void bind(ChatUser user) {
            userName.setText(user.getName());
            userStatus.setText("Tilgjengelig");
            
            // Set avatar with first letter of name
            if (user.getName() != null && !user.getName().isEmpty()) {
                String firstLetter = user.getName().substring(0, 1).toUpperCase();
                // For now, just set a background color
                // In a full implementation, you'd create a custom view for the avatar
            }
        }
    }
} 