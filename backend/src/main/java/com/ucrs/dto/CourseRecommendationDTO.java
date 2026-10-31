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
public class CourseRecommendationDTO {
    private String courseId;
    private String courseName;
    private int credits;
    private String departmentName;
    private String description;

    // Offering details for current active semester
    private Long offeringId;
    private String schedule;
    private String facultyName;
    private int availableSeats;
    private int maxSeats;

    // Recommendation metrics & explanations
    private int matchScore; // 0 to 100
    private String matchLevel; // "EXCELLENT", "HIGH", "GOOD"
    private List<String> reasons; // Explainable AI rationale
    private List<String> matchedTopics;
    private List<String> prerequisitesMet;
    private boolean homeDepartmentCore;
}
