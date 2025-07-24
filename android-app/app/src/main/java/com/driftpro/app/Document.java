package com.driftpro.app;

import com.google.firebase.Timestamp;
import java.util.Date;
import java.util.List;
import java.util.Map;

public class Document {
    private String id;
    private String title;
    private String description;
    private DocumentCategory category;
    private String fileURL;
    private String fileName;
    private long fileSize;
    private String fileType;
    private String version;
    private String uploadedBy;
    private String uploadedByName;
    private String companyId;
    private String department;
    private List<String> tags;
    private boolean isPublic;
    private Date createdAt;
    private Date updatedAt;
    private int downloadCount;
    private boolean isActive;

    public enum DocumentCategory {
        PROCEDURES("procedures", "Rutiner", "doc.text.fill"),
        HMS("hms", "HMS", "heart.fill"),
        PROTOCOLS("protocols", "Protokoller", "list.clipboard.fill"),
        POLICIES("policies", "Retningslinjer", "building.2.fill"),
        FORMS("forms", "Skjemaer", "doc.on.doc.fill"),
        REPORTS("reports", "Rapporter", "chart.bar.fill"),
        OTHER("other", "Annet", "folder.fill");

        private final String value;
        private final String displayName;
        private final String icon;

        DocumentCategory(String value, String displayName, String icon) {
            this.value = value;
            this.displayName = displayName;
            this.icon = icon;
        }

        public String getValue() { return value; }
        public String getDisplayName() { return displayName; }
        public String getIcon() { return icon; }

        public static DocumentCategory fromString(String value) {
            for (DocumentCategory category : DocumentCategory.values()) {
                if (category.value.equals(value)) {
                    return category;
                }
            }
            return OTHER;
        }
    }

    public Document() {
        // Required for Firestore
    }

    public Document(String title, DocumentCategory category, String fileURL, String fileName, 
                    long fileSize, String fileType, String uploadedBy, String uploadedByName, String companyId) {
        this.title = title;
        this.category = category;
        this.fileURL = fileURL;
        this.fileName = fileName;
        this.fileSize = fileSize;
        this.fileType = fileType;
        this.version = "1.0";
        this.uploadedBy = uploadedBy;
        this.uploadedByName = uploadedByName;
        this.companyId = companyId;
        this.isPublic = true;
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.downloadCount = 0;
        this.isActive = true;
    }

    public static Document fromMap(Map<String, Object> map) {
        Document document = new Document();
        document.setTitle((String) map.get("title"));
        document.setDescription((String) map.get("description"));
        
        String categoryStr = (String) map.get("category");
        if (categoryStr != null) {
            document.setCategory(DocumentCategory.fromString(categoryStr));
        }
        
        document.setFileURL((String) map.get("fileURL"));
        document.setFileName((String) map.get("fileName"));
        document.setFileType((String) map.get("fileType"));
        document.setVersion((String) map.get("version"));
        document.setUploadedBy((String) map.get("uploadedBy"));
        document.setUploadedByName((String) map.get("uploadedByName"));
        document.setCompanyId((String) map.get("companyId"));
        document.setDepartment((String) map.get("department"));
        
        if (map.get("fileSize") != null) {
            document.setFileSize(((Number) map.get("fileSize")).longValue());
        }
        
        if (map.get("createdAt") != null) {
            Timestamp timestamp = (Timestamp) map.get("createdAt");
            document.setCreatedAt(timestamp.toDate());
        }
        
        if (map.get("updatedAt") != null) {
            Timestamp timestamp = (Timestamp) map.get("updatedAt");
            document.setUpdatedAt(timestamp.toDate());
        }
        
        if (map.get("isPublic") != null) {
            document.setPublic((Boolean) map.get("isPublic"));
        }
        
        if (map.get("downloadCount") != null) {
            document.setDownloadCount(((Number) map.get("downloadCount")).intValue());
        }
        
        if (map.get("isActive") != null) {
            document.setActive((Boolean) map.get("isActive"));
        }
        
        if (map.get("tags") != null) {
            document.setTags((List<String>) map.get("tags"));
        }
        
        return document;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public DocumentCategory getCategory() { return category; }
    public void setCategory(DocumentCategory category) { this.category = category; }
    
    public String getFileURL() { return fileURL; }
    public void setFileURL(String fileURL) { this.fileURL = fileURL; }
    
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    
    public long getFileSize() { return fileSize; }
    public void setFileSize(long fileSize) { this.fileSize = fileSize; }
    
    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }
    
    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }
    
    public String getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(String uploadedBy) { this.uploadedBy = uploadedBy; }
    
    public String getUploadedByName() { return uploadedByName; }
    public void setUploadedByName(String uploadedByName) { this.uploadedByName = uploadedByName; }
    
    public String getCompanyId() { return companyId; }
    public void setCompanyId(String companyId) { this.companyId = companyId; }
    
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
    
    public boolean isPublic() { return isPublic; }
    public void setPublic(boolean isPublic) { this.isPublic = isPublic; }
    
    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
    
    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }
    
    public int getDownloadCount() { return downloadCount; }
    public void setDownloadCount(int downloadCount) { this.downloadCount = downloadCount; }
    
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public String getFileSizeFormatted() {
        if (fileSize < 1024) {
            return fileSize + " B";
        } else if (fileSize < 1024 * 1024) {
            return String.format("%.1f KB", fileSize / 1024.0);
        } else {
            return String.format("%.1f MB", fileSize / (1024.0 * 1024.0));
        }
    }
} 