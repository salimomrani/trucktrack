package com.trucktrack.common.security;

import java.security.Principal;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Principal representing user information from API Gateway headers.
 * Can be injected into controllers via @AuthenticationPrincipal.
 */
public record GatewayUserPrincipal(
    String userId,
    String username,
    String role,
    String groups
) implements Principal {

    /**
     * Backwards-compatible constructor without groups.
     */
    public GatewayUserPrincipal(String userId, String username, String role) {
        this(userId, username, role, null);
    }

    @Override
    public String getName() {
        return username;
    }

    /**
     * Get list of group UUIDs the user belongs to.
     * @return List of group UUIDs, or empty list if no groups assigned
     */
    public List<UUID> getGroupIds() {
        if (groups == null || groups.isEmpty()) {
            return Collections.emptyList();
        }
        return Arrays.stream(groups.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(UUID::fromString)
                .collect(Collectors.toList());
    }

    /**
     * Check if user has any group assignments.
     */
    public boolean hasGroups() {
        return groups != null && !groups.isEmpty();
    }
}
