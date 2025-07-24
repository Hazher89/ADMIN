package com.driftpro.app;

import java.util.Arrays;
import java.util.List;

public class CompanySettings {
    private boolean enableDeviationReporting;
    private boolean enableRiskAnalysis;
    private boolean enableDocumentArchive;
    private boolean enableInternalControl;
    private boolean enableChat;
    private boolean enableBirthdayCalendar;
    private int maxFileSizeMB;
    private List<String> allowedFileTypes;

    public CompanySettings() {
        this.enableDeviationReporting = true;
        this.enableRiskAnalysis = true;
        this.enableDocumentArchive = true;
        this.enableInternalControl = true;
        this.enableChat = true;
        this.enableBirthdayCalendar = true;
        this.maxFileSizeMB = 50;
        this.allowedFileTypes = Arrays.asList("jpg", "jpeg", "png", "pdf", "doc", "docx", "mp4", "mov");
    }

    public CompanySettings(boolean enableDeviationReporting, boolean enableRiskAnalysis, 
                          boolean enableDocumentArchive, boolean enableInternalControl, 
                          boolean enableChat, boolean enableBirthdayCalendar, 
                          int maxFileSizeMB, List<String> allowedFileTypes) {
        this.enableDeviationReporting = enableDeviationReporting;
        this.enableRiskAnalysis = enableRiskAnalysis;
        this.enableDocumentArchive = enableDocumentArchive;
        this.enableInternalControl = enableInternalControl;
        this.enableChat = enableChat;
        this.enableBirthdayCalendar = enableBirthdayCalendar;
        this.maxFileSizeMB = maxFileSizeMB;
        this.allowedFileTypes = allowedFileTypes;
    }

    // Getters
    public boolean isEnableDeviationReporting() { return enableDeviationReporting; }
    public boolean isEnableRiskAnalysis() { return enableRiskAnalysis; }
    public boolean isEnableDocumentArchive() { return enableDocumentArchive; }
    public boolean isEnableInternalControl() { return enableInternalControl; }
    public boolean isEnableChat() { return enableChat; }
    public boolean isEnableBirthdayCalendar() { return enableBirthdayCalendar; }
    public int getMaxFileSizeMB() { return maxFileSizeMB; }
    public List<String> getAllowedFileTypes() { return allowedFileTypes; }

    // Setters
    public void setEnableDeviationReporting(boolean enableDeviationReporting) { this.enableDeviationReporting = enableDeviationReporting; }
    public void setEnableRiskAnalysis(boolean enableRiskAnalysis) { this.enableRiskAnalysis = enableRiskAnalysis; }
    public void setEnableDocumentArchive(boolean enableDocumentArchive) { this.enableDocumentArchive = enableDocumentArchive; }
    public void setEnableInternalControl(boolean enableInternalControl) { this.enableInternalControl = enableInternalControl; }
    public void setEnableChat(boolean enableChat) { this.enableChat = enableChat; }
    public void setEnableBirthdayCalendar(boolean enableBirthdayCalendar) { this.enableBirthdayCalendar = enableBirthdayCalendar; }
    public void setMaxFileSizeMB(int maxFileSizeMB) { this.maxFileSizeMB = maxFileSizeMB; }
    public void setAllowedFileTypes(List<String> allowedFileTypes) { this.allowedFileTypes = allowedFileTypes; }
} 