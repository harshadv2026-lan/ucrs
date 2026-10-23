package com.ucrs.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "PREREQUISITE")
@IdClass(PrerequisiteId.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Prerequisite {

    @Id
    @Column(name = "COURSE_ID", length = 20)
    private String courseId;

    @Id
    @Column(name = "PREREQ_COURSE_ID", length = 20)
    private String prereqCourseId;
}
