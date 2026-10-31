package com.ucrs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IneligibleCourseDTO {
    private String courseId;
    private String courseName;
    private int credits;
    private String departmentName;
    private Long offeringId;
    private String reasonCode; // "UNMET_PREREQUISITES", "EXCEEDS_CREDIT_LIMIT", "ALREADY_COMPLETED", "ALREADY_ENROLLED"
    private String reasonTitle;
    private String details;
    private List<String> unmetPrerequisites; // Missing prerequisite course IDs & titles
    private String canTakeWhen; // Guidance on unlocking this course
}
