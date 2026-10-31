package com.ucrs.model;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDate;

@Entity
@Table(name = "STUDENT")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Student {

    @Id
    @Column(name = "STUDENT_REGNO", length = 20)
    private String studentRegNo;

    @Column(name = "FIRST_NAME", nullable = false, length = 50)
    private String firstName;

    @Column(name = "LAST_NAME", nullable = false, length = 50)
    private String lastName;

    @Column(name = "EMAIL", nullable = false, unique = true, length = 100)
    private String email;

    @Column(name = "PHONE", length = 15)
    private String phone;

    @Column(name = "DOB")
    private LocalDate dob;

    @Column(name = "GENDER", length = 10)
    private String gender;

    @Column(name = "ADDRESS", length = 255)
    private String address;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "DEPT_ID")
    private Department department;

    @Transient
    private Long deptId;

    @Column(name = "SEMESTER_NO")
    private Integer semesterNo;

    @Column(name = "CGPA")
    private Double cgpa;

    @JsonIgnore
    @Column(name = "PASSWORD", length = 100)
    private String password;
}
