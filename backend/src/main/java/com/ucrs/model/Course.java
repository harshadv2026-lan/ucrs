package com.ucrs.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "COURSE")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Course {

    @Id
    @Column(name = "COURSE_ID", length = 20)
    private String courseId;

    @Column(name = "COURSE_NAME", nullable = false, length = 100)
    private String courseName;

    @Column(name = "CREDITS", nullable = false)
    private Integer credits;

    @Column(name = "DESCRIPTION", length = 500)
    private String description;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "DEPT_ID")
    private Department department;
}
