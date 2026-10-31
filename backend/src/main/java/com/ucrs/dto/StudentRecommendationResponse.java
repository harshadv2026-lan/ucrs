package com.ucrs.dto;

import com.ucrs.graph.GraphStats;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentRecommendationResponse {
    private String studentRegNo;
    private String studentName;
    private String departmentName;
    private Long semesterId;
    private String semesterName;
    private int currentSemesterCredits;
    private int remainingCredits;
    private int maxSemesterCredits;

    private List<String> selectedInterests;
    private List<String> availableInterests;

    private List<CourseRecommendationDTO> recommendations;
    private List<IneligibleCourseDTO> ineligibleCourses;

    private String graphEngineMode; // "LIVE_NEO4J" or "EMBEDDED_GRAPH_ENGINE"
    private GraphStats graphStats;
    private List<String> cypherQueries;
}
