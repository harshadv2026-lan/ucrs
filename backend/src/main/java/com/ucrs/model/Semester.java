package com.ucrs.model;

import com.fasterxml.jackson.annotation.JsonSetter;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "SEMESTER")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Semester {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "SEMESTER_ID")
    private Long semesterId;

    @Column(name = "SEMESTER_NAME", nullable = false, length = 50)
    private String semesterName;

    @Column(name = "ACADEMIC_YEAR", length = 20)
    private String academicYear;

    @Column(name = "START_DATE")
    private LocalDate startDate;

    @Column(name = "END_DATE")
    private LocalDate endDate;

    @Column(name = "IS_ACTIVE")
    private Boolean isActive;

    @JsonSetter("isActive")
    public void setIsActiveFlexible(Object val) {
        if (val instanceof Boolean b) {
            this.isActive = b;
        } else if (val instanceof String s) {
            this.isActive = "Y".equalsIgnoreCase(s) || "true".equalsIgnoreCase(s);
        } else {
            this.isActive = false;
        }
    }

    @JsonSetter("active")
    public void setActiveFlexible(Object val) {
        setIsActiveFlexible(val);
    }
}
