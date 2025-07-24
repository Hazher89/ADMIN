package com.driftpro.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.chip.Chip;
import com.google.android.material.chip.ChipGroup;
import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.firestore.FieldValue;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.Query;
import com.google.firebase.firestore.QueryDocumentSnapshot;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Timer;
import java.util.TimerTask;

public class ChatActivity extends AppCompatActivity {
    private RecyclerView messagesRecyclerView;
    private MessageAdapter messageAdapter;
    private List<ChatMessage> messages = new ArrayList<>();
    private EditText messageInput;
    private ImageButton sendButton;
    private ImageButton attachmentButton;
    private ImageButton cameraButton;
    private ImageButton microphoneButton;
    private TextView typingIndicator;
    private View replyPreview;
    private TextView replyText;
    private ImageButton cancelReplyButton;
    private ChipGroup attachmentChipGroup;
    
    private FirebaseFirestore db;
    private FirebaseAuth mAuth;
    private String chatId;
    private String userName;
    private String currentUserId;
    private String currentUserName;
    private ChatMessage replyToMessage;
    private Timer typingTimer;
    private boolean isTyping = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_chat_enhanced);

        // Get intent data
        chatId = getIntent().getStringExtra("chatId");
        userName = getIntent().getStringExtra("userName");
        currentUserId = FirebaseAuth.getInstance().getCurrentUser().getUid();
        currentUserName = FirebaseAuth.getInstance().getCurrentUser().getDisplayName();

        // Initialize Firebase
        db = FirebaseFirestore.getInstance();
        mAuth = FirebaseAuth.getInstance();

        // Setup toolbar
        MaterialToolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setTitle(userName != null ? userName : "Chat");
        }

        // Initialize views
        initializeViews();
        setupRecyclerView();
        setupInputListeners();
        setupAttachmentOptions();

        // Listen for messages and typing
        listenForMessages();
        listenForTyping();
        markChatAsRead();
    }

    private void initializeViews() {
        messagesRecyclerView = findViewById(R.id.messages_recycler_view);
        messageInput = findViewById(R.id.message_input);
        sendButton = findViewById(R.id.send_button);
        attachmentButton = findViewById(R.id.attachment_button);
        cameraButton = findViewById(R.id.camera_button);
        microphoneButton = findViewById(R.id.microphone_button);
        typingIndicator = findViewById(R.id.typing_indicator);
        replyPreview = findViewById(R.id.reply_preview);
        replyText = findViewById(R.id.reply_text);
        cancelReplyButton = findViewById(R.id.cancel_reply_button);
        attachmentChipGroup = findViewById(R.id.attachment_chip_group);
    }

    private void setupRecyclerView() {
        messagesRecyclerView.setLayoutManager(new LinearLayoutManager(this));
        messageAdapter = new MessageAdapter(messages, currentUserId, new MessageAdapter.MessageActionListener() {
            @Override
            public void onReply(ChatMessage message) {
                setReplyToMessage(message);
            }

            @Override
            public void onLongPress(ChatMessage message) {
                showMessageOptions(message);
            }
        });
        messagesRecyclerView.setAdapter(messageAdapter);
    }

    private void setupInputListeners() {
        // Send button
        sendButton.setOnClickListener(v -> sendMessage());

        // Attachment button
        attachmentButton.setOnClickListener(v -> toggleAttachmentOptions());

        // Camera button
        cameraButton.setOnClickListener(v -> openCamera());

        // Microphone button
        microphoneButton.setOnClickListener(v -> startVoiceRecording());

        // Cancel reply button
        cancelReplyButton.setOnClickListener(v -> clearReplyToMessage());

        // Text input listener for typing indicator
        messageInput.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                updateSendButtonState();
                updateTypingStatus(true);
            }

            @Override
            public void afterTextChanged(Editable s) {}
        });
    }

    private void setupAttachmentOptions() {
        // Add attachment options
        String[] options = {"📷 Kamera", "🖼️ Bilde", "📄 Dokument", "📍 Plassering", "👤 Kontakt"};
        for (String option : options) {
            Chip chip = new Chip(this);
            chip.setText(option);
            chip.setOnClickListener(v -> handleAttachmentOption(option));
            attachmentChipGroup.addView(chip);
        }
        attachmentChipGroup.setVisibility(View.GONE);
    }

    private void updateSendButtonState() {
        String text = messageInput.getText().toString().trim();
        boolean hasText = !text.isEmpty();
        
        sendButton.setVisibility(hasText ? View.VISIBLE : View.GONE);
        microphoneButton.setVisibility(hasText ? View.GONE : View.VISIBLE);
    }

    private void updateTypingStatus(boolean typing) {
        if (isTyping != typing) {
            isTyping = typing;
            updateTypingIndicator();
        }
        
        // Reset typing timer
        if (typingTimer != null) {
            typingTimer.cancel();
        }
        
        if (typing) {
            typingTimer = new Timer();
            typingTimer.schedule(new TimerTask() {
                @Override
                public void run() {
                    runOnUiThread(() -> {
                        isTyping = false;
                        updateTypingIndicator();
                    });
                }
            }, 2000); // Stop typing indicator after 2 seconds
        }
    }

    private void updateTypingIndicator() {
        if (isTyping) {
            typingIndicator.setVisibility(View.VISIBLE);
            typingIndicator.setText(userName + " skriver...");
        } else {
            typingIndicator.setVisibility(View.GONE);
        }
    }

    private void toggleAttachmentOptions() {
        boolean isVisible = attachmentChipGroup.getVisibility() == View.VISIBLE;
        attachmentChipGroup.setVisibility(isVisible ? View.GONE : View.VISIBLE);
    }

    private void handleAttachmentOption(String option) {
        attachmentChipGroup.setVisibility(View.GONE);
        
        switch (option) {
            case "📷 Kamera":
                openCamera();
                break;
            case "🖼️ Bilde":
                openImagePicker();
                break;
            case "📄 Dokument":
                openDocumentPicker();
                break;
            case "📍 Plassering":
                openLocationPicker();
                break;
            case "👤 Kontakt":
                openContactPicker();
                break;
        }
    }

    private void openCamera() {
        // Implement camera functionality
        Toast.makeText(this, "Kamera åpnes...", Toast.LENGTH_SHORT).show();
    }

    private void openImagePicker() {
        // Implement image picker
        Toast.makeText(this, "Bildevelger åpnes...", Toast.LENGTH_SHORT).show();
    }

    private void openDocumentPicker() {
        // Implement document picker
        Toast.makeText(this, "Dokumentvelger åpnes...", Toast.LENGTH_SHORT).show();
    }

    private void openLocationPicker() {
        // Implement location picker
        Toast.makeText(this, "Plasseringsvelger åpnes...", Toast.LENGTH_SHORT).show();
    }

    private void openContactPicker() {
        // Implement contact picker
        Toast.makeText(this, "Kontaktvelger åpnes...", Toast.LENGTH_SHORT).show();
    }

    private void startVoiceRecording() {
        // Implement voice recording
        Toast.makeText(this, "Stemmeopptak starter...", Toast.LENGTH_SHORT).show();
    }

    private void setReplyToMessage(ChatMessage message) {
        replyToMessage = message;
        replyPreview.setVisibility(View.VISIBLE);
        replyText.setText("Svar til " + message.getSenderName() + ": " + message.getText());
    }

    private void clearReplyToMessage() {
        replyToMessage = null;
        replyPreview.setVisibility(View.GONE);
    }

    private void sendMessage() {
        String messageText = messageInput.getText().toString().trim();
        if (messageText.isEmpty()) return;

        // Create message data
        ChatMessage message = new ChatMessage();
        message.setText(messageText);
        message.setSenderId(currentUserId);
        message.setSenderName(currentUserName != null ? currentUserName : "Bruker");
        message.setChatId(chatId);
        message.setCompanyId("company1");
        message.setCreatedAt(new Date());
        message.setMessageType("text");
        message.setStatus("sent");
        
        if (replyToMessage != null) {
            message.setReplyToMessageId(replyToMessage.getId());
        }

        // Add to Firestore
        db.collection("chats").document(chatId).collection("messages")
            .add(message.toMap())
            .addOnSuccessListener(documentReference -> {
                messageInput.setText("");
                clearReplyToMessage();
                updateLastMessage(messageText);
                updateTypingStatus(false);
            })
            .addOnFailureListener(e -> {
                Toast.makeText(this, "Feil ved sending av melding", Toast.LENGTH_SHORT).show();
            });
    }

    private void updateLastMessage(String text) {
        Map<String, Object> updateData = new HashMap<>();
        updateData.put("lastMessage", text);
        updateData.put("lastMessageAt", new Date());
        updateData.put("lastMessageSender", currentUserName);
        updateData.put("lastMessageStatus", "sent");
        
        db.collection("chats").document(chatId).update(updateData);
    }

    private void listenForMessages() {
        db.collection("chats").document(chatId).collection("messages")
            .orderBy("createdAt", Query.Direction.ASCENDING)
            .addSnapshotListener((value, error) -> {
                if (error != null) {
                    return;
                }

                if (value != null) {
                    messages.clear();
                    for (QueryDocumentSnapshot document : value) {
                        ChatMessage message = ChatMessage.fromMap(document.getData());
                        message.setId(document.getId());
                        messages.add(message);
                    }
                    messageAdapter.notifyDataSetChanged();
                    
                    // Scroll to bottom
                    if (!messages.isEmpty()) {
                        messagesRecyclerView.smoothScrollToPosition(messages.size() - 1);
                    }
                }
            });
    }

    private void listenForTyping() {
        db.collection("chats").document(chatId).collection("typing")
            .addSnapshotListener((value, error) -> {
                if (error != null) return;
                
                if (value != null) {
                    boolean someoneTyping = false;
                    for (QueryDocumentSnapshot document : value) {
                        Map<String, Object> data = document.getData();
                        boolean isTyping = (Boolean) data.get("isTyping");
                        String userId = (String) data.get("userId");
                        
                        if (isTyping && !userId.equals(currentUserId)) {
                            someoneTyping = true;
                            break;
                        }
                    }
                    
                    if (someoneTyping) {
                        typingIndicator.setVisibility(View.VISIBLE);
                        typingIndicator.setText(userName + " skriver...");
                    } else {
                        typingIndicator.setVisibility(View.GONE);
                    }
                }
            });
    }

    private void markChatAsRead() {
        // Mark all messages as read by current user
        db.collection("chats").document(chatId).collection("messages")
            .whereNotEqualTo("senderId", currentUserId)
            .get()
            .addOnSuccessListener(queryDocumentSnapshots -> {
                for (QueryDocumentSnapshot document : queryDocumentSnapshots) {
                    document.getReference().update("readBy", FieldValue.arrayUnion(currentUserId));
                }
            });
    }

    private void showMessageOptions(ChatMessage message) {
        String[] options = {"Svar", "Videresend", "Kopier", "Slett"};
        
        new AlertDialog.Builder(this)
            .setTitle("Meldingsalternativer")
            .setItems(options, (dialog, which) -> {
                switch (which) {
                    case 0: // Reply
                        setReplyToMessage(message);
                        break;
                    case 1: // Forward
                        forwardMessage(message);
                        break;
                    case 2: // Copy
                        copyMessage(message);
                        break;
                    case 3: // Delete
                        deleteMessage(message);
                        break;
                }
            })
            .show();
    }

    private void forwardMessage(ChatMessage message) {
        // Implement forward functionality
        Toast.makeText(this, "Videresender melding...", Toast.LENGTH_SHORT).show();
    }

    private void copyMessage(ChatMessage message) {
        android.content.ClipboardManager clipboard = (android.content.ClipboardManager) getSystemService(CLIPBOARD_SERVICE);
        android.content.ClipData clip = android.content.ClipData.newPlainText("Melding", message.getText());
        clipboard.setPrimaryClip(clip);
        Toast.makeText(this, "Melding kopiert", Toast.LENGTH_SHORT).show();
    }

    private void deleteMessage(ChatMessage message) {
        new AlertDialog.Builder(this)
            .setTitle("Slett melding")
            .setMessage("Er du sikker på at du vil slette denne meldingen?")
            .setPositiveButton("Slett", (dialog, which) -> {
                db.collection("chats").document(chatId).collection("messages")
                    .document(message.getId())
                    .delete();
            })
            .setNegativeButton("Avbryt", null)
            .show();
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.chat_menu, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(@NonNull MenuItem item) {
        if (item.getItemId() == android.R.id.home) {
            onBackPressed();
            return true;
        }
        return super.onOptionsItemSelected(item);
    }

    @Override
    public void onBackPressed() {
        if (attachmentChipGroup.getVisibility() == View.VISIBLE) {
            attachmentChipGroup.setVisibility(View.GONE);
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (typingTimer != null) {
            typingTimer.cancel();
        }
    }
} 