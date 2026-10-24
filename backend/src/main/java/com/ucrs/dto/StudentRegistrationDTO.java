package com.ucrs.dto;

import lombok.*;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentRegistrationDTO {
    private Long regId;
    private String studentRegNo;
    private String studentName;
    private Long offeringId;
    private String courseId;
    private String courseName;
    private String semesterName;
    private String facultyName;
    private LocalDate registrationDate;
    private String grade;
    private String status;
    private Integer credits;
    private String schedule;
    private Long semesterId;
}
