package com.driftpro.app;

import com.google.firebase.Timestamp;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

public class ChatMessage {
    private String id;
    private String text;
    private String senderId;
    private String senderName;
    private String chatId;
    private String companyId;
    private Date createdAt;
    private List<String> mediaURLs;
    private String messageType;
    private boolean isEdited;
    private Date editedAt;
    private String replyToMessageId;
    private String forwardedFrom;
    private String forwardedFromName;
    private String status;
    private List<String> readBy;
    private List<String> deliveredTo;
    private LocationData location;
    private ContactData contact;
    private Double audioDuration;
    private Long fileSize;
    private String fileName;

    public ChatMessage() {
        this.createdAt = new Date();
        this.status = "sent";
        this.isEdited = false;
    }

    public ChatMessage(String text, String senderId, String senderName, String chatId, String companyId) {
        this.text = text;
        this.senderId = senderId;
        this.senderName = senderName;
        this.chatId = chatId;
        this.companyId = companyId;
        this.createdAt = new Date();
        this.status = "sent";
        this.isEdited = false;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }

    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }

    public String getChatId() { return chatId; }
    public void setChatId(String chatId) { this.chatId = chatId; }

    public String getCompanyId() { return companyId; }
    public void setCompanyId(String companyId) { this.companyId = companyId; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }

    public List<String> getMediaURLs() { return mediaURLs; }
    public void setMediaURLs(List<String> mediaURLs) { this.mediaURLs = mediaURLs; }

    public String getMessageType() { return messageType; }
    public void setMessageType(String messageType) { this.messageType = messageType; }

    public boolean isEdited() { return isEdited; }
    public void setEdited(boolean edited) { isEdited = edited; }

    public Date getEditedAt() { return editedAt; }
    public void setEditedAt(Date editedAt) { this.editedAt = editedAt; }

    public String getReplyToMessageId() { return replyToMessageId; }
    public void setReplyToMessageId(String replyToMessageId) { this.replyToMessageId = replyToMessageId; }

    public String getForwardedFrom() { return forwardedFrom; }
    public void setForwardedFrom(String forwardedFrom) { this.forwardedFrom = forwardedFrom; }

    public String getForwardedFromName() { return forwardedFromName; }
    public void setForwardedFromName(String forwardedFromName) { this.forwardedFromName = forwardedFromName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public List<String> getReadBy() { return readBy; }
    public void setReadBy(List<String> readBy) { this.readBy = readBy; }

    public List<String> getDeliveredTo() { return deliveredTo; }
    public void setDeliveredTo(List<String> deliveredTo) { this.deliveredTo = deliveredTo; }

    public LocationData getLocation() { return location; }
    public void setLocation(LocationData location) { this.location = location; }

    public ContactData getContact() { return contact; }
    public void setContact(ContactData contact) { this.contact = contact; }

    public Double getAudioDuration() { return audioDuration; }
    public void setAudioDuration(Double audioDuration) { this.audioDuration = audioDuration; }

    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public Map<String, Object> toMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("text", text);
        map.put("senderId", senderId);
        map.put("senderName", senderName);
        map.put("chatId", chatId);
        map.put("companyId", companyId);
        map.put("createdAt", new Timestamp(createdAt));
        map.put("mediaURLs", mediaURLs);
        map.put("messageType", messageType);
        map.put("isEdited", isEdited);
        if (editedAt != null) map.put("editedAt", new Timestamp(editedAt));
        map.put("replyToMessageId", replyToMessageId);
        map.put("forwardedFrom", forwardedFrom);
        map.put("forwardedFromName", forwardedFromName);
        map.put("status", status);
        map.put("readBy", readBy);
        map.put("deliveredTo", deliveredTo);
        if (location != null) map.put("location", location.toMap());
        if (contact != null) map.put("contact", contact.toMap());
        map.put("audioDuration", audioDuration);
        map.put("fileSize", fileSize);
        map.put("fileName", fileName);
        return map;
    }

    public static ChatMessage fromMap(Map<String, Object> map) {
        ChatMessage message = new ChatMessage();
        message.setText((String) map.get("text"));
        message.setSenderId((String) map.get("senderId"));
        message.setSenderName((String) map.get("senderName"));
        message.setChatId((String) map.get("chatId"));
        message.setCompanyId((String) map.get("companyId"));
        
        if (map.get("createdAt") instanceof Timestamp) {
            message.setCreatedAt(((Timestamp) map.get("createdAt")).toDate());
        }
        
        message.setMediaURLs((List<String>) map.get("mediaURLs"));
        message.setMessageType((String) map.get("messageType"));
        message.setEdited((Boolean) map.get("isEdited"));
        
        if (map.get("editedAt") instanceof Timestamp) {
            message.setEditedAt(((Timestamp) map.get("editedAt")).toDate());
        }
        
        message.setReplyToMessageId((String) map.get("replyToMessageId"));
        message.setForwardedFrom((String) map.get("forwardedFrom"));
        message.setForwardedFromName((String) map.get("forwardedFromName"));
        message.setStatus((String) map.get("status"));
        message.setReadBy((List<String>) map.get("readBy"));
        message.setDeliveredTo((List<String>) map.get("deliveredTo"));
        
        if (map.get("location") instanceof Map) {
            message.setLocation(LocationData.fromMap((Map<String, Object>) map.get("location")));
        }
        
        if (map.get("contact") instanceof Map) {
            message.setContact(ContactData.fromMap((Map<String, Object>) map.get("contact")));
        }
        
        message.setAudioDuration((Double) map.get("audioDuration"));
        message.setFileSize((Long) map.get("fileSize"));
        message.setFileName((String) map.get("fileName"));
        
        return message;
    }

    public static class LocationData {
        private double latitude;
        private double longitude;
        private String address;
        private String name;

        public LocationData(double latitude, double longitude, String address, String name) {
            this.latitude = latitude;
            this.longitude = longitude;
            this.address = address;
            this.name = name;
        }

        public double getLatitude() { return latitude; }
        public void setLatitude(double latitude) { this.latitude = latitude; }

        public double getLongitude() { return longitude; }
        public void setLongitude(double longitude) { this.longitude = longitude; }

        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public Map<String, Object> toMap() {
            Map<String, Object> map = new HashMap<>();
            map.put("latitude", latitude);
            map.put("longitude", longitude);
            map.put("address", address);
            map.put("name", name);
            return map;
        }

        public static LocationData fromMap(Map<String, Object> map) {
            return new LocationData(
                (Double) map.get("latitude"),
                (Double) map.get("longitude"),
                (String) map.get("address"),
                (String) map.get("name")
            );
        }
    }

    public static class ContactData {
        private String name;
        private String phone;
        private String email;
        private String avatar;

        public ContactData(String name, String phone, String email, String avatar) {
            this.name = name;
            this.phone = phone;
            this.email = email;
            this.avatar = avatar;
        }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getAvatar() { return avatar; }
        public void setAvatar(String avatar) { this.avatar = avatar; }

        public Map<String, Object> toMap() {
            Map<String, Object> map = new HashMap<>();
            map.put("name", name);
            map.put("phone", phone);
            map.put("email", email);
            map.put("avatar", avatar);
            return map;
        }

        public static ContactData fromMap(Map<String, Object> map) {
            return new ContactData(
                (String) map.get("name"),
                (String) map.get("phone"),
                (String) map.get("email"),
                (String) map.get("avatar")
            );
        }
    }
} 