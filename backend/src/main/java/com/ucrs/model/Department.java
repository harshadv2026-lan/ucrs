package com.ucrs.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "DEPARTMENT")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "DEPT_ID")
    private Long deptId;

    @Column(name = "DEPT_NAME", nullable = false, length = 100)
    private String deptName;

    // Stored as plain Long to avoid circular FK reference with Faculty
    @Column(name = "HOD_ID")
    private Long hodId;
}
