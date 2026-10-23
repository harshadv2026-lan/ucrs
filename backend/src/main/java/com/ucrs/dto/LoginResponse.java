package com.ucrs.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {
    private String token;
    private String role;
    private String name;
    private String id;
    private boolean demoMode;
}
