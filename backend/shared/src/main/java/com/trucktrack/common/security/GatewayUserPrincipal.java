package com.trucktrack.common.security;

import java.security.Principal;

/**
 * Principal representing user information from API Gateway headers.
 * Can be injected into controllers via @AuthenticationPrincipal.
 */
public record GatewayUserPrincipal(
    String userId,
    String username,
    String role
) implements Principal {

    @Override
    public String getName() {
        return username;
    }
}
