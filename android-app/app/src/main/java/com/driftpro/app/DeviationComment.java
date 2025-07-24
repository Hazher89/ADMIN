package com.driftpro.app;

import com.google.firebase.Timestamp;
import java.util.Date;
import java.util.List;
import java.util.Map;

public class DeviationComment {
    private String id;
    private String text;
    private String authorId;
    private String authorName;
    private Date createdAt;
    private List<String> mediaURLs;

    public DeviationComment() {
        // Required for Firestore
    }

    public DeviationComment(String text, String authorId, String authorName) {
        this.id = java.util.UUID.randomUUID().toString();
        this.text = text;
        this.authorId = authorId;
        this.authorName = authorName;
        this.createdAt = new Date();
    }

    public static DeviationComment fromMap(Map<String, Object> map) {
        DeviationComment comment = new DeviationComment();
        comment.setId((String) map.get("id"));
        comment.setText((String) map.get("text"));
        comment.setAuthorId((String) map.get("authorId"));
        comment.setAuthorName((String) map.get("authorName"));
        
        if (map.get("createdAt") != null) {
            Timestamp timestamp = (Timestamp) map.get("createdAt");
            comment.setCreatedAt(timestamp.toDate());
        }
        
        if (map.get("mediaURLs") != null) {
            comment.setMediaURLs((List<String>) map.get("mediaURLs"));
        }
        
        return comment;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    
    public String getAuthorId() { return authorId; }
    public void setAuthorId(String authorId) { this.authorId = authorId; }
    
    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }
    
    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
    
    public List<String> getMediaURLs() { return mediaURLs; }
    public void setMediaURLs(List<String> mediaURLs) { this.mediaURLs = mediaURLs; }
} 