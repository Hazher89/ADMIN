package com.driftpro.app;

import com.google.firebase.Timestamp;
import java.util.Date;
import java.util.List;
import java.util.Map;

public class Deviation {
    private String id;
    private String title;
    private String description;
    private DeviationCategory category;
    private DeviationSeverity severity;
    private DeviationStatus status;
    private String reportedBy;
    private String assignedTo;
    private String companyId;
    private String location;
    private List<String> mediaURLs;
    private Date createdAt;
    private Date updatedAt;
    private Date resolvedAt;
    private List<DeviationComment> comments;
    private List<String> tags;

    public enum DeviationCategory {
        SAFETY("safety", "Sikkerhet", "shield.fill"),
        QUALITY("quality", "Kvalitet", "checkmark.circle.fill"),
        ENVIRONMENT("environment", "Miljø", "leaf.fill"),
        EQUIPMENT("equipment", "Utstyr", "wrench.and.screwdriver.fill"),
        PROCESS("process", "Prosess", "gear"),
        OTHER("other", "Annet", "exclamationmark.triangle.fill");

        private final String value;
        private final String displayName;
        private final String icon;

        DeviationCategory(String value, String displayName, String icon) {
            this.value = value;
            this.displayName = displayName;
            this.icon = icon;
        }

        public String getValue() { return value; }
        public String getDisplayName() { return displayName; }
        public String getIcon() { return icon; }

        public static DeviationCategory fromString(String value) {
            for (DeviationCategory category : DeviationCategory.values()) {
                if (category.value.equals(value)) {
                    return category;
                }
            }
            return OTHER;
        }
    }

    public enum DeviationSeverity {
        LOW("low", "Lav", "#34C759"),
        MEDIUM("medium", "Medium", "#FF9500"),
        HIGH("high", "Høy", "#FF3B30"),
        CRITICAL("critical", "Kritisk", "#8E44AD");

        private final String value;
        private final String displayName;
        private final String color;

        DeviationSeverity(String value, String displayName, String color) {
            this.value = value;
            this.displayName = displayName;
            this.color = color;
        }

        public String getValue() { return value; }
        public String getDisplayName() { return displayName; }
        public String getColor() { return color; }

        public static DeviationSeverity fromString(String value) {
            for (DeviationSeverity severity : DeviationSeverity.values()) {
                if (severity.value.equals(value)) {
                    return severity;
                }
            }
            return LOW;
        }
    }

    public enum DeviationStatus {
        REPORTED("reported", "Rapportert"),
        UNDER_REVIEW("underReview", "Under vurdering"),
        IN_PROGRESS("inProgress", "Under arbeid"),
        RESOLVED("resolved", "Løst"),
        CLOSED("closed", "Lukket");

        private final String value;
        private final String displayName;

        DeviationStatus(String value, String displayName) {
            this.value = value;
            this.displayName = displayName;
        }

        public String getValue() { return value; }
        public String getDisplayName() { return displayName; }

        public static DeviationStatus fromString(String value) {
            for (DeviationStatus status : DeviationStatus.values()) {
                if (status.value.equals(value)) {
                    return status;
                }
            }
            return REPORTED;
        }
    }

    public Deviation() {
        // Required for Firestore
    }

    public Deviation(String title, String description, DeviationCategory category, DeviationSeverity severity, 
                    String reportedBy, String companyId, String location) {
        this.title = title;
        this.description = description;
        this.category = category;
        this.severity = severity;
        this.status = DeviationStatus.REPORTED;
        this.reportedBy = reportedBy;
        this.companyId = companyId;
        this.location = location;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    public static Deviation fromMap(Map<String, Object> map) {
        Deviation deviation = new Deviation();
        deviation.setTitle((String) map.get("title"));
        deviation.setDescription((String) map.get("description"));
        
        String categoryStr = (String) map.get("category");
        if (categoryStr != null) {
            deviation.setCategory(DeviationCategory.fromString(categoryStr));
        }
        
        String severityStr = (String) map.get("severity");
        if (severityStr != null) {
            deviation.setSeverity(DeviationSeverity.fromString(severityStr));
        }
        
        String statusStr = (String) map.get("status");
        if (statusStr != null) {
            deviation.setStatus(DeviationStatus.fromString(statusStr));
        }
        
        deviation.setReportedBy((String) map.get("reportedBy"));
        deviation.setAssignedTo((String) map.get("assignedTo"));
        deviation.setCompanyId((String) map.get("companyId"));
        deviation.setLocation((String) map.get("location"));
        
        if (map.get("mediaURLs") != null) {
            deviation.setMediaURLs((List<String>) map.get("mediaURLs"));
        }
        
        if (map.get("createdAt") != null) {
            Timestamp timestamp = (Timestamp) map.get("createdAt");
            deviation.setCreatedAt(timestamp.toDate());
        }
        
        if (map.get("updatedAt") != null) {
            Timestamp timestamp = (Timestamp) map.get("updatedAt");
            deviation.setUpdatedAt(timestamp.toDate());
        }
        
        if (map.get("resolvedAt") != null) {
            Timestamp timestamp = (Timestamp) map.get("resolvedAt");
            deviation.setResolvedAt(timestamp.toDate());
        }
        
        if (map.get("tags") != null) {
            deviation.setTags((List<String>) map.get("tags"));
        }
        
        return deviation;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public DeviationCategory getCategory() { return category; }
    public void setCategory(DeviationCategory category) { this.category = category; }
    
    public DeviationSeverity getSeverity() { return severity; }
    public void setSeverity(DeviationSeverity severity) { this.severity = severity; }
    
    public DeviationStatus getStatus() { return status; }
    public void setStatus(DeviationStatus status) { this.status = status; }
    
    public String getReportedBy() { return reportedBy; }
    public void setReportedBy(String reportedBy) { this.reportedBy = reportedBy; }
    
    public String getAssignedTo() { return assignedTo; }
    public void setAssignedTo(String assignedTo) { this.assignedTo = assignedTo; }
    
    public String getCompanyId() { return companyId; }
    public void setCompanyId(String companyId) { this.companyId = companyId; }
    
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    
    public List<String> getMediaURLs() { return mediaURLs; }
    public void setMediaURLs(List<String> mediaURLs) { this.mediaURLs = mediaURLs; }
    
    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
    
    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }
    
    public Date getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(Date resolvedAt) { this.resolvedAt = resolvedAt; }
    
    public List<DeviationComment> getComments() { return comments; }
    public void setComments(List<DeviationComment> comments) { this.comments = comments; }
    
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
} 