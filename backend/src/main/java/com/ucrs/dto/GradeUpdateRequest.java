package com.ucrs.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GradeUpdateRequest {
    private String grade;
}
