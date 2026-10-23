package com.ucrs.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(
    name = "REGISTRATION",
    uniqueConstraints = @UniqueConstraint(columnNames = {"STUDENT_REGNO", "OFFERING_ID"})
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Registration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "REG_ID")
    private Long regId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "STUDENT_REGNO", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "OFFERING_ID", nullable = false)
    private CourseOffering offering;

    @Column(name = "REGISTRATION_DATE")
    private LocalDate registrationDate;

    @Column(name = "GRADE", length = 5)
    private String grade;

    @Column(name = "STATUS", length = 20)
    private String status; // REGISTERED, DROPPED, COMPLETED
}
