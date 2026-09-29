package com.payroll.controller;

import com.payroll.dto.ApiResponse;
import com.payroll.dto.NotificationBroadcastRequest;
import com.payroll.model.Notification;
import com.payroll.security.CustomUserDetails;
import com.payroll.service.AuditLogService;
import com.payroll.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    public NotificationController(NotificationService notificationService, AuditLogService auditLogService) {
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
    }

    // Admin & HR: publish an announcement to employees / managers
    @PostMapping("/broadcast")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<List<Notification>>> broadcast(
            @Valid @RequestBody NotificationBroadcastRequest request) {

        CustomUserDetails user = getAuthenticatedUserDetails();
        List<Notification> created = notificationService.broadcastNotification(
                request.getTitle().trim(),
                request.getMessage().trim(),
                request.getType(),
                request.getTargetRoles(),
                user.getUsername());

        String audience = created.stream()
                .map(n -> n.getRecipientRole() == null ? "EVERYONE" : n.getRecipientRole().replace("ROLE_", ""))
                .collect(Collectors.joining(", "));

        auditLogService.log("NOTIFICATION_BROADCAST", "NOTIFICATION",
                "Published notification \"" + request.getTitle().trim() + "\" of type "
                        + created.get(0).getType() + " to: " + audience);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Notification sent to " + audience, created));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Notification>>> getNotifications() {
        CustomUserDetails user = getAuthenticatedUserDetails();
        List<Notification> list = notificationService.getUserNotifications(user.getEmployeeId(), user.getUser().getRole());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount() {
        CustomUserDetails user = getAuthenticatedUserDetails();
        long count = notificationService.getUnreadCount(user.getEmployeeId(), user.getUser().getRole());
        return ResponseEntity.ok(ApiResponse.ok(Map.of("unreadCount", count)));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long id) {
        CustomUserDetails user = getAuthenticatedUserDetails();
        notificationService.markAsRead(id, user.getEmployeeId(), user.getUser().getRole());
        return ResponseEntity.ok(ApiResponse.ok("Marked as read", null));
    }

    @PutMapping("/mark-all-read")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead() {
        CustomUserDetails user = getAuthenticatedUserDetails();
        notificationService.markAllAsRead(user.getEmployeeId(), user.getUser().getRole());
        return ResponseEntity.ok(ApiResponse.ok("All notifications marked as read", null));
    }

    private CustomUserDetails getAuthenticatedUserDetails() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (CustomUserDetails) auth.getPrincipal();
    }
}
