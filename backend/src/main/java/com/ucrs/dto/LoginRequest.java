package com.ucrs.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginRequest {
    private String identifier; // regNo or email
    private String password;
    private String role; // STUDENT, FACULTY, ADMIN
}
