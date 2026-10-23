package com.ucrs.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistrationRequest {

    @NotBlank(message = "Student registration number is required")
    private String studentRegNo;

    @NotNull(message = "Offering ID is required")
    private Long offeringId;
}
