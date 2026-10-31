package com.ucrs.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "COURSE_OFFERING")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseOffering {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "OFFERING_ID")
    private Long offeringId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "COURSE_ID", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "SEMESTER_ID", nullable = false)
    private Semester semester;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "FACULTY_ID")
    private Faculty faculty;

    @Transient
    private String courseId;

    @Transient
    private Long semesterId;

    @Transient
    private Long facultyId;

    @Column(name = "MAX_SEATS", nullable = false)
    private Integer maxSeats;

    @Column(name = "SCHEDULE", length = 100)
    private String schedule;
}
