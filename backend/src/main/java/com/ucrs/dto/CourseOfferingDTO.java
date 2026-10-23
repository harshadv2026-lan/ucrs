package com.ucrs.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseOfferingDTO {
    private Long offeringId;
    private String courseId;
    private String courseName;
    private Integer credits;
    private String departmentName;
    private Long semesterId;
    private String semesterName;
    private String academicYear;
    private Long facultyId;
    private String facultyName;
    private Integer maxSeats;
    private Long registeredCount;
    private Long availableSeats;
    private String schedule;
}
