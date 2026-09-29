package com.payroll.service;

import com.payroll.exception.BadRequestException;
import com.payroll.exception.ResourceNotFoundException;
import com.payroll.exception.UnauthorizedException;
import com.payroll.model.Notification;
import com.payroll.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
public class NotificationService {

    private static final Set<String> ALLOWED_TARGET_ROLES =
            Set.of("ROLE_ADMIN", "ROLE_HR", "ROLE_MANAGER", "ROLE_EMPLOYEE");

    private static final Set<String> ALLOWED_TYPES =
            Set.of("ANNOUNCEMENT", "LEAVE", "PAYROLL", "ATTENDANCE");

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public List<Notification> getUserNotifications(Long employeeId, String role) {
        return notificationRepository.findForUser(employeeId, role);
    }

    public long getUnreadCount(Long employeeId, String role) {
        return notificationRepository.countUnreadForUser(employeeId, role);
    }

    @Transactional
    public void markAsRead(Long id, Long employeeId, String role) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with ID: " + id));

        if (!isAddressedToUser(n, employeeId, role)) {
            throw new UnauthorizedException(
                    "Security Violation: This notification is not addressed to you.");
        }

        if (!n.isRead()) {
            n.setRead(true);
            notificationRepository.save(n);
        }
    }

    /**
     * Publishes one notification row per target role so that every recipient's
     * role matches it. An empty target set publishes a single row that matches
     * all roles.
     */
    @Transactional
    public List<Notification> broadcastNotification(String title, String message, String type,
                                                    Set<String> targetRoles, String createdBy) {
        String notificationType = (type != null && !type.isBlank())
                ? type.trim().toUpperCase()
                : "ANNOUNCEMENT";
        if (!ALLOWED_TYPES.contains(notificationType)) {
            throw new BadRequestException("Invalid notification type: " + type
                    + ". Allowed values are " + ALLOWED_TYPES);
        }

        List<Notification> created = new ArrayList<>();

        if (targetRoles == null || targetRoles.isEmpty()) {
            created.add(persistBroadcast(null, title, message, notificationType, createdBy));
        } else {
            for (String rawRole : targetRoles.stream().map(String::trim).sorted().toList()) {
                String role = rawRole.toUpperCase();
                if (role.isEmpty()) {
                    continue;
                }
                if (!ALLOWED_TARGET_ROLES.contains(role)) {
                    throw new BadRequestException("Invalid target role: " + rawRole
                            + ". Allowed values are " + ALLOWED_TARGET_ROLES);
                }
                created.add(persistBroadcast(role, title, message, notificationType, createdBy));
            }
        }

        if (created.isEmpty()) {
            throw new BadRequestException("Select at least one audience to send this notification to.");
        }

        return created;
    }

    private Notification persistBroadcast(String role, String title, String message,
                                          String type, String createdBy) {
        Notification n = new Notification(null, role, title, message, type);
        n.setCreatedBy(createdBy);
        return notificationRepository.save(n);
    }

    private boolean isAddressedToUser(Notification n, Long employeeId, String role) {
        if (employeeId != null && employeeId.equals(n.getRecipientEmployeeId())) {
            return true;
        }
        return n.getRecipientEmployeeId() == null
                && (n.getRecipientRole() == null || n.getRecipientRole().equals(role));
    }

    @Transactional
    public void markAllAsRead(Long employeeId, String role) {
        List<Notification> list = notificationRepository.findForUser(employeeId, role);
        for (Notification n : list) {
            if (!n.isRead()) {
                n.setRead(true);
            }
        }
        notificationRepository.saveAll(list);
    }

    @Transactional
    public Notification sendNotification(Long employeeId, String role, String title, String message, String type) {
        Notification n = new Notification(employeeId, role, title, message, type);
        return notificationRepository.save(n);
    }
}
