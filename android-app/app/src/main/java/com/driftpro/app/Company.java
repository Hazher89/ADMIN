package com.driftpro.app;

import java.util.Date;

public class Company {
    private String id;
    private String name;
    private String logoURL;
    private String primaryColor;
    private String secondaryColor;
    private String address;
    private String phoneNumber;
    private String email;
    private String website;
    private String description;
    private boolean isActive;
    private Date createdAt;
    private String adminUserId;
    private CompanySettings settings;

    public Company(String name, String adminUserId) {
        this.name = name;
        this.adminUserId = adminUserId;
        this.primaryColor = "#007AFF";
        this.secondaryColor = "#5856D6";
        this.isActive = true;
        this.createdAt = new Date();
        this.settings = new CompanySettings();
    }

    public Company(String id, String name, String logoURL, String primaryColor, String secondaryColor, 
                   String address, String phoneNumber, String email, String website, String description, 
                   String adminUserId, Date createdAt, CompanySettings settings) {
        this.id = id;
        this.name = name;
        this.logoURL = logoURL;
        this.primaryColor = primaryColor;
        this.secondaryColor = secondaryColor;
        this.address = address;
        this.phoneNumber = phoneNumber;
        this.email = email;
        this.website = website;
        this.description = description;
        this.adminUserId = adminUserId;
        this.isActive = true;
        this.createdAt = createdAt;
        this.settings = settings;
    }

    // Getters
    public String getId() { return id; }
    public String getName() { return name; }
    public String getLogoURL() { return logoURL; }
    public String getPrimaryColor() { return primaryColor; }
    public String getSecondaryColor() { return secondaryColor; }
    public String getAddress() { return address; }
    public String getPhoneNumber() { return phoneNumber; }
    public String getEmail() { return email; }
    public String getWebsite() { return website; }
    public String getDescription() { return description; }
    public boolean isActive() { return isActive; }
    public Date getCreatedAt() { return createdAt; }
    public String getAdminUserId() { return adminUserId; }
    public CompanySettings getSettings() { return settings; }

    // Setters
    public void setId(String id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setLogoURL(String logoURL) { this.logoURL = logoURL; }
    public void setPrimaryColor(String primaryColor) { this.primaryColor = primaryColor; }
    public void setSecondaryColor(String secondaryColor) { this.secondaryColor = secondaryColor; }
    public void setAddress(String address) { this.address = address; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public void setEmail(String email) { this.email = email; }
    public void setWebsite(String website) { this.website = website; }
    public void setDescription(String description) { this.description = description; }
    public void setActive(boolean active) { isActive = active; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
    public void setAdminUserId(String adminUserId) { this.adminUserId = adminUserId; }
    public void setSettings(CompanySettings settings) { this.settings = settings; }
} 