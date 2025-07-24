package com.driftpro.app;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import java.text.SimpleDateFormat;
import java.util.List;
import java.util.Locale;

public class MessageAdapter extends RecyclerView.Adapter<MessageAdapter.MessageViewHolder> {
    private static final int VIEW_TYPE_SENT = 1;
    private static final int VIEW_TYPE_RECEIVED = 2;
    
    private List<ChatMessage> messages;
    private String currentUserId;
    private MessageActionListener actionListener;
    
    public interface MessageActionListener {
        void onReply(ChatMessage message);
        void onLongPress(ChatMessage message);
    }

    public MessageAdapter(List<ChatMessage> messages, String currentUserId, MessageActionListener listener) {
        this.messages = messages;
        this.currentUserId = currentUserId;
        this.actionListener = listener;
    }

    @Override
    public int getItemViewType(int position) {
        ChatMessage message = messages.get(position);
        return message.getSenderId().equals(currentUserId) ? VIEW_TYPE_SENT : VIEW_TYPE_RECEIVED;
    }

    @NonNull
    @Override
    public MessageViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        int layoutRes = viewType == VIEW_TYPE_SENT ? R.layout.item_message_sent : R.layout.item_message_received;
        View view = LayoutInflater.from(parent.getContext()).inflate(layoutRes, parent, false);
        return new MessageViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull MessageViewHolder holder, int position) {
        ChatMessage message = messages.get(position);
        holder.bind(message);
    }

    @Override
    public int getItemCount() {
        return messages.size();
    }

    public void updateMessages(List<ChatMessage> newMessages) {
        this.messages = newMessages;
        notifyDataSetChanged();
    }

    class MessageViewHolder extends RecyclerView.ViewHolder {
        private TextView messageText;
        private TextView timeText;
        private TextView statusText;
        private TextView replyText;
        private View replyContainer;
        private ImageView statusIcon;
        private View messageContainer;

        public MessageViewHolder(@NonNull View itemView) {
            super(itemView);
            messageText = itemView.findViewById(R.id.message_text);
            timeText = itemView.findViewById(R.id.time_text);
            statusText = itemView.findViewById(R.id.status_text);
            replyText = itemView.findViewById(R.id.reply_text);
            replyContainer = itemView.findViewById(R.id.reply_container);
            statusIcon = itemView.findViewById(R.id.status_icon);
            messageContainer = itemView.findViewById(R.id.message_container);
            
            setupLongPress();
        }

        private void setupLongPress() {
            messageContainer.setOnLongClickListener(v -> {
                int position = getAdapterPosition();
                if (position != RecyclerView.NO_POSITION && actionListener != null) {
                    actionListener.onLongPress(messages.get(position));
                }
                return true;
            });
        }

        public void bind(ChatMessage message) {
            // Set message text
            messageText.setText(message.getText());
            
            // Set time
            SimpleDateFormat timeFormat = new SimpleDateFormat("HH:mm", Locale.getDefault());
            timeText.setText(timeFormat.format(message.getCreatedAt()));
            
            // Handle reply
            if (message.getReplyToMessageId() != null) {
                replyContainer.setVisibility(View.VISIBLE);
                replyText.setText("Svar til melding");
            } else {
                replyContainer.setVisibility(View.GONE);
            }
            
            // Set status for sent messages
            if (message.getSenderId().equals(currentUserId)) {
                setMessageStatus(message.getStatus());
            }
        }

        private void setMessageStatus(String status) {
            if (statusIcon != null) {
                switch (status) {
                    case "sent":
                        statusIcon.setImageResource(R.drawable.ic_check);
                        statusIcon.setColorFilter(itemView.getContext().getResources().getColor(R.color.gray));
                        break;
                    case "delivered":
                        statusIcon.setImageResource(R.drawable.ic_check);
                        statusIcon.setColorFilter(itemView.getContext().getResources().getColor(R.color.gray));
                        break;
                    case "read":
                        statusIcon.setImageResource(R.drawable.ic_check);
                        statusIcon.setColorFilter(itemView.getContext().getResources().getColor(R.color.blue));
                        break;
                    case "failed":
                        statusIcon.setImageResource(R.drawable.ic_error);
                        statusIcon.setColorFilter(itemView.getContext().getResources().getColor(R.color.red));
                        break;
                }
            }
        }
    }
} 