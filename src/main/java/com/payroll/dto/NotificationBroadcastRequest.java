package com.payroll.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Set;

public class NotificationBroadcastRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 150, message = "Title must be 150 characters or fewer")
    private String title;

    @NotBlank(message = "Message is required")
    @Size(max = 2000, message = "Message must be 2000 characters or fewer")
    private String message;

    private String type = "ANNOUNCEMENT";

    /**
     * Roles that should receive the notification. An empty or null set means
     * every role, including the sender's own administrators.
     */
    private Set<String> targetRoles = Set.of("ROLE_EMPLOYEE", "ROLE_MANAGER");

    public NotificationBroadcastRequest() {}

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Set<String> getTargetRoles() { return targetRoles; }
    public void setTargetRoles(Set<String> targetRoles) { this.targetRoles = targetRoles; }
}
