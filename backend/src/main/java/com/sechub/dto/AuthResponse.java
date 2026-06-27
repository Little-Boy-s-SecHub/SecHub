package com.sechub.dto;

public record AuthResponse(
    String token,
    String refreshToken,
    String tokenType,
    long expiresIn,
    UserDto user
) {
    public AuthResponse(String token, String refreshToken, long expiresIn, UserDto user) {
        this(token, refreshToken, "Bearer", expiresIn, user);
    }
}
