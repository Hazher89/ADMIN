package com.driftpro.app;

import java.util.Date;

public class User {
    private String id;
    private String email;
    private String firstName;
    private String lastName;
    private UserRole role;
    private String companyId;
    private String department;
    private String phoneNumber;
    private String profileImageURL;
    private boolean isActive;
    private Date createdAt;
    private Date lastLoginAt;
    private Date birthday;
    private String employeeId;

    public enum UserRole {
        EMPLOYEE("employee", "Ansatt"),
        ADMIN("admin", "Administrator"),
        SUPER_ADMIN("superAdmin", "Super Administrator");

        private final String value;
        private final String displayName;

        UserRole(String value, String displayName) {
            this.value = value;
            this.displayName = displayName;
        }

        public String getValue() {
            return value;
        }

        public String getDisplayName() {
            return displayName;
        }

        public static UserRole fromString(String value) {
            for (UserRole role : UserRole.values()) {
                if (role.value.equals(value)) {
                    return role;
                }
            }
            return EMPLOYEE; // Default
        }
    }

    public User(String email, String firstName, String lastName, UserRole role, String companyId) {
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.role = role;
        this.companyId = companyId;
        this.isActive = true;
        this.createdAt = new Date();
    }

    public User(String id, String email, String firstName, String lastName, UserRole role, String companyId, 
                String department, String phoneNumber, String profileImageURL, Date birthday, String employeeId) {
        this.id = id;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.role = role;
        this.companyId = companyId;
        this.department = department;
        this.phoneNumber = phoneNumber;
        this.profileImageURL = profileImageURL;
        this.birthday = birthday;
        this.employeeId = employeeId;
        this.isActive = true;
        this.createdAt = new Date();
    }

    // Getters
    public String getId() { return id; }
    public String getEmail() { return email; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public UserRole getRole() { return role; }
    public String getCompanyId() { return companyId; }
    public String getDepartment() { return department; }
    public String getPhoneNumber() { return phoneNumber; }
    public String getProfileImageURL() { return profileImageURL; }
    public boolean isActive() { return isActive; }
    public Date getCreatedAt() { return createdAt; }
    public Date getLastLoginAt() { return lastLoginAt; }
    public Date getBirthday() { return birthday; }
    public String getEmployeeId() { return employeeId; }

    // Setters
    public void setId(String id) { this.id = id; }
    public void setEmail(String email) { this.email = email; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public void setRole(UserRole role) { this.role = role; }
    public void setCompanyId(String companyId) { this.companyId = companyId; }
    public void setDepartment(String department) { this.department = department; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public void setProfileImageURL(String profileImageURL) { this.profileImageURL = profileImageURL; }
    public void setActive(boolean active) { isActive = active; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
    public void setLastLoginAt(Date lastLoginAt) { this.lastLoginAt = lastLoginAt; }
    public void setBirthday(Date birthday) { this.birthday = birthday; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    // Computed properties
    public String getFullName() {
        return firstName + " " + lastName;
    }

    public String getInitials() {
        String firstInitial = firstName.length() > 0 ? firstName.substring(0, 1).toUpperCase() : "";
        String lastInitial = lastName.length() > 0 ? lastName.substring(0, 1).toUpperCase() : "";
        return firstInitial + lastInitial;
    }
} 