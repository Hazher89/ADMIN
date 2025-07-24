package com.driftpro.app;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import java.util.List;

public class MenuAdapter extends RecyclerView.Adapter<MenuAdapter.MenuViewHolder> {
    private List<ProfileFragment.MenuItem> menuItems;

    public MenuAdapter(List<ProfileFragment.MenuItem> menuItems) {
        this.menuItems = menuItems;
    }

    @NonNull
    @Override
    public MenuViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_menu, parent, false);
        return new MenuViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull MenuViewHolder holder, int position) {
        ProfileFragment.MenuItem menuItem = menuItems.get(position);
        holder.bind(menuItem, position, getItemCount());
    }

    @Override
    public int getItemCount() {
        return menuItems.size();
    }

    static class MenuViewHolder extends RecyclerView.ViewHolder {
        private ImageView icon;
        private TextView title;
        private View divider;

        public MenuViewHolder(@NonNull View itemView) {
            super(itemView);
            icon = itemView.findViewById(R.id.menu_icon);
            title = itemView.findViewById(R.id.menu_title);
            divider = itemView.findViewById(R.id.menu_divider);
        }

        public void bind(ProfileFragment.MenuItem menuItem, int position, int totalCount) {
            icon.setImageResource(menuItem.iconRes);
            icon.setColorFilter(itemView.getContext().getResources().getColor(menuItem.colorRes));
            title.setText(menuItem.title);
            
            itemView.setOnClickListener(menuItem.onClickListener);
            
            // Show divider for all items except the last one
            if (position == totalCount - 1) {
                divider.setVisibility(View.GONE);
            } else {
                divider.setVisibility(View.VISIBLE);
            }
        }
    }
} 