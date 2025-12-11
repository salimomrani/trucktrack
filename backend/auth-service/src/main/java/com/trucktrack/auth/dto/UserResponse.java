package com.trucktrack.auth.dto;

/**
 * Response DTO for current authenticated user information
 */
public class UserResponse {
    private String id;
    private String email;
    private String role;

    public UserResponse() {
    }

    public UserResponse(String id, String email, String role) {
        this.id = id;
        this.email = email;
        this.role = role;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
